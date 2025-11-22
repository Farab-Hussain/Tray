import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const notificationItemStyles = StyleSheet.create({
  unreadContainer: {
    backgroundColor: COLORS.white,
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.green,
  },
  unreadText: {
    fontWeight: '700',
    color: COLORS.green,
  },
  unreadMessage: {
    fontWeight: '600',
    color: COLORS.green,
  },
  unreadTime: {
    fontWeight: '600',
    color: COLORS.green,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatarUnreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.red,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    fontSize: 14,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 70,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.green,
    marginTop: 6,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
  },
});

