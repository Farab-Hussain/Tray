import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import {
  AccessFeeRoleKey,
  getAccessFeeAmountForRole,
  getAccessFeeStatusForUser,
  hasPaidAccessFeeForRole,
  resolveAccessFeeRole,
} from '../services/accessFee.service';
import { getPricingSettings } from '../services/pricingSettings.service';

/**
 * Requires role-specific one-time platform access fee before proceeding.
 * @param targetRole - Force a specific role fee (e.g. student for bookings). Defaults to user's active role.
 */
export const requirePlatformAccessFee = (targetRole?: AccessFeeRoleKey) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user?.uid) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userDoc = await db.collection('users').doc(user.uid).get();
      const userData = userDoc.data() || {};

      const roles: string[] = userData.roles || (userData.role ? [userData.role] : []);
      const activeRole = userData.activeRole || userData.role || roles[0];
      const feeRole = targetRole || resolveAccessFeeRole(activeRole, roles);

      if (!feeRole) {
        return next();
      }

      const pricing = await getPricingSettings();
      const fee = getAccessFeeAmountForRole(pricing, feeRole);

      if (fee <= 0 || hasPaidAccessFeeForRole(userData, feeRole)) {
        return next();
      }

      const status = await getAccessFeeStatusForUser(userData, feeRole);

      return res.status(402).json({
        error: 'Platform access fee required',
        code: 'ACCESS_FEE_REQUIRED',
        role: feeRole,
        roleLabel: status.roleLabel,
        paymentAmount: status.amountCents,
        paymentUrl: '/payment/access-fee',
        message: `Please pay the $${fee} ${status.roleLabel} entry fee to continue`,
      });
    } catch (error) {
      console.error('Access fee middleware error:', error);
      return res.status(500).json({ error: 'Failed to verify access fee status' });
    }
  };
};
