import nodemailer from 'nodemailer';
import { supabaseClient } from '../config/db.js';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || process.env.GMAIL_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER || 'no-reply@psxstockking.com';

let transporter = null;
if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

export const sendOTPEmail = async ({ to, otp, type = 'signup', name = '' }) => {
  const isSignup = type === 'signup';
  const subject = isSignup
    ? `Your PSX Stockking Verification Code: ${otp} (Sign Up)`
    : `Your PSX Stockking Password Reset Code: ${otp}`;

  const actionTitle = isSignup ? 'Verify Your Email Address' : 'Reset Your Password';
  const actionDesc = isSignup
    ? 'Thank you for joining PSX Alpha Terminal. Please use the 6-digit verification code below to complete your registration:'
    : 'We received a request to reset your PSX Stockking password. Use the verification code below to set a new password:';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #0B0F19; margin: 0; padding: 24px; color: #F8FAFC;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #151E2E; border: 1px solid #243044; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 22px; text-align: center;">
      <h1 style="color: #FFFFFF; font-size: 20px; margin: 0; font-weight: 800; letter-spacing: 0.5px;">PSX ALPHA TERMINAL</h1>
      <p style="color: #93C5FD; font-size: 12px; margin: 4px 0 0 0; font-weight: 600;">Pakistan Stock Exchange Financial Intelligence</p>
    </div>
    <div style="padding: 28px 24px;">
      <h2 style="color: #F8FAFC; font-size: 17px; margin: 0 0 10px 0; font-weight: 700;">${actionTitle}</h2>
      <p style="color: #94A3B8; font-size: 13px; line-height: 1.6; margin: 0 0 22px 0;">
        Hello ${name ? name : 'Investor'},<br>${actionDesc}
      </p>
      <div style="background-color: #0B0F19; border: 2px dashed #3B82F6; border-radius: 12px; padding: 18px; text-align: center; margin: 0 0 22px 0;">
        <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #60A5FA; font-family: monospace;">${otp}</span>
      </div>
      <p style="color: #64748B; font-size: 11px; margin: 0; text-align: center; line-height: 1.5;">
        ⏱️ This code is valid for <strong>10 minutes</strong>. If you did not request this code, please ignore this email.
      </p>
    </div>
    <div style="border-top: 1px solid #243044; padding: 14px 24px; background-color: #0F172A; text-align: center;">
      <p style="color: #64748B; font-size: 11px; margin: 0;">
        © 2026 PSX Stockking Terminal • Official DPS Market Telemetry
      </p>
    </div>
  </div>
</body>
</html>
  `;

  console.log(`📨 [OTP ENGINE] Generated OTP for ${to} (${type.toUpperCase()}): ${otp}`);

  // 1. Primary: Custom SMTP Transporter (if Gmail / Brevo / SMTP is configured)
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"PSX Stockking" <${FROM_EMAIL}>`,
        to,
        subject,
        html: htmlContent
      });
      console.log(`✅ [OTP EMAIL SENT VIA SMTP] To: ${to} | ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.warn(`⚠️ [SMTP ERROR] Failed to send email to ${to}: ${err.message}. Trying Supabase Auth fallback.`);
    }
  }

  // 2. Secondary: Supabase Built-in Auth Mailer
  if (supabaseClient) {
    try {
      const { error: suErr } = await supabaseClient.auth.signInWithOtp({
        email: to,
        options: {
          shouldCreateUser: type === 'signup'
        }
      });
      if (!suErr) {
        console.log(`✅ [SUPABASE AUTH EMAIL DISPATCHED] To: ${to}`);
        return { success: true, provider: 'supabase' };
      }
    } catch (e) {
      console.warn(`Supabase email notice: ${e.message}`);
    }
  }

  return { success: true, fallback: true, otp };
};