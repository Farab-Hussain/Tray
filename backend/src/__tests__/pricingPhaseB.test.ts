/**
 * Phase B pricing — unit tests
 */
import { normalizePricingSettings, DEFAULT_PRICING } from '../services/pricingSettings.service';
import {
  getAccessFeeAmountForRole,
  hasPaidAccessFeeForRole,
} from '../services/accessFee.service';

jest.mock('../services/pricingSettings.service', () => {
  const actual = jest.requireActual('../services/pricingSettings.service');
  return {
    ...actual,
    getPricingSettings: jest.fn().mockResolvedValue({
      clientAccessFee: 25,
      consultantAccessFee: 0,
      hiringManagerAccessFee: 25,
      consultantSalesFeePercent: 10,
    }),
  };
});

const mockUserGet = jest.fn();

jest.mock('../config/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: mockUserGet,
        id: 'doc-id',
      })),
    })),
    runTransaction: jest.fn(),
  },
}));

describe('Phase B — Pricing settings', () => {
  it('normalizes defaults when fields are missing', () => {
    expect(normalizePricingSettings({})).toEqual(DEFAULT_PRICING);
  });

  it('normalizes custom admin values', () => {
    expect(
      normalizePricingSettings({
        clientAccessFee: 30,
        consultantAccessFee: 0,
        hiringManagerAccessFee: 20,
        consultantSalesFeePercent: 15,
      })
    ).toEqual({
      clientAccessFee: 30,
      consultantAccessFee: 0,
      hiringManagerAccessFee: 20,
      consultantSalesFeePercent: 15,
    });
  });

  it('migrates legacy studentConsultantFee to client only', () => {
    const normalized = normalizePricingSettings({ studentConsultantFee: 30 });
    expect(normalized.clientAccessFee).toBe(30);
    expect(normalized.consultantAccessFee).toBe(0);
  });
});

describe('Phase B — Access fee by role', () => {
  it('returns correct fee amounts per role', () => {
    const pricing = DEFAULT_PRICING;
    expect(getAccessFeeAmountForRole(pricing, 'student')).toBe(25);
    expect(getAccessFeeAmountForRole(pricing, 'consultant')).toBe(0);
    expect(getAccessFeeAmountForRole(pricing, 'recruiter')).toBe(25);
  });

  it('treats consultant as paid when fee is zero', () => {
    expect(hasPaidAccessFeeForRole({}, 'consultant')).toBe(false);
    expect(
      hasPaidAccessFeeForRole({ accessFeePaidRoles: { consultant: true } }, 'consultant')
    ).toBe(true);
  });
});

describe('Phase B — Hiring Manager job access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paid when hiring manager entry fee is paid', async () => {
    mockUserGet.mockResolvedValue({
      exists: true,
      data: () => ({ accessFeePaidRoles: { recruiter: true } }),
    });

    const { jobServices } = await import('../services/job.service');
    const result = await jobServices.checkJobPostingPayment('user-1');

    expect(result.paid).toBe(true);
    expect(result.required).toBe(false);
    expect(result.fee).toBe(25);
  });

  it('requires entry fee when not paid', async () => {
    mockUserGet.mockResolvedValue({
      exists: true,
      data: () => ({}),
    });

    const { jobServices } = await import('../services/job.service');
    const result = await jobServices.checkJobPostingPayment('user-2');

    expect(result.paid).toBe(false);
    expect(result.required).toBe(true);
    expect(result.paymentUrl).toBe('/payment/access-fee');
  });
});
