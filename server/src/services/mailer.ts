import nodemailer from "nodemailer";
import { logger } from "../middleware/logger.js";

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function createTransport() {
  const host = process.env.PAPERCLIP_SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.PAPERCLIP_SMTP_PORT ?? 587),
    secure: process.env.PAPERCLIP_SMTP_SECURE === "true",
    auth: process.env.PAPERCLIP_SMTP_USER
      ? {
          user: process.env.PAPERCLIP_SMTP_USER,
          pass: process.env.PAPERCLIP_SMTP_PASS ?? "",
        }
      : undefined,
  });
}

function resolveFromAddress() {
  return process.env.PAPERCLIP_SMTP_FROM ?? "Paperclip <noreply@paperclip.local>";
}

export async function sendMail(options: MailOptions): Promise<boolean> {
  const transport = createTransport();
  if (!transport) {
    logger.warn(
      { to: options.to, subject: options.subject },
      "PAPERCLIP_SMTP_HOST not set — skipping email send",
    );
    return false;
  }

  try {
    await transport.sendMail({
      from: resolveFromAddress(),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    logger.info({ to: options.to, subject: options.subject }, "email sent");
    return true;
  } catch (err) {
    logger.error({ err, to: options.to, subject: options.subject }, "email send failed");
    return false;
  }
}

export function buildInviteEmail(params: {
  inviteUrl: string;
  companyName: string | null;
  invitedByUserName: string | null;
}): { subject: string; html: string; text: string } {
  const company = params.companyName ?? "a Paperclip workspace";
  const inviter = params.invitedByUserName ?? "Someone";
  const subject = `You've been invited to join ${company} on Paperclip`;
  const text = `${inviter} has invited you to join ${company} on Paperclip.\n\nAccept your invite:\n${params.inviteUrl}\n\nThis invite expires in 72 hours.`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#09090b;color:#f4f4f5;padding:32px;margin:0">
  <div style="max-width:480px;margin:0 auto;border:1px solid #27272a;padding:32px;background:#09090b">
    <p style="font-size:14px;color:#a1a1aa;margin:0 0 8px">You've been invited</p>
    <h1 style="font-size:20px;font-weight:600;margin:0 0 16px;color:#f4f4f5">Join ${company} on Paperclip</h1>
    <p style="font-size:14px;color:#a1a1aa;margin:0 0 24px">
      ${inviter} has invited you to join <strong style="color:#f4f4f5">${company}</strong>.
    </p>
    <a href="${params.inviteUrl}"
       style="display:inline-block;background:#f4f4f5;color:#09090b;text-decoration:none;padding:10px 20px;font-size:14px;font-weight:600">
      Accept invite
    </a>
    <p style="font-size:12px;color:#52525b;margin:24px 0 0">This invite expires in 72 hours.</p>
  </div>
</body>
</html>`;
  return { subject, html, text };
}

export function buildOtpEmail(params: {
  otp: string;
  email: string;
}): { subject: string; html: string; text: string } {
  const subject = "Your Paperclip verification code";
  const text = `Your Paperclip verification code is: ${params.otp}\n\nThis code expires in 10 minutes.`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#09090b;color:#f4f4f5;padding:32px;margin:0">
  <div style="max-width:480px;margin:0 auto;border:1px solid #27272a;padding:32px;background:#09090b">
    <p style="font-size:14px;color:#a1a1aa;margin:0 0 8px">Email verification</p>
    <h1 style="font-size:20px;font-weight:600;margin:0 0 16px;color:#f4f4f5">Your verification code</h1>
    <p style="font-size:14px;color:#a1a1aa;margin:0 0 16px">
      Enter this code to verify your email address for Paperclip.
    </p>
    <div style="font-size:32px;font-weight:700;letter-spacing:0.15em;color:#f4f4f5;margin:0 0 16px;font-family:monospace">
      ${params.otp}
    </div>
    <p style="font-size:12px;color:#52525b;margin:0">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
  </div>
</body>
</html>`;
  return { subject, html, text };
}
