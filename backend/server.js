require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const passport = require("./utils/passport");
const { startDigestCron } = require("./utils/digestCron");

const authRoutes = require("./routes/auth");
const linkRoutes = require("./routes/links");
const redirectRoutes = require("./routes/redirect");

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());

// Rate limiting
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: "Too many requests." } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, message: { error: "Too many auth attempts." } });

app.use("/api/", apiLimiter);

// ── API Routes (registered BEFORE the /:code redirect catch-all) ─────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/links", linkRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", version: "3.0.0", timestamp: new Date() }));

// ── Redirect routes ───────────────────────────────────────────────────────────
// /r/verify, /r/preview, /r/info/:code  +  /:code catch-all redirect
// These are mounted at "/" but Express matches /api/* above first,
// so /:code will ONLY fire for actual short codes.
app.use("/", redirectRoutes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    startDigestCron();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🔗 Short links resolve at http://localhost:${PORT}/<code>`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
