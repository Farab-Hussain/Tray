import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const searchBarStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderColor: COLORS.gray,
    borderRadius: 12,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBackground,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
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

