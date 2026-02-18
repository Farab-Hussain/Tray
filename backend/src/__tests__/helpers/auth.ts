/**
 * Authentication helpers for testing
 */

export const adminAuth = async () => {
  // Test token is intentionally invalid for most route-level tests.
  return 'mock-admin-token';
};

export const consultantAuth = async () => {
  // Matches middleware test bypass for consultant routes.
  return 'test-token-consultant-459';
};
