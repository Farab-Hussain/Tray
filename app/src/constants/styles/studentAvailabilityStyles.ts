import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const studentAvailabilityStyles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  instructionsContainer: {
    backgroundColor: COLORS.blue,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.blue,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  calendarSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 16,
    textAlign: 'center',
  },
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noSlotsText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
    textAlign: 'center',
  },
});

