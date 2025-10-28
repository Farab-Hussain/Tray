import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../core/colors';

const { width: screenWidth } = Dimensions.get('window');

export const summaryStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingHorizontal: screenWidth * 0.05,
    paddingVertical: screenWidth * 0.04,
    marginTop: 20,
  },
  
  // Section styling
  section: {
    marginBottom: screenWidth * 0.05,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: screenWidth * 0.03,
  },
  sectionTitle: {
    fontSize: screenWidth * 0.045,
    fontWeight: 'bold',
    color: COLORS.black,
  },

  // Payment Method styling
  paymentMethod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: screenWidth * 0.04,
    borderRadius: 12,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 40,
    height: 25,
    backgroundColor: COLORS.blue,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: screenWidth * 0.03,
  },
  cardIconText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardDetails: {
    flex: 1,
  },
  cardName: {
    fontSize: screenWidth * 0.04,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  cardNumber: {
    fontSize: screenWidth * 0.035,
    color: COLORS.gray,
  },
  checkIcon: {
    width: 24,
    height: 24,
    backgroundColor: COLORS.green,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Order Info styling
  orderBreakdown: {
    backgroundColor: COLORS.white,
    padding: screenWidth * 0.04,
    borderRadius: 12,
    marginTop: screenWidth * 0.02,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: screenWidth * 0.025,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  orderLabel: {
    fontSize: screenWidth * 0.04,
    color: COLORS.gray,
    fontWeight: '500',
  },
  orderValue: {
    fontSize: screenWidth * 0.04,
    fontWeight: '600',
    color: COLORS.black,
  },
  orderTotalLabel: {
    fontSize: screenWidth * 0.045,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  orderTotalValue: {
    fontSize: screenWidth * 0.045,
    fontWeight: 'bold',
    color: COLORS.black,
  },

  // Checkout Button styling
  checkoutButton: {
    backgroundColor: COLORS.green,
    paddingVertical: screenWidth * 0.04,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: screenWidth * 0.03,
  },
  checkoutButtonDisabled: {
    backgroundColor: COLORS.lightGray,
    opacity: 0.6,
  },
  checkoutButtonText: {
    fontSize: screenWidth * 0.045,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});
