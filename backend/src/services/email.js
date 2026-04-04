import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(to, otp) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn("[email] SMTP not configured — skipping OTP email");
    console.log(`[auth] OTP for ${to}: ${otp}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject: "TraceGuard: Your sign-in code",
    html: `
      <div style="font-family:monospace;background:#10131a;color:#e8dcc8;padding:32px;max-width:480px">
        <h2 style="color:#ffb000;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 24px">
          TraceGuard
        </h2>
        <p style="margin:0 0 8px;font-size:13px;color:#9f8e78;text-transform:uppercase;letter-spacing:0.08em">
          Your sign-in code
        </p>
        <p style="font-size:40px;font-weight:bold;letter-spacing:0.3em;color:#ffd597;margin:0 0 24px">
          ${otp}
        </p>
        <p style="font-size:11px;color:#524533;margin:0">
          Valid for 10 minutes. If you didn't request this, ignore it.
        </p>
      </div>
    `,
  });
}

export async function sendScanCompleteEmail(to, { assetName, assetType, infringementCount, scanId }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn("[email] SMTP not configured — skipping notification");
    return;
  }

  const severity = infringementCount > 0 ? "⚠ Infringements Detected" : "✓ Scan Complete — No Matches";
  const reportUrl = `${process.env.FRONTEND_ORIGIN?.split(",")[0] ?? "http://localhost:3000"}/report/${scanId}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject: `TraceGuard: ${severity} — ${assetName}`,
    html: `
      <div style="font-family:monospace;background:#10131a;color:#e8dcc8;padding:32px;max-width:600px">
        <h2 style="color:#ffb000;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 24px">
          TraceGuard Scan Report
        </h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr>
            <td style="color:#9f8e78;padding:6px 0;text-transform:uppercase;font-size:11px">Asset</td>
            <td style="padding:6px 0">${assetName}</td>
          </tr>
          <tr>
            <td style="color:#9f8e78;padding:6px 0;text-transform:uppercase;font-size:11px">Type</td>
            <td style="padding:6px 0">${assetType.toUpperCase()}</td>
          </tr>
          <tr>
            <td style="color:#9f8e78;padding:6px 0;text-transform:uppercase;font-size:11px">Infringements</td>
            <td style="padding:6px 0;color:${infringementCount > 0 ? "#ff6b35" : "#4caf7d"}">${infringementCount}</td>
          </tr>
        </table>
        <a href="${reportUrl}" style="display:inline-block;background:#ffb000;color:#10131a;padding:12px 24px;text-decoration:none;text-transform:uppercase;font-weight:bold;letter-spacing:0.1em;font-size:12px">
          View Full Report →
        </a>
        <p style="margin-top:24px;font-size:11px;color:#524533">
          Scan ID: ${scanId}
        </p>
      </div>
    `,
  });
}