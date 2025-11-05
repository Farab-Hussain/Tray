import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import HomeHeader from '../../../components/shared/HomeHeader';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ConsultantCard from '../../../components/ui/ConsultantCard';
import TopConsultantCard from '../../../components/ui/TopConsultantCard';
import { ConsultantService } from '../../../services/consultant.service';
import { BookingService } from '../../../services/booking.service';
import { showWarning, showError } from '../../../utils/toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useChatContext } from '../../../contexts/ChatContext';

const Home = ({ navigation }: any) => {
  const [topConsultant, setTopConsultant] = useState<any>(null);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { openChatWith } = useChatContext();

  // Handle icon presses (message, phone, video)
  const handleIconPress = async (
    iconType: 'message' | 'phone' | 'video',
    consultantId: string,
    consultant: any,
    navigation: any,
    user: any,
    openChatWith: any
  ) => {
    try {
      // Check if student has booked this consultant
      const bookings = await BookingService.getMyBookings();
      const studentBookings = bookings?.bookings || [];
      
      // Find all bookings with this consultant (any status)
      const consultantBookings = studentBookings.filter(
        (booking: any) => booking.consultantId === consultantId
      );
      
      // Find if student has a confirmed/approved booking with this consultant
      const confirmedBooking = consultantBookings.find(
        (booking: any) =>
          booking.status === 'accepted' || 
          booking.status === 'approved' || 
          booking.status === 'confirmed'
      );
      
      // Find if there's a pending booking (waiting for consultant confirmation)
      const pendingBooking = consultantBookings.find(
        (booking: any) => booking.status === 'pending'
      );

      // If no booking exists or booking is pending, show alert
      if (!confirmedBooking) {
        let alertMessage = '';
        
        if (pendingBooking) {
          // Booking exists but waiting for consultant confirmation
          alertMessage = `Your booking with ${consultant.name} is pending confirmation. Please wait for the consultant to confirm your booking before you can ${iconType === 'message' ? 'send messages' : iconType === 'phone' ? 'make audio calls' : 'make video calls'}.`;
        } else {
          // No booking exists
          alertMessage = `You need to book with ${consultant.name} before you can ${iconType === 'message' ? 'send messages' : iconType === 'phone' ? 'make audio calls' : 'make video calls'}.`;
        }
        
        Alert.alert(
          'Booking Required',
          alertMessage,
          [
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
                      consultantCategory: consultant.category
                    }
                  }
                });
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      // Student has an active booking - proceed with action
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
          console.error('Error opening chat:', error);
          showError('Failed to open chat');
        }
      } else if (iconType === 'phone') {
        // Navigate to audio call screen
        navigation.navigate('CallingScreen', {
          consultantId,
          consultantName: consultant.name,
        });
      } else if (iconType === 'video') {
        // Navigate to video call screen
        navigation.navigate('VideoCallingScreen', {
          consultantId,
          consultantName: consultant.name,
        });
      }
    } catch (error) {
      console.error('Error checking booking access:', error);
      showError('Unable to verify booking status');
    }
  };

  useEffect(() => {
    const fetchConsultants = async () => {
      try {
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
          (consultant: any) => consultant.uid !== topConsultantData?.uid
        );

        // Backend now handles sorting by rating and reviews
        console.log(
          '⭐ Selected Top Consultant:',
          topConsultantData?.name,
          'with rating:',
          topConsultantData?.rating,
        );
        console.log(
          '📊 Other Consultants:',
          filteredConsultants.length,
          'consultants',
        );

        setTopConsultant(topConsultantData);
        setConsultants(filteredConsultants);
      } catch (err) {
        console.error('Error fetching consultants:', err);
        showWarning('Unable to load consultants. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchConsultants();
  }, []);

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
                ? { uri: topConsultant.profileImage }
                : require('../../../assets/image/avatar.png')
            }
            rating={topConsultant.rating || 5}
            consultantId={topConsultant.uid}
            navigation={navigation}
            onChatPress={async () => {
              await handleIconPress('message', topConsultant.uid, topConsultant, navigation, user, openChatWith);
            }}
            onCallPress={() => handleIconPress('phone', topConsultant.uid, topConsultant, navigation, user, openChatWith)}
            onVideoCallPress={() => handleIconPress('video', topConsultant.uid, topConsultant, navigation, user, openChatWith)}
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
                      ? { uri: item.profileImage }
                      : require('../../../assets/image/avatar.png')
                  }
                  rating={item.rating || 5}
                  onBookPress={() => {
                    console.log('📍 Book Now Clicked - Home Screen');
                    console.log('🆔 Consultant UID:', item.uid);
                    console.log('👤 Consultant Name:', item.name);
                    console.log('📂 Consultant Category:', item.category);
                    navigation.navigate('MainTabs', {
                      screen: 'Services',
                      params: {
                        screen: 'ServicesScreen',
                        params: {
                          consultantId: item.uid,
                          consultantName: item.name,
                          consultantCategory: item.category
                        }
                      }
                    });
                  }}
                  onChatPress={async () => {
                    await handleIconPress('message', item.uid, item, navigation, user, openChatWith);
                  }}
                  onCallPress={() => handleIconPress('phone', item.uid, item, navigation, user, openChatWith)}
                  onVideoCallPress={() => handleIconPress('video', item.uid, item, navigation, user, openChatWith)}
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
