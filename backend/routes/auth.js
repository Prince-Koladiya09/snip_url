const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const passport = require("../utils/passport");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require("../services/email");

const router = express.Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  provider: user.provider,
  isEmailVerified: user.isEmailVerified,
  onboardingCompleted: user.onboardingCompleted,
  preferences: user.preferences,
  createdAt: user.createdAt,
});

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({ token, user: userPayload(user) });
};

// ── Signup ────────────────────────────────────────────────────────────────────
router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Please provide name, email and password." });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "An account with this email already exists." });

    const user = await User.create({ name, email, password, provider: "local" });

    try {
      const token = user.createEmailVerifyToken();
      await user.save({ validateBeforeSave: false });
      await sendVerificationEmail(user, token);
    } catch (e) {
      console.error("Verification email failed:", e.message);
    }

    sendToken(user, 201, res);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: Object.values(err.errors)[0].message });
    }
    next(err);
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Please provide email and password." });

    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    sendToken(user, 200, res);
  } catch (err) { next(err); }
});

// ── Get / Update Me ───────────────────────────────────────────────────────────
router.get("/me", protect, (req, res) => res.json({ user: userPayload(req.user) }));

router.patch("/me", protect, async (req, res, next) => {
  try {
    const { name, preferences, onboardingCompleted } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (typeof onboardingCompleted === "boolean") updates.onboardingCompleted = onboardingCompleted;
    if (preferences) {
      Object.keys(preferences).forEach(k => {
        updates[`preferences.${k}`] = preferences[k];
      });
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    res.json({ user: userPayload(user) });
  } catch (err) { next(err); }
});

// ── Change Password ───────────────────────────────────────────────────────────
router.patch("/change-password", protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Please provide current and new password." });
    if (newPassword.length < 6) return res.status(400).json({ error: "New password must be at least 6 characters." });

    const user = await User.findById(req.user._id).select("+password");
    if (user.provider !== "local") return res.status(400).json({ error: "OAuth accounts cannot change password here." });
    if (!(await user.comparePassword(currentPassword))) return res.status(401).json({ error: "Current password is incorrect." });

    user.password = newPassword;
    await user.save();
    sendToken(user, 200, res);
  } catch (err) { next(err); }
});

// ── Delete Account ────────────────────────────────────────────────────────────
router.delete("/me", protect, async (req, res, next) => {
  try {
    const Link = require("../models/Link");
    await Link.deleteMany({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "Account deleted successfully." });
  } catch (err) { next(err); }
});

// ── Verify Email ──────────────────────────────────────────────────────────────
router.post("/verify-email", async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token is required." });

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ emailVerifyToken: hashed, emailVerifyExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ error: "Invalid or expired verification token." });

    user.isEmailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    try { await sendWelcomeEmail(user); } catch (e) {}

    sendToken(user, 200, res);
  } catch (err) { next(err); }
});

router.post("/resend-verification", protect, async (req, res, next) => {
  try {
    if (req.user.isEmailVerified) return res.status(400).json({ error: "Email is already verified." });
    const token = req.user.createEmailVerifyToken();
    await req.user.save({ validateBeforeSave: false });
    await sendVerificationEmail(req.user, token);
    res.json({ message: "Verification email sent!" });
  } catch (err) { next(err); }
});

// ── Forgot / Reset Password ───────────────────────────────────────────────────
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Please provide your email." });

    const user = await User.findOne({ email });
    if (!user || user.provider !== "local") {
      return res.json({ message: "If that email exists, a reset link has been sent." });
    }

    const token = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    await sendPasswordResetEmail(user, token);
    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) { next(err); }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: "Token and new password are required." });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ passwordResetToken: hashed, passwordResetExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ error: "Invalid or expired reset token." });

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    sendToken(user, 200, res);
  } catch (err) { next(err); }
});

// ── GitHub OAuth ──────────────────────────────────────────────────────────────
router.get("/github", passport.authenticate("github", { scope: ["user:email"], session: false }));

router.get("/github/callback",
  passport.authenticate("github", { failureRedirect: `${process.env.CLIENT_URL}/auth?error=oauth_failed`, session: false }),
  (req, res) => {
    const token = signToken(req.user._id);
    res.redirect(`${process.env.CLIENT_URL}/oauth-callback?token=${token}`);
  }
);

module.exports = router;
