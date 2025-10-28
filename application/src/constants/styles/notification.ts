import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const notification = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  consultantName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: COLORS.gray,
  },
  time: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 10,
  },
});
