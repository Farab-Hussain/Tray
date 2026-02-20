import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const sessionCompletionStyles = StyleSheet.create({
  container: {
    padding: 20,
  },
  sessionDetailsContainer: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.black,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 5,
    color: COLORS.black,
  },
  boldText: {
    fontWeight: 'bold',
  },
  refundWarningContainer: {
    backgroundColor: COLORS.orange,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.orange,
  },
  refundWarningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 10,
  },
  refundWarningText: {
    fontSize: 14,
    color: COLORS.black,
    marginBottom: 10,
  },
  refundButton: {
    backgroundColor: COLORS.orange,
  },
  endSessionButton: {
    backgroundColor: COLORS.green,
  },
  completedContainer: {
    backgroundColor: COLORS.green,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.green,
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  completedText: {
    fontSize: 14,
    color: COLORS.white,
    marginTop: 5,
  },
  aiPanel: {
    backgroundColor: '#EEF7FF',
    borderWidth: 1,
    borderColor: '#CFE6FF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  aiPanelTitle: {
    color: '#103B66',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  aiPanelText: {
    color: '#284B69',
    fontSize: 13,
    lineHeight: 18,
  },
  aiActionButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.green,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  aiActionButtonDisabled: {
    opacity: 0.7,
  },
  aiActionButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  aiResultBox: {
    marginTop: 10,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 10,
  },
  aiResultHeading: {
    fontSize: 12,
    color: COLORS.black,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 4,
  },
  aiResultText: {
    fontSize: 12,
    color: COLORS.gray,
    lineHeight: 17,
    marginBottom: 4,
  },
});
