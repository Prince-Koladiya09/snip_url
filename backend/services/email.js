const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || "Snip <noreply@snip.app>";
const CLIENT = process.env.CLIENT_URL || "http://localhost:5173";

const send = (to, subject, html) =>
  transporter.sendMail({ from: FROM, to, subject, html });

// ── Email templates ──────────────────────────────────────────────────────────

const base = (content) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf8ff;font-family:'Nunito',sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;border:1px solid #ede9fe;box-shadow:0 8px 40px rgba(167,139,250,0.1)">
    <div style="background:linear-gradient(135deg,#a78bfa,#c084fc);padding:28px 36px;text-align:center">
      <div style="font-size:32px">🔗</div>
      <div style="color:#fff;font-size:22px;font-weight:800;margin-top:6px;letter-spacing:-0.5px">Snip</div>
    </div>
    <div style="padding:36px">${content}</div>
    <div style="padding:20px 36px;border-top:1px solid #f5f3ff;text-align:center;color:#c4b5fd;font-size:12px">
      © ${new Date().getFullYear()} Snip · Short links with a little magic 🌸
    </div>
  </div>
</body>
</html>`;

const btn = (text, url) =>
  `<a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#a78bfa,#c084fc);color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;margin-top:20px">${text}</a>`;

const h = (text) => `<h2 style="color:#3d3557;font-size:20px;margin:0 0 12px">${text}</h2>`;
const p = (text) => `<p style="color:#7c6f9a;line-height:1.7;margin:0 0 12px;font-size:15px">${text}</p>`;

// ── Exported email senders ────────────────────────────────────────────────────

exports.sendVerificationEmail = async (user, token) => {
  const url = `${CLIENT}/verify-email?token=${token}`;
  await send(user.email, "Verify your Snip email 🌸", base(`
    ${h("Welcome to Snip, " + user.name + "! 🎀")}
    ${p("You're almost ready. Just click the button below to verify your email address and activate your account.")}
    <div style="text-align:center">${btn("Verify Email →", url)}</div>
    ${p('<small style="color:#c4b5fd">This link expires in 24 hours.</small>')}
  `));
};

exports.sendPasswordResetEmail = async (user, token) => {
  const url = `${CLIENT}/reset-password?token=${token}`;
  await send(user.email, "Reset your Snip password 🔑", base(`
    ${h("Password Reset Request")}
    ${p("Hi " + user.name + ", we received a request to reset your password. Click the button below to set a new one.")}
    <div style="text-align:center">${btn("Reset Password →", url)}</div>
    ${p('<small style="color:#c4b5fd">This link expires in 1 hour. If you didn\'t request this, you can safely ignore this email.</small>')}
  `));
};

exports.sendClickDigestEmail = async (user, links) => {
  const rows = links.map(l => `
    <div style="background:#f5f3ff;border-radius:14px;padding:14px 18px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between">
      <div>
        <div style="font-weight:700;color:#5b21b6;font-size:14px">${CLIENT}/${l.code}</div>
        <div style="color:#a78bfa;font-size:12px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:300px">${l.originalUrl}</div>
      </div>
      <div style="background:linear-gradient(135deg,#a78bfa,#c084fc);color:#fff;border-radius:50px;padding:4px 14px;font-weight:800;font-size:15px;margin-left:12px">${l.clicks}</div>
    </div>`).join("");

  await send(user.email, `🎉 Your Snip links are getting clicks!`, base(`
    ${h("Click milestone reached! 🎉")}
    ${p("Hi " + user.name + ", some of your links have crossed your notification threshold. Here's a quick update:")}
    ${rows}
    <div style="text-align:center;margin-top:20px">${btn("View Dashboard →", CLIENT)}</div>
    ${p('<small style="color:#c4b5fd">You can turn off email notifications in your account settings.</small>')}
  `));
};

exports.sendWelcomeEmail = async (user) => {
  await send(user.email, "Welcome to Snip! 🌸", base(`
    ${h("You're all set, " + user.name + "! 🎀")}
    ${p("Your account is verified and ready to go. Start shortening links, tracking clicks, and sharing with the world.")}
    <div style="background:#f5f3ff;border-radius:16px;padding:20px;margin:20px 0">
      <div style="color:#5b21b6;font-weight:700;margin-bottom:10px">Quick tips:</div>
      <div style="color:#7c6f9a;font-size:14px;line-height:2">
        🔗 Create short links with custom aliases<br>
        📊 Track clicks with 7-day trend charts<br>
        🏷️ Organize links with tags and folders<br>
        🔒 Password-protect sensitive links<br>
        📅 Set expiration dates on temporary links
      </div>
    </div>
    <div style="text-align:center">${btn("Start Snipping →", CLIENT)}</div>
  `));
};
