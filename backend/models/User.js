const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    // OAuth
    googleId: { type: String, sparse: true },
    githubId: { type: String, sparse: true },
    avatar: { type: String, default: "" },
    provider: { type: String, enum: ["local", "google", "github"], default: "local" },
    // Email verification
    isEmailVerified: { type: Boolean, default: false },
    emailVerifyToken: String,
    emailVerifyExpires: Date,
    // Password reset
    passwordResetToken: String,
    passwordResetExpires: Date,
    // Onboarding
    onboardingCompleted: { type: Boolean, default: false },
    // Preferences
    preferences: {
      darkMode: { type: Boolean, default: false },
      emailDigest: { type: Boolean, default: true },
      digestThreshold: { type: Number, default: 100 },
    },
    lastDigestSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createEmailVerifyToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.emailVerifyToken = crypto.createHash("sha256").update(token).digest("hex");
  this.emailVerifyExpires = Date.now() + 24 * 60 * 60 * 1000;
  return token;
};

userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000;
  return token;
};

module.exports = mongoose.model("User", userSchema);
