/**
 * Transactional email via Gmail SMTP (Node runtime only — never import from the
 * edge middleware). Uses a Gmail App Password (2-Step Verification required;
 * "less secure apps" was removed by Google in 2024). The transporter is pooled
 * and cached across hot reloads so a warm TLS connection keeps OTP sends fast.
 */
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../env";

const globalForMail = globalThis as unknown as { mailer?: Transporter };

function getTransporter(): Transporter {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    throw new Error(
      "Email is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in the environment."
    );
  }
  if (globalForMail.mailer) return globalForMail.mailer;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    pool: true, // reuse one connection → faster back-to-back sends
    maxConnections: 3,
    auth: {
      user: env.GMAIL_USER,
      // App passwords are shown with spaces; Gmail accepts them with or without.
      pass: env.GMAIL_APP_PASSWORD.replace(/\s+/g, ""),
    },
  });

  // Cache UNCONDITIONALLY. This used to be `if (!env.isProd)`, which is backwards:
  // the pool exists to be reused, and skipping the cache in production meant every
  // OTP send built a fresh `pool: true` transporter and never closed it, leaking a
  // connection set per signup until Gmail answered "454 too many connections".
  // `globalThis` (rather than a module const) is what survives dev hot-reload.
  globalForMail.mailer = transporter;
  return transporter;
}

/**
 * The `From` header. `MAIL_FROM` is optional and hand-edited in deploy config, so
 * it is also where a display name with no address ends up ("Rising Brain"). That
 * is not a mailbox: nodemailer would emit `MAIL FROM:<Rising Brain>` and Gmail
 * rejects the whole message with a 5.5.2 syntax error — which took out signup and
 * password reset entirely. Treat an address-less value as the display NAME it
 * plainly is and pair it with the authenticated mailbox.
 */
const from = () => {
  const configured = env.MAIL_FROM.trim();
  if (!configured) return `RisingBrain <${env.GMAIL_USER}>`;
  if (!configured.includes("@")) return `${configured} <${env.GMAIL_USER}>`;
  return configured;
};

/** Whether email sending is configured (used to fail fast with a clear message). */
export function isMailConfigured(): boolean {
  return Boolean(env.GMAIL_USER && env.GMAIL_APP_PASSWORD);
}

interface OtpEmailOptions {
  to: string;
  code: string;
  /** Drives the copy: account verification vs. password reset. */
  purpose: "verify" | "reset";
  /** Minutes until the code expires (for the email copy). */
  ttlMinutes: number;
}

export async function sendOtpEmail({ to, code, purpose, ttlMinutes }: OtpEmailOptions): Promise<void> {
  const isVerify = purpose === "verify";
  const heading = isVerify ? "Confirm your email" : "Reset your password";
  const intro = isVerify
    ? "Use the code below to finish creating your RisingBrain account."
    : "Use the code below to reset your RisingBrain password.";
  const subject = isVerify
    ? `${code} is your RisingBrain verification code`
    : `${code} is your RisingBrain password reset code`;

  await getTransporter().sendMail({
    from: from(),
    to,
    subject,
    text: `${heading}\n\n${intro}\n\nYour code: ${code}\n\nThis code expires in ${ttlMinutes} minutes. If you didn't request it, you can safely ignore this email.`,
    html: otpHtml({ heading, intro, code, ttlMinutes }),
  });
}

/** Charcoal + green themed email matching the app's glass design language. */
function otpHtml({
  heading,
  intro,
  code,
  ttlMinutes,
}: {
  heading: string;
  intro: string;
  code: string;
  ttlMinutes: number;
}): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0f1216;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f1216;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#181b1f;border:1px solid #2a2f36;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:32px 36px;">
                <div style="display:inline-block;padding:8px 12px;border-radius:10px;background:rgba(53,164,92,0.12);color:#7fcf9c;font-size:13px;font-weight:600;letter-spacing:0.04em;">
                  Rising&#8203;Brain
                </div>
                <h1 style="margin:24px 0 8px;color:#f1f3ee;font-size:22px;font-weight:700;">${heading}</h1>
                <p style="margin:0 0 24px;color:#9aa2ab;font-size:14px;line-height:1.6;">${intro}</p>
                <div style="margin:0 0 24px;padding:20px;text-align:center;background:#0f1216;border:1px solid #2a2f36;border-radius:14px;">
                  <span style="color:#7fcf9c;font-size:34px;font-weight:700;letter-spacing:10px;font-family:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;">${code}</span>
                </div>
                <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                  This code expires in ${ttlMinutes} minutes. If you didn't request it, you can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 36px;border-top:1px solid #2a2f36;color:#6b7280;font-size:12px;">
                &copy; RisingBrain · Master DSA, pattern by pattern.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
