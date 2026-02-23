const express = require("express");
const { nanoid } = require("nanoid");
// const QRCode = require("qrcode");
const bcrypt = require("bcryptjs");
const Link = require("../models/Link");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

// ✅ FIX: Use PUBLIC_URL env var for QR codes so phones can scan them.
// Set PUBLIC_URL=http://YOUR_LOCAL_IP:5000 in your .env  (e.g. http://192.168.1.5:5000)
// For production set it to your real domain e.g. https://snip.yourdomain.com
const BACKEND = () => process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
const CLIENT = () => process.env.CLIENT_URL || "http://localhost:5173";

const formatLink = (link) => ({
  id: link._id,
  code: link.code,
  originalUrl: link.originalUrl,
  shortUrl: `${BACKEND()}/${link.code}`,
  clicks: link.clicks,
  trend: link.getClickTrend(),
  isActive: link.isActive,
  isPasswordProtected: link.isPasswordProtected,
  requirePreview: link.requirePreview,
  tags: link.tags,
  folder: link.folder,
  expiresAt: link.expiresAt,
  createdAt: link.createdAt,
});

// GET /api/links
router.get("/", async (req, res, next) => {
  try {
    const { folder, tag, search } = req.query;
    const query = { user: req.user._id };
    if (folder) query.folder = folder;
    if (tag) query.tags = tag;
    if (search) query.$or = [
      { originalUrl: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
    ];

    const links = await Link.find(query).sort({ createdAt: -1 });
    const totalClicks = links.reduce((s, l) => s + l.clicks, 0);

    const allLinks = await Link.find({ user: req.user._id }).select("folder tags");
    const folders = [...new Set(allLinks.map(l => l.folder).filter(Boolean))];
    const tags = [...new Set(allLinks.flatMap(l => l.tags))];

    res.json({ links: links.map(formatLink), totalClicks, totalLinks: links.length, folders, tags });
  } catch (err) { next(err); }
});

// POST /api/links — create single link
router.post("/", async (req, res, next) => {
  try {
    let { originalUrl, customCode, expiresAt, password, requirePreview, tags, folder } = req.body;

    if (!originalUrl) return res.status(400).json({ error: "Original URL is required." });
    if (!/^https?:\/\//i.test(originalUrl)) originalUrl = "https://" + originalUrl;
    try { new URL(originalUrl); } catch { return res.status(400).json({ error: "Please provide a valid URL." }); }

    const code = customCode?.trim() || nanoid(6);
    if (!/^[a-zA-Z0-9_-]+$/.test(code)) return res.status(400).json({ error: "Alias can only contain letters, numbers, hyphens, and underscores." });
    if (code.length < 3 || code.length > 20) return res.status(400).json({ error: "Alias must be 3–20 characters." });

    const existing = await Link.findOne({ code });
    if (existing) return res.status(400).json({ error: "That alias is already taken." });

    let hashedPassword = null;
    if (password && password.trim()) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const link = await Link.create({
      user: req.user._id,
      originalUrl,
      code,
      expiresAt: expiresAt || null,
      password: hashedPassword,
      isPasswordProtected: !!(password && password.trim()),
      requirePreview: requirePreview || false,
      tags: tags || [],
      folder: folder || "default",
    });

    res.status(201).json({ link: formatLink(link) });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: "That alias is already taken." });
    next(err);
  }
});

// POST /api/links/bulk — create multiple links
router.post("/bulk", async (req, res, next) => {
  try {
    const { urls, folder, tags } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) return res.status(400).json({ error: "Please provide an array of URLs." });
    if (urls.length > 50) return res.status(400).json({ error: "Maximum 50 URLs per bulk request." });

    const results = [];
    for (const rawUrl of urls) {
      let originalUrl = rawUrl.trim();
      if (!originalUrl) continue;
      if (!/^https?:\/\//i.test(originalUrl)) originalUrl = "https://" + originalUrl;
      try {
        new URL(originalUrl);
        const code = nanoid(6);
        const link = await Link.create({ user: req.user._id, originalUrl, code, folder: folder || "default", tags: tags || [] });
        results.push({ success: true, originalUrl, link: formatLink(link) });
      } catch {
        results.push({ success: false, originalUrl, error: "Invalid URL" });
      }
    }
    res.status(201).json({ results });
  } catch (err) { next(err); }
});

// GET /api/links/:id
router.get("/:id", async (req, res, next) => {
  try {
    const link = await Link.findOne({ _id: req.params.id, user: req.user._id });
    if (!link) return res.status(404).json({ error: "Link not found." });
    res.json({ ...formatLink(link), clickHistory: link.clickHistory.slice(-50) });
  } catch (err) { next(err); }
});

// PATCH /api/links/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const { isActive, customCode, requirePreview, tags, folder, expiresAt, password } = req.body;
    const link = await Link.findOne({ _id: req.params.id, user: req.user._id });
    if (!link) return res.status(404).json({ error: "Link not found." });

    if (typeof isActive === "boolean") link.isActive = isActive;
    if (typeof requirePreview === "boolean") link.requirePreview = requirePreview;
    if (Array.isArray(tags)) link.tags = tags;
    if (folder !== undefined) link.folder = folder;
    if (expiresAt !== undefined) link.expiresAt = expiresAt;

    if (password !== undefined) {
      if (password === null || password === "") {
        link.password = null;
        link.isPasswordProtected = false;
      } else {
        link.password = await bcrypt.hash(password, 10);
        link.isPasswordProtected = true;
      }
    }

    if (customCode && customCode !== link.code) {
      const existing = await Link.findOne({ code: customCode });
      if (existing) return res.status(400).json({ error: "That alias is already taken." });
      link.code = customCode;
    }

    await link.save();
    res.json({ link: formatLink(link) });
  } catch (err) { next(err); }
});

// DELETE /api/links/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const link = await Link.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!link) return res.status(404).json({ error: "Link not found." });
    res.json({ message: "Link deleted." });
  } catch (err) { next(err); }
});

module.exports = router;