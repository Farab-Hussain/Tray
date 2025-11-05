import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const notification = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 0,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    padding: 10,
    paddingLeft: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  contentContainer: {
    flex: 1,
    // flexDirection: 'column',
    padding: 10,
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
