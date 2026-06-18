import { validatePasswordLength } from '../utils/passwordValidation';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  OTP_MAX_ATTEMPTS,
} from '../constants/authSecurity';

describe('passwordValidation', () => {
  it('accepts passwords within 8-128 characters', () => {
    expect(validatePasswordLength('abcdefgh')).toEqual({ valid: true });
    expect(validatePasswordLength('a'.repeat(128))).toEqual({ valid: true });
  });

  it('rejects passwords shorter than 8 characters', () => {
    const result = validatePasswordLength('short');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain(String(PASSWORD_MIN_LENGTH));
    }
  });

  it('rejects passwords longer than 128 characters', () => {
    const result = validatePasswordLength('a'.repeat(129));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain(String(PASSWORD_MAX_LENGTH));
    }
  });
});

describe('authSecurity constants', () => {
  it('uses 5 OTP max attempts', () => {
    expect(OTP_MAX_ATTEMPTS).toBe(5);
  });
});
