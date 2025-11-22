import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const consultantSlotsStyles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  slotsContainer: {
    paddingBottom: 20,
  },
  dateCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.chatInputBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginLeft: 8,
  },
  slotCount: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  slotsList: {
    padding: 8,
  },
  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  slotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 4,
  },
  summaryCard: {
    backgroundColor: COLORS.green,
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});

