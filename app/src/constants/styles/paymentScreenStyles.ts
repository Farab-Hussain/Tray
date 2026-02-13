import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const paymentScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: '500',
  },

  // Hero Pricing Card
  pricingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pricingHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.green,
    marginRight: 4,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.green,
  },
  pricingSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  pricingDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  pricingFeatures: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: COLORS.black,
    fontWeight: '500',
    flex: 1,
  },

  // Benefits Section
  benefitsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 20,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  benefitCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  benefitCardDescription: {
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 18,
  },

  // Security Card
  securityCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  securityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  securityDescription: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 16,
  },
  securityBadges: {
    flexDirection: 'row',
    gap: 12,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  securityBadgeText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },

  // Policy Card
  policyCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.orange,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  policyDescription: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },

  // Buttons
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  cancelButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
  },
  payButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  payButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Legacy styles (keeping for compatibility)
  section: {
    marginBottom: 24,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  itemService: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: COLORS.gray,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.green,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: COLORS.gray,
  },
  summaryValue: {
    fontSize: 16,
    color: COLORS.black,
  },
  platformFeeInfo: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'right',
  },
  platformFeeWarning: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.orange,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.green,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  securityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  paymentButtonContainer: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  paymentButton: {
    backgroundColor: COLORS.green,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  paymentButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  paymentButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});

