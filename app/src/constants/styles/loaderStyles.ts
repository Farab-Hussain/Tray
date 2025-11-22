import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const loaderStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  text: {
    marginTop: 16,
    color: COLORS.gray,
    fontSize: 16,
  },
});

