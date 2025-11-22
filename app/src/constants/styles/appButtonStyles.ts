import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const appButtonStyles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    flexDirection: 'row',
    minHeight: 48,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabled: {
    backgroundColor: COLORS.blackTransparent,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginHorizontal: 6,
  },
  iconText: {
    marginHorizontal: 6,
  },
});

