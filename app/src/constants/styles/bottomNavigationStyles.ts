import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const bottomNavigationStyles = StyleSheet.create({
  iconWrapper: {
    paddingTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 4,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.yellow,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
});

