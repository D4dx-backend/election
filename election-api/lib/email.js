const nodemailer = require("nodemailer");

let transporter;

function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

function getTransporter() {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const transport = getTransporter();
  if (!transport) {
    return { sent: false, reason: "SMTP not configured" };
  }

  const from =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    "noreply@election-portal.local";

  await transport.sendMail({ from, to, subject, text, html });
  return { sent: true };
}

module.exports = { isEmailConfigured, sendMail };
