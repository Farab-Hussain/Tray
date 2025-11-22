import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const searchBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBackground,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginVertical: 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
  },
});

