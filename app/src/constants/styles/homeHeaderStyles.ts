import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const homeHeaderStyles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.green,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    marginBottom: 0,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
  },
  wave: {
    fontSize: 32,
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginTop: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginLeft: 16,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginLeft: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray,
  },
});

