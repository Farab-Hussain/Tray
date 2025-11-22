import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { earningsStyles as styles } from '../../../constants/styles/earningsStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import Loader from '../../../components/ui/Loader';
import { useAuth } from '../../../contexts/AuthContext';
import { COLORS } from '../../../constants/core/colors';
import { DollarSign, TrendingUp, Calendar, CreditCard, Star, Users, BarChart3 } from 'lucide-react-native';
import { BookingService } from '../../../services/booking.service';
import { api } from '../../../lib/fetcher';
import { formatDate } from '../../../utils/dateUtils';
import { getStatusColor } from '../../../utils/statusUtils';
import ErrorDisplay from '../../../components/ui/ErrorDisplay';
import StatCard from '../../../components/ui/StatCard';

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

interface AnalyticsData {
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  averageRating: number;
  totalReviews: number;
  topServices: Array<{ serviceId: string; serviceTitle: string; bookingCount: number; revenue: number }>;
  bookingTrends: {
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
  clientRetention: number;
}

interface Payout {
  id: string;
  amount: number;
  platformFee: number;
  totalEarnings: number;
  bookingIds: string[];
  status: string;
  processedAt: string;
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
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchEarningsData();
    fetchPayoutHistory();
    fetchAnalytics();
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
    await Promise.all([fetchEarningsData(), fetchPayoutHistory(), fetchAnalytics()]);
    setIsRefreshing(false);
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get(`/analytics/consultant?period=${selectedPeriod}`);
      if (response.data?.success && response.data?.analytics) {
        setAnalytics(response.data.analytics);
      }
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      // Don't show error - analytics are optional
    }
  };

  const fetchPayoutHistory = async () => {
    try {
      const response = await api.get('/payment/payouts/history');
      if (response.data?.success && response.data?.payouts) {
        setPayouts(response.data.payouts);
      }
    } catch (error: any) {
      console.error('Error fetching payout history:', error);
      // Don't show error - payouts are optional
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
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
        <ErrorDisplay
          error={error}
          onRetry={fetchEarningsData}
          retryLabel="Retry"
        />
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
              {[
                {
                  value: formatCurrency(earningsData.thisMonth),
                  label: selectedPeriod === 'week' ? 'This Week' : 
                         selectedPeriod === 'month' ? 'This Month' : 'This Year'
                },
                { value: earningsData.totalClients, label: 'Total Clients' },
                { value: formatCurrency(earningsData.averagePerClient), label: 'Avg per Client' },
                {
                  value: formatCurrency(earningsData.lastMonth),
                  label: selectedPeriod === 'week' ? 'Last Week' : 
                         selectedPeriod === 'month' ? 'Last Month' : 'Last Year'
                },
              ].map((statConfig, index) => (
                <StatCard
                  key={index}
                  value={statConfig.value}
                  label={statConfig.label}
                />
              ))}
            </View>
          </View>
        )}

        {/* Analytics Section */}
        {analytics && (
          <View style={styles.transactionsSection}>
            <Text style={styles.sectionTitle}>Analytics</Text>
            
            <View style={styles.statsGrid}>
              {[
                { icon: BarChart3, iconColor: COLORS.green, value: analytics.totalBookings, label: 'Total Bookings' },
                { icon: Calendar, iconColor: COLORS.blue, value: analytics.completedBookings, label: 'Completed' },
                { icon: Star, iconColor: COLORS.orange, value: analytics.averageRating.toFixed(1), label: 'Avg Rating' },
                { icon: Users, iconColor: COLORS.purple || COLORS.green, value: `${analytics.clientRetention.toFixed(0)}%`, label: 'Retention' },
              ].map((statConfig, index) => (
                <StatCard
                  key={index}
                  icon={statConfig.icon}
                  iconSize={20}
                  iconColor={statConfig.iconColor}
                  value={statConfig.value}
                  label={statConfig.label}
                />
              ))}
            </View>

            {/* Booking Trends */}
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Booking Trends</Text>
              <View style={styles.trendRow}>
                <View style={styles.trendItem}>
                  <Text style={styles.trendLabel}>This Week</Text>
                  <Text style={styles.trendValue}>{analytics.bookingTrends.thisWeek}</Text>
                  {analytics.bookingTrends.lastWeek > 0 && (
                    <Text style={[
                      styles.trendChange,
                      { color: analytics.bookingTrends.thisWeek >= analytics.bookingTrends.lastWeek ? COLORS.green : COLORS.red }
                    ]}>
                      {analytics.bookingTrends.thisWeek >= analytics.bookingTrends.lastWeek ? '↑' : '↓'} 
                      {Math.abs(((analytics.bookingTrends.thisWeek - analytics.bookingTrends.lastWeek) / analytics.bookingTrends.lastWeek) * 100).toFixed(0)}%
                    </Text>
                  )}
                </View>
                <View style={styles.trendItem}>
                  <Text style={styles.trendLabel}>This Month</Text>
                  <Text style={styles.trendValue}>{analytics.bookingTrends.thisMonth}</Text>
                  {analytics.bookingTrends.lastMonth > 0 && (
                    <Text style={[
                      styles.trendChange,
                      { color: analytics.bookingTrends.thisMonth >= analytics.bookingTrends.lastMonth ? COLORS.green : COLORS.red }
                    ]}>
                      {analytics.bookingTrends.thisMonth >= analytics.bookingTrends.lastMonth ? '↑' : '↓'} 
                      {Math.abs(((analytics.bookingTrends.thisMonth - analytics.bookingTrends.lastMonth) / analytics.bookingTrends.lastMonth) * 100).toFixed(0)}%
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Top Services */}
            {analytics.topServices.length > 0 && (
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsTitle}>Top Services</Text>
                {analytics.topServices.map((service, index) => (
                  <View key={service.serviceId} style={styles.serviceRow}>
                    <View style={styles.serviceRank}>
                      <Text style={styles.serviceRankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.serviceTitle}</Text>
                      <Text style={styles.serviceStats}>
                        {service.bookingCount} booking{service.bookingCount !== 1 ? 's' : ''} • {formatCurrency(service.revenue)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
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
                        { backgroundColor: getStatusColor(transaction.status, 'transaction') }
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

        {/* Payout History */}
        {payouts.length > 0 && (
          <View style={styles.transactionsSection}>
            <Text style={styles.sectionTitle}>Payout History</Text>
            <View style={styles.transactionsList}>
              {payouts.slice(0, 10).map(payout => (
                <View key={payout.id} style={styles.transactionCard}>
                  <View style={styles.transactionInfo}>
                    <View style={styles.transactionHeader}>
                      <Text style={styles.clientName}>
                        Payout #{payout.id.slice(0, 8)}
                      </Text>
                      <Text style={styles.transactionAmount}>
                        {formatCurrency(payout.amount)}
                      </Text>
                    </View>
                    <Text style={styles.serviceTitle}>
                      {payout.bookingIds.length} booking{payout.bookingIds.length !== 1 ? 's' : ''} • Fee: {formatCurrency(payout.platformFee)}
                    </Text>
                    <View style={styles.transactionFooter}>
                      <Text style={styles.transactionDate}>
                        {formatDate(payout.processedAt)}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: payout.status === 'completed' ? COLORS.green : COLORS.gray }
                      ]}>
                        <Text style={styles.statusText}>
                          {payout.status === 'completed' ? 'Completed' : payout.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};


export default Earnings;
