import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import HomeHeader from '../../../components/shared/HomeHeader';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ConsultantCard from '../../../components/ui/ConsultantCard';
import TopConsultantCard from '../../../components/ui/TopConsultantCard';
import { ConsultantService } from '../../../services/consultant.service';
import { BookingService } from '../../../services/booking.service';
import { showWarning, showError } from '../../../utils/toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useChatContext } from '../../../contexts/ChatContext';
import { useRefresh } from '../../../hooks/useRefresh';

const Home = ({ navigation }: any) => {
  const [topConsultant, setTopConsultant] = useState<any>(null);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageCacheKey, setImageCacheKey] = useState(0);
  const { user, activeRole, roles } = useAuth();
  const { openChatWith } = useChatContext();

  // Check if user is a recruiter
  const isRecruiter = activeRole === 'recruiter' || roles.includes('recruiter');

  // Handle icon presses (message, phone, video)
  const handleIconPress = async (
    iconType: 'message' | 'phone' | 'video',
    consultantId: string,
    consultant: any,
    navigation: any,
    user: any,
    openChatWith: any,
  ) => {
    try {
      const bookings = await BookingService.getMyBookings();
      const studentBookings = bookings?.bookings || [];
      const consultantBookings = studentBookings.filter(
        (booking: any) => booking.consultantId === consultantId,
      );
      const pendingBooking = consultantBookings.find(
        (booking: any) => booking.status === 'pending',
      );
      const accessCheck = await BookingService.checkAccess(consultantId);

      if (!accessCheck?.hasAccess) {
        let alertMessage = '';

        if (pendingBooking) {
          alertMessage = `Your booking with ${
            consultant.name
          } is pending confirmation. Please wait for the consultant to confirm your booking before you can ${
            iconType === 'message'
              ? 'send messages'
              : iconType === 'phone'
              ? 'make audio calls'
              : 'make video calls'
          }.`;
        } else {
          alertMessage =
            accessCheck?.message ||
            `You need an active paid session with ${consultant.name} before using this feature.`;
        }

        Alert.alert('Session Access Required', alertMessage, [
          {
            text: pendingBooking ? 'View Booking' : 'Book Now',
            onPress: () => {
              navigation.navigate('MainTabs', {
                screen: 'Services',
                params: {
                  screen: 'ServicesScreen',
                  params: {
                    consultantId: consultantId,
                    consultantName: consultant.name,
                    consultantCategory: consultant.category,
                  },
                },
              });
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]);
        return;
      }

      // Student has valid access - proceed with action
      if (iconType === 'message') {
        // Open chat
        if (!user?.uid) {
          showError('You must be logged in to send messages');
          return;
        }

        try {
          const chatId = await openChatWith(consultantId);
          navigation.navigate('ChatScreen', {
            chatId,
            otherUserId: consultantId,
            consultant: {
              name: consultant.name,
              title: consultant.category || 'Consultant',
              avatar: consultant.profileImage
                ? { uri: consultant.profileImage }
                : require('../../../assets/image/avatar.png'),
              isOnline: true,
            },
          });
        } catch (error) {
          if (__DEV__) {
            console.error('Error opening chat:', error);
          }
          showError('Failed to open chat');
        }
      } else if (iconType === 'phone') {
        // Initiate audio call
        if (!user?.uid) {
          showError('You must be logged in to make calls');
          return;
        }

        // Generate callId: callerId_receiverId-timestamp
        const callId = `${user.uid}_${consultantId}-${Date.now()}`;

        // Navigate to audio call screen with proper parameters
        navigation.navigate('CallingScreen', {
          callId,
          callerId: user.uid,
          receiverId: consultantId,
          isCaller: true,
        });
      } else if (iconType === 'video') {
        // Initiate video call
        if (!user?.uid) {
          showError('You must be logged in to make calls');
          return;
        }

        // Generate callId: callerId_receiverId-timestamp
        const callId = `${user.uid}_${consultantId}-${Date.now()}`;

        // Navigate to video call screen with proper parameters
        navigation.navigate('VideoCallingScreen', {
          callId,
          callerId: user.uid,
          receiverId: consultantId,
          isCaller: true,
        });
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error checking booking access:', error);
      }
      showError('Unable to verify booking status');
    }
  };

  const fetchConsultants = useCallback(async () => {
    try {
      setLoading(true);
      const [top, all] = await Promise.all([
        ConsultantService.getTopConsultants(),
        ConsultantService.getAllConsultants(),
      ]);

      // Extract data from API response structure
      // Find the consultant with the highest rating (Tray with 5.0)
      const topConsultants = top?.topConsultants || [];
      const topConsultantData =
        topConsultants.length > 0
          ? topConsultants.reduce((highest: any, current: any) =>
              current.rating > highest.rating ? current : highest,
            )
          : null;

      const allConsultantsData = all?.consultants || [];

      const filteredConsultants = allConsultantsData.filter(
        (consultant: any) => consultant.uid !== topConsultantData?.uid,
      );

      // Backend now handles sorting by rating and reviews
      if (__DEV__) {
        console.log(
          '⭐ Selected Top Consultant:',
          topConsultantData?.name,
          'with rating:',
          topConsultantData?.rating,
        );
      }
      if (__DEV__) {
        console.log(
          '📊 Other Consultants:',
          filteredConsultants.length,
          'consultants',
        );
      }

      setTopConsultant(topConsultantData);
      setConsultants(filteredConsultants);
      // Update cache key to force image reload
      setImageCacheKey(prev => prev + 1);
    } catch (err) {
      if (__DEV__) {
        console.error('Error fetching consultants:', err);
      }
      showWarning('Unable to load consultants. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  const { refreshing, handleRefresh } = useRefresh(fetchConsultants);

  useEffect(() => {
    fetchConsultants();
  }, [fetchConsultants]);

  // Reload consultants when screen comes into focus (to get updated profile images)
  useFocusEffect(
    useCallback(() => {
      fetchConsultants();
    }, [fetchConsultants]),
  );

  // If recruiter, show different content
  if (isRecruiter) {
    return (
      <SafeAreaView style={screenStyles.safeArea} edges={['top']}>
        <HomeHeader />
        <ScrollView
          style={screenStyles.scrollViewContainer}
          contentContainerStyle={screenStyles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View
            style={{
              padding: 20,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 400,
            }}
          >
            <Text
              style={[
                screenStyles.heading,
                { marginBottom: 16, textAlign: 'center' },
              ]}
            >
              Welcome, Recruiter!
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#666',
                marginBottom: 32,
                textAlign: 'center',
                lineHeight: 24,
              }}
            >
              Manage your job postings and review applications from your Account
              screen.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('RecruiterMyJobs')}
              style={{
                backgroundColor: '#4CAF50',
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 12,
                marginBottom: 12,
                width: '100%',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                View My Jobs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('RecruiterPostJob')}
              style={{
                backgroundColor: '#4CAF50',
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 12,
                width: '100%',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                Post a New Job
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.safeArea} edges={['top']}>
      <HomeHeader />
      <ScrollView
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={screenStyles.heading}>Top Consultant</Text>

        {loading ? (
          <Text style={screenStyles.loadingText}>
            Loading top consultant...
          </Text>
        ) : topConsultant ? (
          <TopConsultantCard
            name={topConsultant.name}
            title={topConsultant.category || 'Consultant'}
            description={
              topConsultant.bio ||
              `Expert ${topConsultant.category || 'consultant'} with ${
                topConsultant.totalReviews || 0
              } reviews. Available for consultation sessions.`
            }
            avatarUri={
              topConsultant.profileImage
                ? {
                    uri: `${topConsultant.profileImage}?t=${imageCacheKey}&uid=${topConsultant.uid}`,
                  }
                : require('../../../assets/image/avatar.png')
            }
            rating={topConsultant.rating ?? 0}
            consultantId={topConsultant.uid}
            navigation={navigation}
            onChatPress={async () => {
              await handleIconPress(
                'message',
                topConsultant.uid,
                topConsultant,
                navigation,
                user,
                openChatWith,
              );
            }}
            onCallPress={() =>
              handleIconPress(
                'phone',
                topConsultant.uid,
                topConsultant,
                navigation,
                user,
                openChatWith,
              )
            }
            onVideoCallPress={() =>
              handleIconPress(
                'video',
                topConsultant.uid,
                topConsultant,
                navigation,
                user,
                openChatWith,
              )
            }
          />
        ) : (
          <Text style={screenStyles.emptyStateText}>
            No top consultant available
          </Text>
        )}

        <View style={screenStyles.section}>
          <Text style={screenStyles.heading}>Consultants</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AllConsultants')}
          >
            <Text style={screenStyles.link}>see all</Text>
          </TouchableOpacity>
        </View>

        {/* Consultant List (2 per row) - Showing 4 consultants */}
        {loading ? (
          <Text style={screenStyles.loadingText}>Loading consultants...</Text>
        ) : consultants.length > 0 ? (
          <View style={screenStyles.consultantList}>
            {consultants.slice(0, 4).map(item => (
              <View key={item.uid} style={screenStyles.consultantCardWrapper}>
                <ConsultantCard
                  name={item.name}
                  title={item.category || 'Consultant'}
                  avatarUri={
                    item.profileImage
                      ? {
                          uri: `${item.profileImage}?t=${imageCacheKey}&uid=${item.uid}`,
                        }
                      : require('../../../assets/image/avatar.png')
                  }
                  rating={item.rating ?? 0}
                  onBookPress={() => {
                    if (__DEV__) {
                      console.log('📍 Book Now Clicked - Home Screen');
                    }
                    if (__DEV__) {
                      console.log('🆔 Consultant UID:', item.uid);
                    }
                    if (__DEV__) {
                      console.log('👤 Consultant Name:', item.name);
                    }
                    if (__DEV__) {
                      console.log('📂 Consultant Category:', item.category);
                    }
                    navigation.navigate('MainTabs', {
                      screen: 'Services',
                      params: {
                        screen: 'ServicesScreen',
                        params: {
                          consultantId: item.uid,
                          consultantName: item.name,
                          consultantCategory: item.category,
                        },
                      },
                    });
                  }}
                  onChatPress={async () => {
                    await handleIconPress(
                      'message',
                      item.uid,
                      item,
                      navigation,
                      user,
                      openChatWith,
                    );
                  }}
                  onCallPress={() =>
                    handleIconPress(
                      'phone',
                      item.uid,
                      item,
                      navigation,
                      user,
                      openChatWith,
                    )
                  }
                  onVideoCallPress={() =>
                    handleIconPress(
                      'video',
                      item.uid,
                      item,
                      navigation,
                      user,
                      openChatWith,
                    )
                  }
                />
              </View>
            ))}
          </View>
        ) : (
          <Text style={screenStyles.emptyStateText}>
            No consultants available
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
