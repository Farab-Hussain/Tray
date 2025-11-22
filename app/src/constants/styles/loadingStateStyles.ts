import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const loadingStateStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
  },
});

