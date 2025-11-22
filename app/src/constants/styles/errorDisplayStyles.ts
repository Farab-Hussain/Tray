import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const errorDisplayStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: COLORS.orange,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    fontSize: 16,
    color: COLORS.green,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  retryButtonText: {
    fontSize: 16,
    color: COLORS.green,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

