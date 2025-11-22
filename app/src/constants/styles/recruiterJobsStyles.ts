import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const recruiterJobsStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 20,
  },
  iconCircle: {
    backgroundColor: '#60C16947',
    borderRadius: 28,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
});

