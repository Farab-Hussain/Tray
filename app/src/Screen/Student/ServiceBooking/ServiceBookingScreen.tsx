import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar, Clock, DollarSign, MessageCircle, Video, Phone, Check } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';
import { BookingService } from '../../../services/booking.service';
import { createChatIfNotExists } from '../../../services/chat.Service';
import { useAuth } from '../../../contexts/AuthContext';

interface Service {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  imageUrl?: string;
  consultantId: string;
  consultantName?: string;
}

interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
}

export default function ServiceBookingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  const { service }: { service: Service } = route.params as any;
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchAvailableSlots();
  }, [service.consultantId]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      // Mock available slots - replace with actual API call
      const mockSlots: TimeSlot[] = [
        { date: '2024-02-17', time: '09:00 AM', available: true },
        { date: '2024-02-17', time: '10:00 AM', available: true },
        { date: '2024-02-17', time: '11:00 AM', available: false },
        { date: '2024-02-18', time: '02:00 PM', available: true },
        { date: '2024-02-18', time: '03:00 PM', available: true },
      ];
      setAvailableSlots(mockSlots);
    } catch (error) {
      Alert.alert('Error', 'Failed to load available slots');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Error', 'Please select date and time');
      return;
    }

    try {
      setBooking(true);
      
      // Create booking
      const bookingData = await BookingService.createBooking({
        consultantId: service.consultantId,
        studentId: user?.uid || '',
        serviceId: service.id,
        date: selectedDate,
        time: selectedTime,
        amount: service.price,
        quantity: 1,
        status: 'pending',
        paymentStatus: 'pending',
      });

      // Create chat for communication
      await createChatIfNotExists(user?.uid || '', service.consultantId);

      Alert.alert(
        'Booking Confirmed!',
        'Your session has been booked. You can now message the consultant.',
        [
          { text: 'View Booking' },
          { text: 'Message Consultant', onPress: () => navigation.navigate('Chat', { consultantId: service.consultantId }) },
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create booking');
    } finally {
      setBooking(false);
    }
  };

  const handleMessageConsultant = async () => {
    try {
      await createChatIfNotExists(user?.uid || '', service.consultantId);
      navigation.navigate('Chat', { consultantId: service.consultantId });
    } catch (error) {
      Alert.alert('Error', 'Failed to open chat');
    }
  };

  const handleVideoCall = () => {
    Alert.alert('Coming Soon', 'Video call feature will be available soon!');
  };

  const handleAudioCall = () => {
    Alert.alert('Coming Soon', 'Audio call feature will be available soon!');
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.green} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 18, color: COLORS.black }}>←</Text>
        </TouchableOpacity>
        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: COLORS.black,
          marginLeft: 16,
          flex: 1,
        }}>
          Book Service
        </Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Service Info */}
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: COLORS.black,
            marginBottom: 8,
          }}>
            {service.title}
          </Text>
          <Text style={{
            fontSize: 14,
            color: COLORS.gray,
            marginBottom: 16,
            lineHeight: 20,
          }}>
            {service.description}
          </Text>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
          }}>
            <Clock size={16} color={COLORS.gray} />
            <Text style={{
              fontSize: 14,
              color: COLORS.gray,
              marginLeft: 8,
            }}>
              {service.duration} minutes
            </Text>
          </View>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <DollarSign size={16} color={COLORS.green} />
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: COLORS.green,
              marginLeft: 8,
            }}>
              ${service.price}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: COLORS.black,
            marginBottom: 16,
          }}>
            Quick Actions
          </Text>
          
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: COLORS.blue,
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginRight: 8,
              }}
              onPress={handleMessageConsultant}
            >
              <MessageCircle size={20} color={COLORS.white} />
              <Text style={{
                color: COLORS.white,
                fontSize: 12,
                fontWeight: '600',
                marginTop: 4,
              }}>
                Message
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: COLORS.green,
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginRight: 8,
              }}
              onPress={handleVideoCall}
            >
              <Video size={20} color={COLORS.white} />
              <Text style={{
                color: COLORS.white,
                fontSize: 12,
                fontWeight: '600',
                marginTop: 4,
              }}>
                Video Call
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: COLORS.orange,
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={handleAudioCall}
            >
              <Phone size={20} color={COLORS.white} />
              <Text style={{
                color: COLORS.white,
                fontSize: 12,
                fontWeight: '600',
                marginTop: 4,
              }}>
                Audio Call
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Available Slots */}
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: COLORS.black,
            marginBottom: 16,
          }}>
            Available Time Slots
          </Text>
          
          {availableSlots.map((slot, index) => (
            <TouchableOpacity
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                borderRadius: 8,
                backgroundColor: slot.available ? 
                  (selectedDate === slot.date && selectedTime === slot.time ? COLORS.green + '20' : COLORS.lightGray) 
                  : COLORS.gray + '20',
                marginBottom: 8,
                opacity: slot.available ? 1 : 0.5,
              }}
              onPress={() => {
                if (slot.available) {
                  setSelectedDate(slot.date);
                  setSelectedTime(slot.time);
                }
              }}
              disabled={!slot.available}
            >
              <Calendar size={16} color={slot.available ? COLORS.black : COLORS.gray} />
              <Text style={{
                fontSize: 14,
                color: slot.available ? COLORS.black : COLORS.gray,
                marginLeft: 8,
                flex: 1,
              }}>
                {slot.date}
              </Text>
              <Clock size={16} color={slot.available ? COLORS.black : COLORS.gray} />
              <Text style={{
                fontSize: 14,
                color: slot.available ? COLORS.black : COLORS.gray,
                marginLeft: 8,
              }}>
                {slot.time}
              </Text>
              {selectedDate === slot.date && selectedTime === slot.time && (
                <Check size={16} color={COLORS.green} style={{ marginLeft: 8 }} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Book Button */}
        <TouchableOpacity
          style={{
            backgroundColor: selectedDate && selectedTime ? COLORS.green : COLORS.gray,
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 20,
          }}
          onPress={handleBooking}
          disabled={!selectedDate || !selectedTime || booking}
        >
          {booking ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={{
              color: COLORS.white,
              fontSize: 16,
              fontWeight: '700',
            }}>
              Book Session - ${service.price}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
