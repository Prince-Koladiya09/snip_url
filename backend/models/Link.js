const mongoose = require("mongoose");

const clickSchema = new mongoose.Schema({
  clickedAt: { type: Date, default: Date.now },
  ip: String,
  userAgent: String,
  referrer: String,
});

const linkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalUrl: { type: String, required: [true, "Original URL is required"], trim: true },
    code: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 20 },
    clicks: { type: Number, default: 0 },
    clickHistory: [clickSchema],

    // Link management features
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },

    // Password protection
    password: { type: String, select: false, default: null },
    isPasswordProtected: { type: Boolean, default: false },

    // Organization
    tags: [{ type: String, trim: true, lowercase: true }],
    folder: { type: String, trim: true, default: "default" },

    // Preview page (show destination before redirecting)
    requirePreview: { type: Boolean, default: false },

    // Digest notification tracking
    lastNotifiedAt: { type: Number, default: 0 }, // clicks count when last notified
  },
  { timestamps: true }
);

linkSchema.index({ code: 1 });
linkSchema.index({ user: 1, createdAt: -1 });
linkSchema.index({ user: 1, folder: 1 });
linkSchema.index({ user: 1, tags: 1 });

linkSchema.methods.isExpired = function () {
  return this.expiresAt && new Date() > this.expiresAt;
};

linkSchema.methods.getClickTrend = function (days = 7) {
  const trend = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59, 999);
    const count = this.clickHistory.filter(c => c.clickedAt >= start && c.clickedAt <= end).length;
    trend.push(count);
  }
  return trend;
};

module.exports = mongoose.model("Link", linkSchema);
