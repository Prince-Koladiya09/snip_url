const cron = require("node-cron");
const User = require("../models/User");
const Link = require("../models/Link");
const { sendClickDigestEmail } = require("../services/email");

// Runs every hour — checks if any user's links crossed their threshold
const startDigestCron = () => {
  cron.schedule("0 * * * *", async () => {
    console.log("[Cron] Running click digest check...");
    try {
      const users = await User.find({ "preferences.emailDigest": true });

      for (const user of users) {
        const threshold = user.preferences.digestThreshold || 100;

        // Find links that crossed the threshold since last notification
        const links = await Link.find({
          user: user._id,
          clicks: { $gte: threshold },
          $expr: {
            $gte: [
              "$clicks",
              { $add: ["$lastNotifiedAt", threshold] },
            ],
          },
        });

        if (links.length > 0) {
          try {
            await sendClickDigestEmail(user, links);

            // Update lastNotifiedAt for each link
            for (const link of links) {
              link.lastNotifiedAt = link.clicks;
              await link.save();
            }

            user.lastDigestSentAt = new Date();
            await user.save();

            console.log(`[Cron] Digest sent to ${user.email} for ${links.length} link(s)`);
          } catch (emailErr) {
            console.error(`[Cron] Email error for ${user.email}:`, emailErr.message);
          }
        }
      }
    } catch (err) {
      console.error("[Cron] Digest cron error:", err.message);
    }
  });

  console.log("✅ Click digest cron started");
};

module.exports = { startDigestCron };
