import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const statCardStyles = StyleSheet.create({
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    // Default width for 2 cards per row
    width: '48%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray,
    textAlign: 'center',
  },
  // Variant styles
  statCardPending: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  statValuePending: {
    color: '#92400E',
  },
  statLabelPending: {
    color: '#78350F',
  },
  statCardApproved: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  statValueApproved: {
    color: '#065F46',
  },
  statLabelApproved: {
    color: '#047857',
  },
  statCardRejected: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  statValueRejected: {
    color: '#991B1B',
  },
  statLabelRejected: {
    color: '#B91C1C',
  },
});

