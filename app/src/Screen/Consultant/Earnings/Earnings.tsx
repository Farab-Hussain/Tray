import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import Loader from '../../../components/ui/Loader';
import { useAuth } from '../../../contexts/AuthContext';
import { COLORS } from '../../../constants/core/colors';
import { DollarSign, TrendingUp, Calendar, CreditCard } from 'lucide-react-native';
import { BookingService } from '../../../services/booking.service';
import { api } from '../../../lib/fetcher';

interface EarningsData {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  totalClients: number;
  averagePerClient: number;
  growthRate: number;
  pendingAmount: number;
  receivedAmount: number;
}

interface Booking {
  id: string;
  studentId: string;
  consultantId: string;
  serviceId: string;
  date: string;
  time: string;
  amount: number;
  quantity: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface Transaction {
  id: string;
  clientName: string;
  serviceTitle: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
  type: 'booking' | 'consultation' | 'refund';
}

const Earnings = ({ navigation }: any) => {
  const { user } = useAuth();
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchEarningsData();
  }, [user, selectedPeriod]);

  const fetchEarningsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 [Earnings] Fetching consultant bookings...');
      console.log('👤 [Earnings] Current consultant ID:', user?.uid);
      
      // Fetch bookings from API
      const response = await BookingService.getConsultantBookings();
      const bookings: Booking[] = response.bookings || [];

      console.log('📊 [Earnings] Found', bookings.length, 'total bookings');

      // Filter bookings to only include those for the current consultant
      const consultantBookings = bookings.filter(booking => {
        const isForCurrentConsultant = booking.consultantId === user?.uid;
        if (!isForCurrentConsultant) {
          console.log(`⚠️ [Earnings] Filtering out booking ${booking.id} - not for current consultant`);
        }
        return isForCurrentConsultant;
      });

      console.log('📊 [Earnings] Found', consultantBookings.length, 'bookings for current consultant');

      // Calculate earnings data based on period
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Filter bookings based on selected period
      const filteredBookings = consultantBookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        const bookingMonth = bookingDate.getMonth();
        const bookingYear = bookingDate.getFullYear();
        
        switch (selectedPeriod) {
          case 'week':
            // Get bookings from last 7 days
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return bookingDate >= weekAgo;
          case 'month':
            return bookingMonth === currentMonth && bookingYear === currentYear;
          case 'year':
            return bookingYear === currentYear;
          default:
            return true;
        }
      });

      // Calculate earnings metrics - separate received vs pending
      // Received: Sessions completed by consultant (payment released)
      const receivedBookings = filteredBookings.filter(booking => 
        booking.paymentStatus === 'paid' && 
        (booking.status === 'completed' || booking.status === 'approved')
      );
      
      // Pending amount: bookings where consultant accepted but session not completed yet
      const pendingBookings = filteredBookings.filter(booking => 
        booking.paymentStatus === 'paid' && 
        (booking.status === 'accepted' || booking.status === 'confirmed')
      );

      const receivedAmount = receivedBookings.reduce((sum, booking) => sum + booking.amount, 0);
      const pendingAmount = pendingBookings.reduce((sum, booking) => sum + booking.amount, 0);
      const totalEarnings = receivedAmount + pendingAmount;

      // Calculate this month vs last month for growth rate (only received amounts)
      const thisMonthBookings = consultantBookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate.getMonth() === currentMonth && 
               bookingDate.getFullYear() === currentYear &&
               booking.paymentStatus === 'paid' &&
               (booking.status === 'completed' || booking.status === 'approved');
      });

      const lastMonthBookings = consultantBookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return bookingDate.getMonth() === lastMonth && 
               bookingDate.getFullYear() === lastMonthYear &&
               booking.paymentStatus === 'paid' &&
               (booking.status === 'completed' || booking.status === 'approved');
      });

      const thisMonthEarnings = thisMonthBookings.reduce((sum, booking) => sum + booking.amount, 0);
      const lastMonthEarnings = lastMonthBookings.reduce((sum, booking) => sum + booking.amount, 0);
      
      const growthRate = lastMonthEarnings > 0 
        ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 
        : 0;

      // Get unique clients who have RECEIVED earnings (completed or approved bookings only)
      const uniqueClients = new Set(receivedBookings.map(booking => booking.studentId));
      
      // Calculate total earnings per client from RECEIVED bookings only
      const clientEarningsMap = new Map<string, number>();
      receivedBookings.forEach(booking => {
        const currentEarnings = clientEarningsMap.get(booking.studentId) || 0;
        clientEarningsMap.set(booking.studentId, currentEarnings + booking.amount);
      });
      
      // Calculate average per client: sum of all client earnings / number of clients
      let averagePerClient = 0;
      if (clientEarningsMap.size > 0) {
        const totalEarningsFromClients = Array.from(clientEarningsMap.values()).reduce((sum, amount) => sum + amount, 0);
        averagePerClient = totalEarningsFromClients / clientEarningsMap.size;
        
        console.log('📊 [Earnings] Client earnings breakdown (received only):');
        clientEarningsMap.forEach((amount, clientId) => {
          console.log(`  Client ${clientId.slice(0, 8)}: $${amount}`);
        });
        console.log(`💰 [Earnings] Total from clients: $${totalEarningsFromClients}, Clients: ${clientEarningsMap.size}, Avg: $${averagePerClient}`);
        console.log(`✅ [Earnings] Received amount: $${receivedAmount}, should match total from clients: $${totalEarningsFromClients === receivedAmount ? 'YES' : 'NO'}`);
      }

      const earningsData: EarningsData = {
        totalEarnings,
        thisMonth: thisMonthEarnings,
        lastMonth: lastMonthEarnings,
        totalClients: uniqueClients.size,
        averagePerClient: Math.round(averagePerClient * 100) / 100, // Round to 2 decimal places
        growthRate: Math.round(growthRate * 10) / 10, // Round to 1 decimal place
        pendingAmount,
        receivedAmount
      };

      // Transform bookings into transactions with actual names
      // Include ALL paid bookings (both received and pending) for transaction list
      const allPaidBookings = filteredBookings.filter(booking => booking.paymentStatus === 'paid');
      const transactionsList: Transaction[] = await Promise.all(
        allPaidBookings
          .slice(0, 10) // Limit to 10 for performance
          .map(async (booking) => {
            // Fetch student details
            let studentName = `Student ${booking.studentId.slice(0, 8)}`;
            try {
              const studentResponse = await api.get(`/auth/users/${booking.studentId}`);
              if (studentResponse.data?.name) {
                studentName = studentResponse.data.name;
              }
            } catch {
              console.log(`ℹ️ Could not fetch student details for ${booking.studentId}`);
            }

            // Fetch service details
            let serviceTitle = `Service ${booking.serviceId.slice(0, 8)}`;
            try {
              const serviceResponse = await api.get(`/consultants/services/${booking.serviceId}`);
              if (serviceResponse.data?.service?.title) {
                serviceTitle = serviceResponse.data.service.title;
              } else if (serviceResponse.data?.title) {
                serviceTitle = serviceResponse.data.title;
              }
            } catch {
              console.log(`ℹ️ Could not fetch service details for ${booking.serviceId}`);
            }

            return {
              id: booking.id,
              clientName: studentName,
              serviceTitle: serviceTitle,
              amount: booking.amount,
              date: booking.date,
              status: booking.status === 'approved' || booking.status === 'completed' ? 'completed' : 
                     booking.status === 'confirmed' || booking.status === 'accepted' ? 'pending' : 
                     booking.status === 'cancelled' ? 'cancelled' : 'pending',
              type: 'booking' as const
            };
          })
      );

      // Sort transactions by date (most recent first)
      transactionsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setEarningsData(earningsData);
      setTransactions(transactionsList);

      console.log('🔍 [Earnings] Debugging booking statuses:');
      filteredBookings.forEach(booking => {
        const isReceived = booking.paymentStatus === 'paid' && 
                          (booking.status === 'completed' || booking.status === 'approved');
        const isPending = booking.paymentStatus === 'paid' && 
                         (booking.status === 'accepted' || booking.status === 'confirmed');
        
        console.log(`  Booking ${booking.id.slice(0, 8)}: status="${booking.status}", paymentStatus="${booking.paymentStatus}", amount=${booking.amount}`);
        console.log(`    → isReceived: ${isReceived}, isPending: ${isPending}`);
      });
      
      console.log('📊 [Earnings] Received bookings:', receivedBookings.length);
      console.log('📊 [Earnings] Pending bookings:', pendingBookings.length);
      console.log('💰 [Earnings] Received amount:', receivedAmount);
      console.log('💰 [Earnings] Pending amount:', pendingAmount);
      
      // Debug this month calculation
      console.log('📅 [Earnings] This month calculation:');
      thisMonthBookings.forEach(booking => {
        console.log(`  This month booking ${booking.id.slice(0, 8)}: status="${booking.status}", amount=${booking.amount}`);
      });
      console.log('💰 [Earnings] This month earnings:', thisMonthEarnings);
    } catch (err: any) {
      console.error('❌ [Earnings] Error fetching earnings:', err);
      setError(err.message || 'Failed to load earnings data. Please try again.');
      setEarningsData(null);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchEarningsData();
    setIsRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return COLORS.green;
      case 'pending':
        return COLORS.orange;
      case 'cancelled':
        return COLORS.red;
      default:
        return COLORS.gray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
        <ScreenHeader 
          title="Earnings" 
          onBackPress={() => navigation.goBack()} 
        />
        <Loader message="Loading earnings data..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
        <ScreenHeader 
          title="Earnings" 
          onBackPress={() => navigation.goBack()} 
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text 
            style={styles.retryButton}
            onPress={fetchEarningsData}
          >
            Retry
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader 
        title="Earnings" 
        onBackPress={() => navigation.goBack()} 
      />

      <ScrollView 
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.green]}
            tintColor={COLORS.green}
          />
        }
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Earnings Overview */}
        {earningsData && (
          <View style={styles.overviewContainer}>
            <View style={styles.mainEarningsCard}>
              <Text style={styles.totalEarningsLabel}>Received Earnings</Text>
              <Text style={styles.totalEarningsAmount}>
                {formatCurrency(earningsData.receivedAmount)}
              </Text>
              <View style={styles.growthContainer}>
                <TrendingUp size={16} color={earningsData.growthRate >= 0 ? COLORS.green : COLORS.red} />
                <Text style={[styles.growthText, { color: earningsData.growthRate >= 0 ? COLORS.green : COLORS.red }]}>
                  {earningsData.growthRate >= 0 ? '+' : ''}{earningsData.growthRate}% from last month
                </Text>
              </View>
            </View>

            {/* Pending Amount Card */}
            {earningsData.pendingAmount > 0 && (
              <View style={styles.pendingEarningsCard}>
                <Text style={styles.pendingEarningsLabel}>Pending Amount</Text>
                <Text style={styles.pendingEarningsAmount}>
                  {formatCurrency(earningsData.pendingAmount)}
                </Text>
                <Text style={styles.pendingEarningsSubtitle}>
                  Accepted sessions awaiting completion
                </Text>
              </View>
            )}

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatCurrency(earningsData.thisMonth)}</Text>
                <Text style={styles.statLabel}>
                  {selectedPeriod === 'week' ? 'This Week' : 
                   selectedPeriod === 'month' ? 'This Month' : 'This Year'}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{earningsData.totalClients}</Text>
                <Text style={styles.statLabel}>Total Clients</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatCurrency(earningsData.averagePerClient)}</Text>
                <Text style={styles.statLabel}>Avg per Client</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatCurrency(earningsData.lastMonth)}</Text>
                <Text style={styles.statLabel}>
                  {selectedPeriod === 'week' ? 'Last Week' : 
                   selectedPeriod === 'month' ? 'Last Month' : 'Last Year'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💰</Text>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtitle}>
                Transactions will appear here once clients book your services
              </Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.map(transaction => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionInfo}>
                    <View style={styles.transactionHeader}>
                      <Text style={styles.clientName}>{transaction.clientName}</Text>
                      <Text style={styles.transactionAmount}>
                        {formatCurrency(transaction.amount)}
                      </Text>
                    </View>
                    <Text style={styles.serviceTitle}>{transaction.serviceTitle}</Text>
                    <View style={styles.transactionFooter}>
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.date)}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(transaction.status) }
                      ]}>
                        <Text style={styles.statusText}>
                          {getStatusText(transaction.status)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
});

export default Earnings;
