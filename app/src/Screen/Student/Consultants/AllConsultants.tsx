import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, Alert } from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ConsultantCard from '../../../components/ui/ConsultantCard';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { ConsultantService } from '../../../services/consultant.service';
import { BookingService } from '../../../services/booking.service';
import { useAuth } from '../../../contexts/AuthContext';
import { useChatContext } from '../../../contexts/ChatContext';
import { showError } from '../../../utils/toast';

const AllConsultants = ({ navigation }: any) => {
  const [consultants, setConsultants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { openChatWith } = useChatContext();

  // Handle icon presses (message, phone, video)
  const handleIconPress = async (
    iconType: 'message' | 'phone' | 'video',
    consultantId: string,
    consultant: any,
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
      console.error('Error checking booking access:', error);
      showError('Unable to verify booking status');
    }
  };

  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        const response = await ConsultantService.getAllConsultants();
        const allConsultantsData = response?.consultants || [];
        
        // Backend now handles sorting by rating and reviews
        setConsultants(allConsultantsData);
      } catch (err) {
        console.error('Error fetching all consultants:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultants();
  }, []);

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader 
        title="All Consultants" 
        onBackPress={() => navigation.goBack()} 
      />

      <ScrollView 
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Text style={screenStyles.loadingText}>Loading consultants...</Text>
        ) : consultants.length > 0 ? (
          <View style={screenStyles.consultantList}>
            {consultants.map(item => (
              <View key={item.uid} style={screenStyles.consultantCardWrapper}>
                <ConsultantCard
                  name={item.name}
                  title={item.category || 'Consultant'}
                  avatarUri={
                    item.profileImage
                      ? { uri: item.profileImage }
                      : require('../../../assets/image/avatar.png')
                  }
                  rating={item.rating ?? 0}
                  onBookPress={() => {
                    console.log('📍 Book Now Clicked - AllConsultants Screen');
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
                    await handleIconPress('message', item.uid, item);
                  }}
                  onCallPress={() => handleIconPress('phone', item.uid, item)}
                  onVideoCallPress={() => handleIconPress('video', item.uid, item)}
                />
              </View>
            ))}
          </View>
        ) : (
          <Text style={screenStyles.emptyStateText}>No consultants available</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AllConsultants;

