import { useCallback, useEffect, useRef } from 'react';
import PaymentService from '../services/payment.service';
import { useAuth } from '../contexts/AuthContext';

const ACCESS_FEE_ROLES = ['student', 'consultant'];

/**
 * Redirects student/consultant users to the platform access payment screen when unpaid.
 */
export function usePlatformAccessFee(navigation: any, enabled = true) {
  const { activeRole, roles, user } = useAuth();
  const checkedRef = useRef(false);

  const currentRole = activeRole || (roles.length > 0 ? roles[0] : 'student');
  const needsCheck =
    enabled &&
    !!user &&
    ACCESS_FEE_ROLES.includes(currentRole);

  const checkAccessFee = useCallback(async () => {
    if (!needsCheck) return;

    try {
      const status = await PaymentService.getAccessFeeStatus();
      if (!status.paid) {
        navigation.navigate('PlatformAccessPayment');
      }
    } catch {
      // Don't block app if status check fails
    }
  }, [needsCheck, navigation]);

  useEffect(() => {
    if (!needsCheck || checkedRef.current) return;
    checkedRef.current = true;
    checkAccessFee();
  }, [needsCheck, checkAccessFee]);

  return { checkAccessFee, currentRole };
}
