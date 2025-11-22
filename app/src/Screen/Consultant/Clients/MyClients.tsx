import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
// import SearchBar from '../../../components/shared/SearchBar';
import { useAuth } from '../../../contexts/AuthContext';
import { COLORS } from '../../../constants/core/colors';
import { MessageCircle, User, Search } from 'lucide-react-native';
import ErrorDisplay from '../../../components/ui/ErrorDisplay';
import LoadingState from '../../../components/ui/LoadingState';
import { BookingService } from '../../../services/booking.service';
import { api } from '../../../lib/fetcher';

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

interface Client {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentProfileImage?: string;
  totalBookings: number;
  totalSpent: number;
  lastBookingDate: string;
}

const MyClients = ({ navigation }: any) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const isFetchingRef = useRef(false);

  // Debounced fetch function to prevent rapid successive calls
  const fetchMyClients = useCallback(async (forceRefresh = false) => {
    if (!user?.uid || isFetchingRef.current) return;

    // Prevent rapid successive calls (debounce)
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < 3000) {
      console.log('🚫 [MyClients] Skipping fetch - too soon since last fetch');
      return;
    }

    isFetchingRef.current = true;
    setLastFetchTime(now);

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 [MyClients] Fetching consultant bookings...');

      // Fetch bookings from API
      const response = await BookingService.getConsultantBookings();
      const bookings: Booking[] = response.bookings || [];

      console.log('📊 [MyClients] Found', bookings.length, 'total bookings');

      // Filter for approved bookings only (these are the clients)
      const approvedBookings = bookings.filter(booking => 
        booking.status === 'approved' && booking.paymentStatus === 'paid'
      );

      console.log('📊 [MyClients] Found', approvedBookings.length, 'approved bookings');

      // Transform approved bookings into client data
      const clientsMap = new Map<string, Client>();

      // Batch fetch student details to reduce API calls
      const studentIds = [...new Set(approvedBookings.map(b => b.studentId))];
      const studentDetailsMap = new Map();

      // Fetch all student details in parallel
      const studentPromises = studentIds.map(async (studentId) => {
        try {
          const studentResponse = await api.get(`/auth/users/${studentId}`);
          if (studentResponse.data) {
            studentDetailsMap.set(studentId, {
              name: studentResponse.data.name || `Student ${studentId.slice(0, 8)}`,
              email: studentResponse.data.email || `student${studentId.slice(0, 8)}@example.com`,
              profileImage: studentResponse.data.profileImage || null
            });
          }
        } catch {
          console.log(`⚠️ [MyClients] Could not fetch student details for ${studentId}`);
          studentDetailsMap.set(studentId, {
            name: `Student ${studentId.slice(0, 8)}`,
            email: `student${studentId.slice(0, 8)}@example.com`,
            profileImage: null
          });
        }
      });

      // Wait for all student requests to complete
      await Promise.all(studentPromises);

      // Process bookings using cached student data
      for (const booking of approvedBookings) {
        const studentId = booking.studentId;
        const studentDetails = studentDetailsMap.get(studentId) || {
          name: `Student ${studentId.slice(0, 8)}`,
          email: `student${studentId.slice(0, 8)}@example.com`,
          profileImage: null
        };

        if (!clientsMap.has(studentId)) {
          // Create new client entry
          clientsMap.set(studentId, {
            studentId,
            studentName: studentDetails.name,
            studentEmail: studentDetails.email,
            studentProfileImage: studentDetails.profileImage,
            totalBookings: 1,
            totalSpent: booking.amount,
            lastBookingDate: booking.date,
          });
        } else {
          // Update existing client
          const client = clientsMap.get(studentId)!;
          client.totalBookings += 1;
          client.totalSpent += booking.amount;

          // Update last booking date if this booking is more recent
          if (new Date(booking.date) > new Date(client.lastBookingDate)) {
            client.lastBookingDate = booking.date;
          }
        }
      }

      const clientsList = Array.from(clientsMap.values());

      // Sort clients by last booking date (most recent first)
      clientsList.sort(
        (a, b) =>
          new Date(b.lastBookingDate).getTime() -
          new Date(a.lastBookingDate).getTime(),
      );

      setClients(clientsList);
      setFilteredClients(clientsList);

      console.log('✅ [MyClients] Successfully loaded', clientsList.length, 'clients');
    } catch (err: any) {
      console.error('❌ [MyClients] Error fetching clients:', err);
      setError(err.message || 'Failed to load clients. Please try again.');
      setClients([]);
      setFilteredClients([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [user?.uid, lastFetchTime]);

  // Load data on component mount only
  useEffect(() => {
    if (user?.uid) {
      fetchMyClients(true);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(
        client =>
          client.studentName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          client.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMyClients(true);
  };

  const handleClientPress = (client: Client) => {
    console.log('View client:', client.studentName, client.studentId);
    // TODO: Navigate to client details or chat
  };

  const handleMessageClient = (client: Client) => {
    console.log('Message client:', client.studentName, client.studentId);
    // Navigate to chat screen with client
    navigation.navigate('ChatScreen', {
      studentId: client.studentId,
      studentName: client.studentName,
      studentEmail: client.studentEmail,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
        <ScreenHeader
          title="My Clients"
          onBackPress={() => navigation.goBack()}
        />
        <LoadingState message="Loading your clients..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
        <ScreenHeader
          title="My Clients"
          onBackPress={() => navigation.goBack()}
        />
        <ErrorDisplay
          error={error}
          onRetry={() => fetchMyClients(true)}
          retryLabel="Retry"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScreenHeader
          title="My Clients"
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          style={screenStyles.scrollViewContainer}
          contentContainerStyle={screenStyles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.green]}
            tintColor={COLORS.green}
          />
        }
      >
        {/* Header Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{clients.length}</Text>
            <Text style={styles.statLabel}>Total Clients</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              ${clients.reduce((sum, c) => sum + c.totalSpent, 0)}
            </Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your clients"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Empty State */}
        {filteredClients.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No clients found' : 'No clients yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Clients will appear here once you approve their booking requests'}
            </Text>
          </View>
        )}

        {/* Clients List */}
        {filteredClients.length > 0 && (
          <View style={styles.clientsList}>
            {filteredClients.map(client => (
              <TouchableOpacity
                key={client.studentId}
                style={styles.clientCard}
                onPress={() => handleClientPress(client)}
              >
                <View style={styles.clientInfo}>
                  <View style={styles.clientAvatar}>
                    {client.studentProfileImage ? (
                      <Image
                        source={{ uri: client.studentProfileImage }}
                        style={styles.avatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <User size={20} color="#666" />
                    )}
                  </View>
                  <View style={styles.clientDetails}>
                    <Text style={styles.clientName}>{client.studentName}</Text>
                    <Text style={styles.clientEmail}>
                      {client.studentEmail}
                    </Text>
                    <Text style={styles.clientBookingInfo}>
                      {client.totalBookings} booking
                      {client.totalBookings !== 1 ? 's' : ''} $
                      {client.totalSpent} spent
                    </Text>
                  </View>
                </View>
                <View style={styles.clientActions}>
                  <TouchableOpacity
                    style={styles.messageButton}
                    onPress={() => handleMessageClient(client)}
                  >
                    <MessageCircle size={20} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 8,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 12,
    color: '#999',
  },
  searchInput: {
    fontSize: 16,
    color: COLORS.black,
    flex: 1,
    padding: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
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
  clientsList: {
    // Remove paddingHorizontal to inherit from scrollViewContainer
  },
  clientCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  clientBookingInfo: {
    fontSize: 12,
    color: COLORS.gray,
  },
  clientActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  messageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MyClients;
