import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';

const ACCESS_FEE_ROLES = ['student', 'consultant'];

/**
 * Requires student/consultant users to pay the one-time platform access fee.
 * Admins and recruiters are exempt.
 */
export const requirePlatformAccessFee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    if (!user?.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data() || {};

    const roles: string[] = userData.roles || (userData.role ? [userData.role] : []);
    const activeRole = userData.activeRole || userData.role || roles[0];

    const needsAccessFee =
      roles.some((r) => ACCESS_FEE_ROLES.includes(r)) ||
      ACCESS_FEE_ROLES.includes(activeRole);

    if (!needsAccessFee) {
      return next();
    }

    if (userData.hasPaidAccessFee === true || userData.accessFeeWaived === true) {
      return next();
    }

    const { getPricingSettings } = await import('../services/pricingSettings.service');
    const pricing = await getPricingSettings();

    return res.status(402).json({
      error: 'Platform access fee required',
      code: 'ACCESS_FEE_REQUIRED',
      paymentAmount: Math.round(pricing.studentConsultantFee * 100),
      paymentUrl: '/payment/access-fee',
      message: `Please pay the $${pricing.studentConsultantFee} platform access fee to continue`,
    });
  } catch (error) {
    console.error('Access fee middleware error:', error);
    return res.status(500).json({ error: 'Failed to verify access fee status' });
  }
};
