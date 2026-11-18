import test from 'node:test';
import assert from 'node:assert/strict';
import { deliverFourDigitOtp, buildOtpEmailHtml, buildOtpEmailText } from './otpDelivery.ts';

test('Gmail SMTP via Nodemailer sends OTP email using GMAIL_USER and GMAIL_APP_PASSWORD', async () => {
  const sentEmails: Array<Record<string, unknown>> = [];
  let transportOpts: Record<string, unknown> | undefined;

  const mockCreateTransport = ((opts: Record<string, unknown>) => {
    transportOpts = opts;
    return {
      sendMail: async (mail: Record<string, unknown>) => {
        sentEmails.push(mail);
        return { messageId: 'gmail_msg_1' };
      },
    };
  }) as unknown as typeof import('nodemailer').createTransport;

  const result = await deliverFourDigitOtp(
    {
      identifier: 'applicant@gmail.com',
      identifierType: 'email',
      otp: '4829',
      purpose: 'reset_password',
    },
    {
      env: {
        GMAIL_USER: 'dreamuniversity.sender@gmail.com',
        GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop',
      },
      createTransport: mockCreateTransport,
    }
  );

  assert.equal(result.sentVia, 'email');
  assert.equal(result.demoOtp, null);
  assert.equal(result.deliveryChannel, 'smtp_email');
  assert.equal(transportOpts?.service, 'gmail');
  assert.deepEqual(transportOpts?.auth, {
    user: 'dreamuniversity.sender@gmail.com',
    pass: 'abcdefghijklmnop',
  });
  assert.equal(sentEmails.length, 1);
  assert.equal(sentEmails[0].from, 'Dream University <dreamuniversity.sender@gmail.com>');
  assert.equal(sentEmails[0].to, 'applicant@gmail.com');
  assert.ok(String(sentEmails[0].html).includes('4829'));
});

test('Graceful Console Fallback: logs OTP to console and returns demoOtp when GMAIL_USER or GMAIL_APP_PASSWORD is missing', async () => {
  const loggedMessages: string[] = [];
  const mockLogger = {
    info: (...args: unknown[]) => loggedMessages.push(args.map(String).join(' ')),
    warn: (...args: unknown[]) => loggedMessages.push(args.map(String).join(' ')),
    error: (...args: unknown[]) => loggedMessages.push(args.map(String).join(' ')),
  };

  const emailResult = await deliverFourDigitOtp(
    {
      identifier: 'student@gmail.com',
      identifierType: 'email',
      otp: '1954',
      purpose: 'register',
    },
    {
      env: { GMAIL_USER: 'onlyuser@gmail.com' }, // missing GMAIL_APP_PASSWORD
      logger: mockLogger,
    }
  );

  assert.equal(emailResult.sentVia, 'demo');
  assert.equal(emailResult.demoOtp, '1954');
  assert.equal(emailResult.deliveryChannel, 'demo');
  assert.ok(
    loggedMessages.some((msg) => msg.includes('1954') && msg.includes('student@gmail.com')),
    'Should log OTP to server console when Gmail credentials are incomplete'
  );

  const phoneResult = await deliverFourDigitOtp(
    {
      identifier: '01712345678',
      identifierType: 'phone',
      otp: '6024',
      purpose: 'login',
    },
    { env: {}, logger: mockLogger }
  );

  assert.equal(phoneResult.sentVia, 'demo');
  assert.equal(phoneResult.demoOtp, '6024');
  assert.equal(phoneResult.deliveryChannel, 'demo');
});

test('Does not leak demoOtp if configured Gmail SMTP transport fails', async () => {
  const mockCreateTransport = (() => ({
    sendMail: async () => {
      throw new Error('Invalid login: 535-5.7.8 Username and Password not accepted');
    },
  })) as unknown as typeof import('nodemailer').createTransport;

  await assert.rejects(
    () =>
      deliverFourDigitOtp(
        {
          identifier: 'student@gmail.com',
          identifierType: 'email',
          otp: '9911',
          purpose: 'login',
        },
        {
          env: {
            GMAIL_USER: 'sender@gmail.com',
            GMAIL_APP_PASSWORD: 'wrong_app_password',
          },
          createTransport: mockCreateTransport,
          logger: { info: () => {}, warn: () => {}, error: () => {} },
        }
      ),
    /Username and Password not accepted/
  );
});

test('HTML and plain-text OTP email templates include code and 5-minute expiry notice', () => {
  const html = buildOtpEmailHtml({ otp: '5182', purpose: 'register' });
  const text = buildOtpEmailText({ otp: '5182', purpose: 'register' });
  assert.ok(html.includes('5182'));
  assert.ok(html.includes('5 minutes'));
  assert.ok(text.includes('5182'));
  assert.ok(text.includes('5 minutes'));
});
