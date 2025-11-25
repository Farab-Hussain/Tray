import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const allApplicationsScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  filterBar: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  combinedRow: {
    paddingVertical: 12,
  },
  combinedFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingRight: 16,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    flexShrink: 0,
  },
  filterGroupLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
    marginRight: 8,
    flexShrink: 0,
  },
  filterGroupContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  filterChipActive: {
    backgroundColor: COLORS.green,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray,
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  sortIndicator: {
    fontSize: 12,
    color: COLORS.white,
    marginLeft: 2,
  },
  subFilterRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  subFilterContainer: {
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  subFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexShrink: 0,
  },
  subFilterChipActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  subFilterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray,
  },
  subFilterChipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 12,
  },
  applicationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
    marginBottom: 4,
  },
  jobInfo: {
    fontSize: 12,
    color: COLORS.gray,
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },
  matchInfo: {
    marginBottom: 12,
  },
  matchScore: {
    fontSize: 13,
    color: COLORS.green,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

