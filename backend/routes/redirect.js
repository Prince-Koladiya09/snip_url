const express = require("express");
const bcrypt = require("bcryptjs");
const Link = require("../models/Link");

const router = express.Router();

// ── Public API routes (must be defined BEFORE the /:code catch-all) ──────────

// GET /r/info/:code — public info for preview page
router.get("/r/info/:code", async (req, res, next) => {
  try {
    const link = await Link.findOne({ code: req.params.code });
    if (!link) return res.status(404).json({ error: "Link not found." });
    res.json({
      code: link.code,
      originalUrl: link.originalUrl,
      isPasswordProtected: link.isPasswordProtected,
      requirePreview: link.requirePreview,
      isActive: link.isActive,
      isExpired: link.isExpired(),
    });
  } catch (err) { next(err); }
});

// POST /r/verify — verify password for protected link
router.post("/r/verify", async (req, res, next) => {
  try {
    const { code, password } = req.body;
    if (!code || !password) return res.status(400).json({ error: "Code and password are required." });

    const link = await Link.findOne({ code }).select("+password");
    if (!link) return res.status(404).json({ error: "Link not found." });
    if (!link.isActive) return res.status(410).json({ error: "Link is inactive." });
    if (link.isExpired()) return res.status(410).json({ error: "Link has expired." });
    if (!link.isPasswordProtected) return res.status(400).json({ error: "This link is not password protected." });

    const valid = await bcrypt.compare(password, link.password);
    if (!valid) return res.status(401).json({ error: "Incorrect password." });

    await recordClick(link, req);
    res.json({ originalUrl: link.originalUrl });
  } catch (err) { next(err); }
});

// POST /r/preview — confirm redirect from preview page
router.post("/r/preview", async (req, res, next) => {
  try {
    const { code } = req.body;
    const link = await Link.findOne({ code });
    if (!link || !link.isActive || link.isExpired()) {
      return res.status(404).json({ error: "Link not found or expired." });
    }
    await recordClick(link, req);
    res.json({ originalUrl: link.originalUrl });
  } catch (err) { next(err); }
});

// ── Short link redirect — MUST be last ───────────────────────────────────────
// GET /:code — redirect to original URL
router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const CLIENT = process.env.CLIENT_URL || "http://localhost:5173";

    const link = await Link.findOne({ code }).select("+password");

    if (!link) {
      return res.status(404).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px">
          <h2>🔍 Link Not Found</h2>
          <p>This short link doesn't exist.</p>
          <a href="${CLIENT}">Go to Snip</a>
        </body></html>`);
    }

    if (!link.isActive) {
      return res.status(410).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px">
          <h2>⏸️ Link Inactive</h2>
          <p>This link has been deactivated.</p>
          <a href="${CLIENT}">Go to Snip</a>
        </body></html>`);
    }

    if (link.isExpired()) {
      return res.status(410).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px">
          <h2>⏳ Link Expired</h2>
          <p>This link has expired and is no longer active.</p>
          <a href="${CLIENT}">Go to Snip</a>
        </body></html>`);
    }

    // Password protected — redirect to frontend password page
    if (link.isPasswordProtected) {
      return res.redirect(`${CLIENT}/preview/${code}?protected=1`);
    }

    // Preview required — redirect to frontend preview page
    if (link.requirePreview) {
      return res.redirect(`${CLIENT}/preview/${code}`);
    }

    // ✅ Normal redirect — goes to ORIGINAL URL (e.g. youtube.com)
    await recordClick(link, req);
    return res.redirect(302, link.originalUrl);

  } catch (err) { next(err); }
});

async function recordClick(link, req) {
  link.clicks += 1;
  link.clickHistory.push({
    ip: req.ip || req.headers["x-forwarded-for"] || "",
    userAgent: req.headers["user-agent"] || "",
    referrer: req.headers["referer"] || "",
  });
  if (link.clickHistory.length > 1000) link.clickHistory = link.clickHistory.slice(-1000);
  await link.save();
}

module.exports = router;
