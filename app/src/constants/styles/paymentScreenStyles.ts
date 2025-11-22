import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const paymentScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 16,
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

