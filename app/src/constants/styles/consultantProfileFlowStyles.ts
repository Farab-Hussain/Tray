import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/core/colors';

export const consultantProfileFlowStyles = StyleSheet.create({
  errorContainer: {
    backgroundColor: '#FEF2F2', // Light red background
    borderColor: COLORS.red,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorTitle: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 12,
    lineHeight: 16,
  },
  warningContainer: {
    backgroundColor: '#FFFBEB', // Light orange background
    borderColor: COLORS.orange,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningTitle: {
    color: COLORS.orange,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  warningText: {
    color: COLORS.orange,
    fontSize: 12,
  },
  infoText: {
    color: COLORS.gray,
    fontSize: 12,
    fontStyle: 'italic',
  },
  summaryText: {
    color: COLORS.gray,
  },
  previousButton: {
    backgroundColor: COLORS.gray,
  },
  buttonInContainer: {
    marginHorizontal: 0,
    marginTop: 0,
    paddingVertical: 16, // Ensure consistent button height
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Review section styles
  reviewSection: {
    marginBottom: 16,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.black,
  },
  reviewSectionContent: {
    marginBottom: 16,
  },
  reviewSectionTitleLarge: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.black,
  },
  
  // Button container styles
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 24,
    gap: 12,
    marginBottom: 8,
  },
  buttonFlex: {
    flex: 1,
    minWidth: 0, // Prevents flex items from overflowing
  },
  buttonFlexFull: {
    flex: 1,
  },
  buttonFlexConditional: {
    flex: 1,
  },
  
  // Scroll view styles
  scrollView: {
    flex: 1,
  },
  
  // Container styles
  mainContainer: {
    flex: 1,
  },
  
  // Error message styles
  errorMessageContainer: {
    marginTop: 8,
  },
});
