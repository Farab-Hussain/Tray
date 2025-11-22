import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const paymentResultModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: COLORS.lightGray || '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 20,
    color: COLORS.green,
    fontWeight: '700',
  },
  sessionItem: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray || '#E0E0E0',
  },
  sessionHeader: {
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  sessionConsultant: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  sessionDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  footerNote: {
    backgroundColor: COLORS.lightGray || '#F0F8FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray || '#E0E0E0',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.green,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.green,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: '700',
  },
  orderSummarySection: {
    marginBottom: 20,
  },
  orderSummaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  orderItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  orderItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  orderItemService: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  orderItemDate: {
    fontSize: 14,
    color: COLORS.gray,
  },
  orderItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.green,
  },
  orderItemSeparator: {
    height: 1,
    backgroundColor: COLORS.lightGray || '#E0E0E0',
    marginVertical: 4,
  },
  orderTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 4,
  },
  orderTotalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  orderTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.green,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.lightBackground || '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  securityIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.gray,
    lineHeight: 18,
  },
});

