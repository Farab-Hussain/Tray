import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const myApplicationsScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  browseButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  browseButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  applicationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
    lineHeight: 24,
  },
  companyName: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: '500',
  },
  ratingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightBackground,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '600',
  },
  dateContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightBackground,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
});

