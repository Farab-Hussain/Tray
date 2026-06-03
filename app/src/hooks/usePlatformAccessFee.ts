import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  checkPlatformAccessPaid,
  needsPlatformAccessFee,
} from '../utils/platformAccessFee';

/**
 * On home load: redirect unpaid students/consultants to mandatory paywall (no back).
 */
export function usePlatformAccessFee(navigation: any, enabled = true) {
  const { activeRole, roles, user, hasPaidPlatformAccess } = useAuth();
  const checkedRef = useRef(false);

  const needsCheck =
    enabled && !!user && needsPlatformAccessFee(activeRole, roles);

  const redirectToPaywall = useCallback(async () => {
    const paid =
      hasPaidPlatformAccess || (await checkPlatformAccessPaid(activeRole));
    if (paid) {
      return;
    }

    navigation.replace('PlatformAccessPayment', { required: true, role: activeRole });
  }, [navigation, hasPaidPlatformAccess, activeRole]);

  useEffect(() => {
    if (!needsCheck || checkedRef.current) return;
    checkedRef.current = true;
    redirectToPaywall();
  }, [needsCheck, redirectToPaywall]);

  return { redirectToPaywall };
}
