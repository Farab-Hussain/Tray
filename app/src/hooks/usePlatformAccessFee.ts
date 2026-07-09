import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  checkPlatformAccessPaid,
  needsPlatformAccessFee,
} from '../utils/platformAccessFee';

/**
 * On home load: redirect unpaid students/consultants to mandatory paywall (no back).
 * Fail open on network errors so a flaky API never traps the user on a spinner/paywall loop.
 */
export function usePlatformAccessFee(navigation: any, enabled = true) {
  const { activeRole, roles, user, hasPaidPlatformAccess } = useAuth();
  const checkedRef = useRef(false);

  const needsCheck =
    enabled && !!user && needsPlatformAccessFee(activeRole, roles);

  const redirectToPaywall = useCallback(async () => {
    if (hasPaidPlatformAccess) {
      return;
    }

    try {
      const paid = await Promise.race([
        checkPlatformAccessPaid(activeRole),
        new Promise<boolean>(resolve => setTimeout(() => resolve(true), 6000)),
      ]);
      if (paid) {
        return;
      }
    } catch {
      // Network/API failure — do not force paywall
      return;
    }

    navigation.replace('PlatformAccessPayment', {
      required: true,
      role: activeRole,
    });
  }, [navigation, hasPaidPlatformAccess, activeRole]);

  useEffect(() => {
    if (!needsCheck || checkedRef.current) return;
    if (hasPaidPlatformAccess) {
      checkedRef.current = true;
      return;
    }
    checkedRef.current = true;
    redirectToPaywall();
  }, [needsCheck, redirectToPaywall, hasPaidPlatformAccess]);

  return { redirectToPaywall };
}
