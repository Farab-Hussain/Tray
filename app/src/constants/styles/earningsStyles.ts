import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const earningsStyles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.orange,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    fontSize: 16,
    color: COLORS.green,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: COLORS.green,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  periodButtonTextActive: {
    color: COLORS.white,
  },
  overviewContainer: {
    marginBottom: 20,
  },
  mainEarningsCard: {
    backgroundColor: COLORS.green,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  totalEarningsLabel: {
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 8,
    opacity: 0.9,
  },
  totalEarningsAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 12,
  },
  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  growthText: {
    fontSize: 14,
    color: COLORS.white,
    marginLeft: 4,
    fontWeight: '600',
  },
  pendingEarningsCard: {
    backgroundColor: COLORS.orange,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  pendingEarningsLabel: {
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 8,
    opacity: 0.9,
  },
  pendingEarningsAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  pendingEarningsSubtitle: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.8,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
    textAlign: 'center',
  },
  transactionsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.green,
  },
  serviceTitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.gray,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '600',
  },
  analyticsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 12,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  trendValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  trendChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  serviceRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  serviceStats: {
    fontSize: 12,
    color: COLORS.gray,
  },
});

