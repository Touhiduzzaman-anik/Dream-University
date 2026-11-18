import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidBangladeshPhone,
  isValidEmail,
  isValidFourDigitOtp,
  isValidGpa,
  normalizeBangladeshPhone,
  parseAndValidateAuthIdentifier,
  validateLoginCredentials,
  validateOtpReset,
  validateStudentRegistration,
} from './validation.ts';

test('validates Bangladeshi mobile numbers strictly (013-019 only)', () => {
  assert.equal(isValidBangladeshPhone('01712345678'), true);
  assert.equal(isValidBangladeshPhone('+8801812345678'), true);
  assert.equal(isValidBangladeshPhone('01312345678'), true);
  assert.equal(isValidBangladeshPhone('01912-345678'), true);
  assert.equal(normalizeBangladeshPhone('+8801712345678'), '01712345678');

  // Invalid prefixes or non-BD numbers rejected
  assert.equal(isValidBangladeshPhone('01212345678'), false);
  assert.equal(isValidBangladeshPhone('01112345678'), false);
  assert.equal(isValidBangladeshPhone('8801712345678'), false); // missing + on 88 prefix per /^(?:\+88)?01[3-9]\d{8}$/
  assert.equal(isValidBangladeshPhone('+14155551234'), false);
  assert.equal(isValidBangladeshPhone('12345'), false);
});

test('validates RFC emails and blocks dummy/disposable addresses', () => {
  assert.equal(isValidEmail('student@dreamuniversity.edu.bd'), true);
  assert.equal(isValidEmail('tanvir.ahmed@gmail.com'), true);
  assert.equal(isValidEmail('student@du.ac.bd'), true);

  // Reject malformed & dummy/disposable patterns
  assert.equal(isValidEmail('invalid-email'), false);
  assert.equal(isValidEmail('test@test.com'), false);
  assert.equal(isValidEmail('abc@abc.com'), false);
  assert.equal(isValidEmail('123@123.com'), false);
  assert.equal(isValidEmail('foo@foo.com'), false);
  assert.equal(isValidEmail('user@mailinator.com'), false);
  assert.equal(isValidEmail('aaa@gmail.com'), false);
});

test('parseAndValidateAuthIdentifier detects Email vs BD Mobile cleanly', () => {
  const emailParsed = parseAndValidateAuthIdentifier('student@dreamuniversity.edu.bd');
  assert.equal(emailParsed.ok, true);
  if (emailParsed.ok) {
    assert.equal(emailParsed.identifierType, 'email');
    assert.equal(emailParsed.identifier, 'student@dreamuniversity.edu.bd');
    assert.equal(emailParsed.maskedDestination, 'stu***@dreamuniversity.edu.bd');
  }

  const phoneParsed = parseAndValidateAuthIdentifier('+8801712345678');
  assert.equal(phoneParsed.ok, true);
  if (phoneParsed.ok) {
    assert.equal(phoneParsed.identifierType, 'phone');
    assert.equal(phoneParsed.identifier, '01712345678');
    assert.equal(phoneParsed.maskedDestination, '017****5678');
  }

  const rejectedDummy = parseAndValidateAuthIdentifier('test@test.com');
  assert.equal(rejectedDummy.ok, false);

  const rejectedPhone = parseAndValidateAuthIdentifier('01299887766');
  assert.equal(rejectedPhone.ok, false);

  assert.equal(isValidGpa(5.0), true);
  assert.equal(isValidGpa(5.25), false);
});

test('validateStudentRegistration, validateLoginCredentials, and 4-digit OTP reset work accurately', () => {
  const regErrs = validateStudentRegistration({
    fullName: 'A',
    identifier: 'test@test.com',
    password: '123',
  });
  assert.equal(regErrs.fullName, 'errNameRequired');
  assert.ok(regErrs.identifier);
  assert.equal(regErrs.password, 'errPasswordShort');

  const validPhoneReg = validateStudentRegistration({
    fullName: 'Nusrat Jahan',
    identifier: '01711223344',
    password: 'StrongPassword1',
  });
  assert.deepEqual(validPhoneReg, {});

  assert.equal(
    Object.keys(
      validateLoginCredentials({
        identifier: 'tanvir@gmail.com',
        password: 'password123',
      })
    ).length,
    0
  );
  assert.equal(
    validateLoginCredentials({
      identifier: 'owner@dreamuniversity.edu.bd',
      password: '',
    }).password,
    'errPasswordRequired'
  );

  assert.equal(isValidFourDigitOtp('4829'), true);
  assert.equal(isValidFourDigitOtp('123456'), false);
  assert.equal(isValidFourDigitOtp('12a4'), false);

  const otpResetErrs = validateOtpReset({
    identifier: 'tanvir@gmail.com',
    otp: '12345',
    newPassword: 'password123',
    confirmPassword: 'differentPassword',
  });
  assert.equal(otpResetErrs.otp, 'errOtpInvalid');
  assert.equal(otpResetErrs.confirmPassword, 'Passwords do not match.');

  assert.deepEqual(
    validateOtpReset({
      identifier: '01712345678',
      otp: '4829',
      newPassword: 'password123',
      confirmPassword: 'password123',
    }),
    {}
  );
});
