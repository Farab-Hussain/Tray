/**
 * Phase B pricing — unit tests
 */
import { normalizePricingSettings, DEFAULT_PRICING } from '../services/pricingSettings.service';

jest.mock('../services/pricingSettings.service', () => {
  const actual = jest.requireActual('../services/pricingSettings.service');
  return {
    ...actual,
    getPricingSettings: jest.fn().mockResolvedValue({
      studentConsultantFee: 25,
      recruiterPostingFee: 5,
      recruiterPostingsPerBundle: 3,
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
        studentConsultantFee: 30,
        recruiterPostingFee: 10,
        recruiterPostingsPerBundle: 5,
      })
    ).toEqual({
      studentConsultantFee: 30,
      recruiterPostingFee: 10,
      recruiterPostingsPerBundle: 5,
    });
  });
});

describe('Phase B — Job posting credits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paid when user has credits', async () => {
    mockUserGet.mockResolvedValue({
      exists: true,
      data: () => ({ jobPostingCredits: 2 }),
    });

    const { jobServices } = await import('../services/job.service');
    const result = await jobServices.checkJobPostingPayment('user-1');

    expect(result.paid).toBe(true);
    expect(result.creditsRemaining).toBe(2);
    expect(result.bundleFee).toBe(5);
    expect(result.postingsPerBundle).toBe(3);
  });

  it('requires bundle purchase when credits are zero', async () => {
    mockUserGet.mockResolvedValue({
      exists: true,
      data: () => ({ jobPostingCredits: 0 }),
    });

    const { jobServices } = await import('../services/job.service');
    const result = await jobServices.checkJobPostingPayment('user-2');

    expect(result.paid).toBe(false);
    expect(result.creditsRemaining).toBe(0);
    expect(result.amount).toBe(500);
    expect(result.paymentUrl).toBe('/payment/job-posting');
  });
});
