import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, Alert, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import AppButton from '../../../components/ui/AppButton';
import { COLORS } from '../../../constants/core/colors';
import { servicesStackStyles as styles } from '../../../constants/styles/servicesStackStyles';
import { ConsultantService } from '../../../services/consultant.service';

interface AvailabilitySchedule {
  days: string[];
  startTime: string;
  endTime: string;
  timezone: string;
}

interface AvailabilitySlot {
  date: string;
  timeSlots: string[];
}

const StudentAvailability = ({ navigation, route }: any) => {
  const { consultantId } = route.params || {};
  // Multiple date selection support
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [activeDate, setActiveDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [availability, setAvailability] = useState<AvailabilitySchedule | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // (Removed unused parseTime/formatTime helpers)

  const getDayName = (dayIndex: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };

  // Helper function to check if date is available
  const isDateAvailable = (dateString: string): boolean => {
    // Check new format first (specific date slots)
    if (availabilitySlots.length > 0) {
      const specificSlots = getTimeSlotsForSpecificDate(dateString);
      if (specificSlots.length > 0) return true;
    }
    
    // Fall back to legacy format (day-based availability)
    if (availability) {
      const dayName = getDayName(new Date(dateString).getDay());
      return availability.days.includes(dayName);
    }
    
    return false;
  };

  // Helper function to get time slots for specific date (new format)
  const getTimeSlotsForSpecificDate = useCallback((dateString: string): string[] => {
    const slot = availabilitySlots.find(s => s.date === dateString);
    return slot ? slot.timeSlots : [];
  }, [availabilitySlots]);

  // Helper function to generate time slots for a specific day (legacy format)
  const generateTimeSlotsForDay = useCallback((dayName: string): string[] => {
    if (!availability) return [];
    
    const daySlots = (availability as any)[dayName.toLowerCase()];
    if (!daySlots || !Array.isArray(daySlots)) return [];
    
    return daySlots;
  }, [availability]);

  // Fetch consultant availability
  const fetchConsultantAvailability = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📅 Fetching consultant availability for student...');
      
      if (!consultantId) {
        console.log('⚠️ No consultant ID provided');
        Alert.alert('Error', 'No consultant selected');
        setLoading(false);
        return;
      }
      
      console.log('🔍 Fetching availability for consultant:', consultantId);
      try {
        const response = await ConsultantService.getConsultantAvailability(consultantId);
        console.log('✅ Availability response:', response);

        if (response?.available) {
          if (response.availabilitySlots && response.availabilitySlots.length > 0) {
            setAvailabilitySlots(response.availabilitySlots);
            console.log('✅ Availability slots loaded:', response.availabilitySlots);
          } else if (response.availability) {
            setAvailability(response.availability);
            console.log('✅ Legacy availability loaded:', response.availability);
          } else {
            console.log('ℹ️ No explicit slots in response; treating as no availability');
          }
        } else {
          console.log('⚠️ Consultant not available:', response?.message);
          // Non-blocking info toast instead of alert
        }
      } catch (err: any) {
        // Gracefully handle 404 (no availability configured)
        if (err?.response?.status === 404) {
          console.log('ℹ️ Availability API returned 404 - treating as no availability.');
          setAvailabilitySlots([]);
          setAvailability(null);
        } else {
          throw err;
        }
      }
    } catch (error: any) {
      console.error('❌ Error fetching consultant availability:', error);
      Alert.alert('Error', 'Failed to load consultant availability');
    } finally {
      setLoading(false);
    }
  }, [consultantId]);

  useEffect(() => {
    fetchConsultantAvailability();
  }, [fetchConsultantAvailability]);

  // Update time slots when active date is selected/changed
  useEffect(() => {
    if (!activeDate) return;
    
    // Check new format first (specific date slots)
    const specificSlots = getTimeSlotsForSpecificDate(activeDate);
    if (specificSlots.length > 0) {
      setAvailableSlots(specificSlots);
      setSelectedTimeSlot(''); // Reset selected time slot when date changes
      return;
    }
    
    // Fall back to legacy format (day-based availability)
    const dayName = getDayName(new Date(activeDate).getDay());
    const slots = generateTimeSlotsForDay(dayName);
    setAvailableSlots(slots);
    setSelectedTimeSlot(''); // Reset selected time slot when date changes
  }, [activeDate, availability, availabilitySlots, getTimeSlotsForSpecificDate, generateTimeSlotsForDay]);

  const handleBookSlot = () => {
    if (selectedDates.length === 0 || !selectedTimeSlot) {
      Alert.alert('Selection Required', 'Please select at least one date and a time slot');
      return;
    }
    
    Alert.alert(
      'Book Appointment',
      `Book ${selectedTimeSlot} on ${selectedDates.join(', ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Book', 
          onPress: () => {
            // TODO: Implement actual booking logic
            Alert.alert('Success', 'Appointment booked successfully!');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScreenHeader 
          title="Book Appointment" 
          onBackPress={() => navigation.goBack()} 
        />
        <View style={customStyles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={customStyles.loadingText}>Loading consultant availability...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader 
        title="Book Appointment" 
        onBackPress={() => navigation.goBack()} 
      />

      <ScrollView 
        style={styles.bookingContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions */}
        <View style={customStyles.instructionsContainer}>
          <Text style={customStyles.instructionsTitle}>Book Your Appointment</Text>
          <Text style={customStyles.instructionsText}>
            1. Select an available date from the calendar{'\n'}
            2. Choose your preferred time slot{'\n'}
            3. Tap "Book Appointment" to confirm
          </Text>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Text style={customStyles.calendarTitle}>Select Available Dates</Text>
          <Text style={customStyles.calendarSubtitle}>Tap multiple available dates to select them</Text>
          <Calendar
            current={activeDate}
            onDayPress={(day) => {
              if (!isDateAvailable(day.dateString)) {
                Alert.alert('Not Available', 'This date is not available for booking');
                return;
              }
              setActiveDate(day.dateString);
              setSelectedTimeSlot('');
              setSelectedDates(prev => {
                const exists = prev.includes(day.dateString);
                if (exists) {
                  return prev.filter(d => d !== day.dateString);
                }
                return [...prev, day.dateString].sort();
              });
            }}
            markedDates={{
              ...selectedDates.reduce((acc, date) => {
                acc[date] = { selected: true, selectedColor: COLORS.green };
                return acc;
              }, {} as Record<string, any>),
              ...Object.fromEntries(
                Array.from({ length: 30 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const dateString = date.toISOString().split('T')[0];
                  const isAvailable = isDateAvailable(dateString);
                  return [
                    dateString,
                    {
                      marked: isAvailable,
                      dotColor: isAvailable ? COLORS.green : COLORS.gray,
                    }
                  ];
                })
              )
            }}
            theme={{
              backgroundColor: COLORS.white,
              calendarBackground: COLORS.white,
              textSectionTitleColor: COLORS.gray,
              selectedDayBackgroundColor: COLORS.green,
              selectedDayTextColor: COLORS.white,
              todayTextColor: COLORS.green,
              dayTextColor: COLORS.black,
              textDisabledColor: COLORS.lightGray,
              monthTextColor: COLORS.black,
              textMonthFontWeight: '600',
              textMonthFontSize: 18,
              textDayFontSize: 16,
              textDayHeaderFontSize: 12,
              arrowColor: COLORS.gray,
            }}
            style={styles.calendar}
          />
        </View>

        {/* Time Slots */}
        {activeDate && (
          <View style={styles.timeSlotsContainer}>
            <Text style={styles.timeSlotsTitle}>
              Available Time Slots for {activeDate}
            </Text>
            
            {availableSlots.length > 0 ? (
              <View style={styles.timeSlotsGrid}>
                {availableSlots.map((slot, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeSlot,
                      selectedTimeSlot === slot && styles.selectedTimeSlot
                    ]}
                    onPress={() => setSelectedTimeSlot(slot)}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      selectedTimeSlot === slot && styles.selectedTimeSlotText
                    ]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={customStyles.noSlotsContainer}>
                <Text style={customStyles.noSlotsText}>
                  No available time slots for this date
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Book Button */}
        {selectedDates.length > 0 && selectedTimeSlot && (
          <View style={styles.bookButtonContainer}>
            <AppButton
              title={`Book ${selectedDates.length} Date(s)`}
              onPress={handleBookSlot}
              style={styles.bookButton}
              textStyle={styles.bookButtonText}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const customStyles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  instructionsContainer: {
    backgroundColor: COLORS.blue,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.blue,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  calendarSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 16,
    textAlign: 'center',
  },
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noSlotsText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
    textAlign: 'center',
  },
});

export default StudentAvailability;
