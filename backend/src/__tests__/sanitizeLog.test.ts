import { sanitizeForLog, maskToken, isDevLog } from '../utils/sanitizeLog';

describe('sanitizeLog', () => {
  it('redacts sensitive fields from objects', () => {
    expect(
      sanitizeForLog({
        email: 'user@test.com',
        otp: '123456',
        idToken: 'secret-token',
        fcmToken: 'push-token',
        nested: { newPassword: 'long-password' },
      }),
    ).toEqual({
      email: 'user@test.com',
      otp: '***',
      idToken: '***',
      fcmToken: '***',
      nested: { newPassword: '***' },
    });
  });

  it('masks token values without exposing full string', () => {
    expect(maskToken('abcdefghijklmnopqrstuvwxyz')).toBe('abcd...wxyz');
    expect(maskToken('short')).toBe('***');
  });

  it('isDevLog is true outside production', () => {
    expect(isDevLog()).toBe(true);
  });
});
