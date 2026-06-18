/**
 * Authentication helpers for testing
 */

export const adminAuth = async () => {
  // Test token is intentionally invalid for most route-level tests.
  return 'mock-admin-token';
};

export const consultantAuth = async () => {
  // Tests must mock authMiddleware; this token is not accepted by production auth.
  return 'mock-consultant-token';
};
