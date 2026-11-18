import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { getSessionSecret } from './authCrypto.ts';

export type OtpPurpose = 'login' | 'register' | 'reset_password';

export function generateFourDigitOtp(): string {
  return String(crypto.randomInt(1000, 10000));
}

export function hashOtpCode(otp: string, identifier: string, purpose: OtpPurpose): string {
  const normalized = `${purpose}:${identifier.trim().toLowerCase()}:${otp.trim()}`;
  return crypto.createHmac('sha256', getSessionSecret()).update(normalized).digest('hex');
}

export function verifyOtpHash(
  otp: string,
  identifier: string,
  purpose: OtpPurpose,
  storedHash: string
): boolean {
  const candidate = hashOtpCode(otp, identifier, purpose);
  const a = Buffer.from(candidate, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length === 0 || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export type OtpSentVia = 'email' | 'sms' | 'demo';

export type OtpDeliveryChannel = 'smtp_email' | 'webhook_email' | 'webhook_sms' | 'demo';

export interface OtpDeliveryResult {
  sentVia: OtpSentVia;
  demoOtp: string | null;
  deliveryChannel: OtpDeliveryChannel;
}

export interface OtpDeliveryDeps {
  fetchImpl?: typeof fetch;
  createTransport?: typeof nodemailer.createTransport;
  env?: NodeJS.ProcessEnv;
  logger?: Pick<Console, 'info' | 'warn' | 'error'>;
}

function getEmailSubject(purpose: OtpPurpose): string {
  if (purpose === 'register') return 'Verify Your Dream University Account (4-Digit OTP)';
  if (purpose === 'reset_password') return 'Dream University Password Reset Code (4-Digit OTP)';
  return 'Your Dream University Login Verification Code';
}

function getPurposeSummary(purpose: OtpPurpose): string {
  if (purpose === 'register') {
    return 'Use the 4-digit verification code below to complete your Dream University student registration.';
  }
  if (purpose === 'reset_password') {
    return 'Use the 4-digit verification code below to reset your Dream University account password.';
  }
  return 'Use the 4-digit verification code below to sign in to your Dream University account.';
}

export function buildOtpEmailHtml(params: { otp: string; purpose: OtpPurpose }): string {
  const summary = getPurposeSummary(params.purpose);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dream University Verification Code</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 16px rgba(11,29,58,0.06);">
            <tr>
              <td style="background:linear-gradient(135deg,#00695C 0%,#00796B 100%);padding:24px 28px;">
                <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#B2DFDB;">
                  Dream University Bangladesh
                </p>
                <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;color:#ffffff;">
                  4-Digit Verification Code
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#475569;">
                  ${summary}
                </p>
                <div style="margin:22px 0;padding:18px 20px;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;text-align:center;">
                  <span style="display:inline-block;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:34px;font-weight:800;letter-spacing:10px;color:#0F172A;padding-left:10px;">
                    ${params.otp}
                  </span>
                </div>
                <p style="margin:0 0 10px;font-size:13px;line-height:1.5;color:#475569;">
                  This code expires in <strong>5 minutes</strong>. Never share your verification code with anyone.
                </p>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">
                  If you did not request this code, you can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#f8fafc;padding:14px 28px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;">
                Dream University Admission Intelligence Portal
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildOtpEmailText(params: { otp: string; purpose: OtpPurpose }): string {
  return `${getPurposeSummary(params.purpose)}\n\nYour 4-digit OTP code: ${params.otp}\n\nThis code is valid for 5 minutes. Do not share it with anyone.`;
}

export async function deliverFourDigitOtp(
  params: {
    identifier: string;
    identifierType: 'email' | 'phone';
    otp: string;
    purpose: OtpPurpose;
  },
  deps: OtpDeliveryDeps = {}
): Promise<OtpDeliveryResult> {
  const { identifier, identifierType, otp, purpose } = params;
  const env = deps.env ?? process.env;
  const fetchFn = deps.fetchImpl ?? fetch;
  const createTransportFn = deps.createTransport ?? nodemailer.createTransport;
  const logger = deps.logger ?? console;

  if (identifierType === 'email') {
    const gmailUser = (env.GMAIL_USER || env.SMTP_EMAIL)?.trim();
    const rawAppPassword = (env.GMAIL_APP_PASSWORD || env.SMTP_APP_PASSWORD)?.trim();
    const gmailAppPassword = rawAppPassword ? rawAppPassword.replace(/\s+/g, '') : '';
    const emailWebhookUrl = env.EMAIL_OTP_WEBHOOK_URL?.trim();

    const hasGmailSmtp = Boolean(gmailUser && gmailAppPassword);
    const hasWebhook = Boolean(emailWebhookUrl);

    const subject = getEmailSubject(purpose);
    const html = buildOtpEmailHtml({ otp, purpose });
    const text = buildOtpEmailText({ otp, purpose });

    let lastError: unknown = null;

    // Priority 1: Gmail SMTP via Nodemailer (GMAIL_USER + GMAIL_APP_PASSWORD)
    if (hasGmailSmtp && gmailUser) {
      try {
        const transporter = createTransportFn({
          service: 'gmail',
          auth: {
            user: gmailUser,
            pass: gmailAppPassword,
          },
        });
        await transporter.sendMail({
          from: `Dream University <${gmailUser}>`,
          to: identifier,
          subject,
          html,
          text,
        });

        return {
          sentVia: 'email',
          demoOtp: null,
          deliveryChannel: 'smtp_email',
        };
      } catch (err) {
        lastError = err;
        logger.error('Gmail SMTP OTP delivery failed:', err);
      }
    }

    // Optional Email Webhook fallback
    if (hasWebhook && emailWebhookUrl) {
      try {
        const response = await fetchFn(emailWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(env.EMAIL_OTP_WEBHOOK_SECRET
              ? { Authorization: `Bearer ${env.EMAIL_OTP_WEBHOOK_SECRET}` }
              : {}),
          },
          body: JSON.stringify({
            to: identifier,
            subject,
            otp,
            purpose,
            expiresMinutes: 5,
          }),
        });
        if (response.ok) {
          return {
            sentVia: 'email',
            demoOtp: null,
            deliveryChannel: 'webhook_email',
          };
        }
        lastError = new Error(`Email webhook failed with status ${response.status}`);
      } catch (err) {
        lastError = err;
        logger.error('Email OTP webhook failed:', err);
      }
    }

    // If Gmail SMTP or Webhook was configured but failed, surface error instead of exposing OTP on screen
    if (hasGmailSmtp || hasWebhook) {
      throw lastError instanceof Error
        ? lastError
        : new Error('Unable to send OTP verification email via Gmail SMTP.');
    }

    // Graceful server console fallback when GMAIL_USER / GMAIL_APP_PASSWORD are not set
    logger.warn(
      `[OTP Console Fallback] GMAIL_USER or GMAIL_APP_PASSWORD is missing. 4-digit OTP for ${identifier} (${purpose}): ${otp}`
    );

    return {
      sentVia: 'demo',
      demoOtp: otp,
      deliveryChannel: 'demo',
    };
  }

  // Bangladeshi mobile phone delivery (optional SMS webhook or console sandbox fallback)
  const smsWebhookUrl = env.SMS_OTP_WEBHOOK_URL?.trim();
  if (smsWebhookUrl) {
    const response = await fetchFn(smsWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.SMS_OTP_WEBHOOK_SECRET
          ? { Authorization: `Bearer ${env.SMS_OTP_WEBHOOK_SECRET}` }
          : {}),
      },
      body: JSON.stringify({
        to: `+88${identifier}`,
        message: `Your Dream University 4-digit OTP is ${otp}. Valid for 5 minutes.`,
        purpose,
      }),
    });
    if (!response.ok) {
      throw new Error(`SMS gateway error (${response.status})`);
    }
    return {
      sentVia: 'sms',
      demoOtp: null,
      deliveryChannel: 'webhook_sms',
    };
  }

  logger.info(`[OTP Console Fallback] SMS gateway not configured. 4-digit OTP for ${identifier} (${purpose}): ${otp}`);
  return {
    sentVia: 'demo',
    demoOtp: otp,
    deliveryChannel: 'demo',
  };
}
