import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp-relay.brevo.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USERNAME;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    console.warn("⚠️ SMTP credentials not configured (SMTP_USERNAME / SMTP_PASSWORD)");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user: user || "",
      pass: pass || "",
    },
  });
}

interface SendOtpEmailOptions {
  to: string;
  otp: string;
  name?: string;
}

export async function sendOtpEmail({ to, otp, name }: SendOtpEmailOptions) {
  const displayName = name || "there";
  const senderEmail =
    process.env.SENDER_EMAIL ||
    process.env.SMTP_USERNAME ||
    "noreply@annosetu.org";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>AnnoSetu Email Verification</title>
</head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(16,185,129,0.12);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#059669,#0d9488);padding:36px 40px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.18);border-radius:16px;padding:12px 20px;margin-bottom:16px;">
                <span style="font-size:28px;">🌿</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">AnnoSetu</h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;font-weight:500;letter-spacing:1px;text-transform:uppercase;">Surplus Food Rescue</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 10px;">Verify your email address</h2>
              <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 28px;">
                Hi <strong>${displayName}</strong>, welcome to AnnoSetu! Use the code below to verify your email address and activate your account.
              </p>

              <!-- OTP Box -->
              <div style="background:#f0fdf4;border:2px dashed #10b981;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
                <p style="color:#6b7280;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Your verification code</p>
                <div style="font-size:44px;font-weight:900;letter-spacing:14px;color:#059669;font-family:'Courier New',monospace;">${otp}</div>
                <p style="color:#9ca3af;font-size:12px;margin:14px 0 0;">⏳ Expires in <strong>10 minutes</strong></p>
              </div>

              <p style="color:#6b7280;font-size:13px;line-height:1.7;margin:0 0 8px;">
                Enter this code in the verification screen to complete your registration.
              </p>
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                If you didn't create an AnnoSetu account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                AnnoSetu · Reducing food waste, one meal at a time 🌱<br/>
                This is an automated message — please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: `"AnnoSetu 🌿" <${senderEmail}>`,
    to,
    subject: `${otp} is your AnnoSetu verification code`,
    html,
    text: `Your AnnoSetu verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't create an account, ignore this email.`,
  });

  return info;
}
