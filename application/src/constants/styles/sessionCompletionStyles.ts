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
});
