import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import AppButton from '../../../components/ui/AppButton';
import { COLORS } from '../../../constants/core/colors';
import { servicesStackStyles as styles } from '../../../constants/styles/servicesStackStyles';
import LoadingState from '../../../components/ui/LoadingState';
import { ConsultantService } from '../../../services/consultant.service';
import { studentAvailabilityStyles as customStyles } from '../../../constants/styles/studentAvailabilityStyles';
import { logger } from '../../../utils/logger';

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

interface AvailabilityWindow {
  date: string;
  startTime: string;
  endTime: string;
}

const parseTimeToMinutes = (timeStr: string): number => {
  const match = (timeStr || '').match(/(\d+)[:.](\d+)\s*(AM|PM)/i);
  if (!match) return -1;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = (match[3] || '').toUpperCase();
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return -1;

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const formatTimeFromMinutes = (minutesTotal: number): string => {
  const total = ((minutesTotal % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours24 = Math.floor(total / 60);
  const minutes = total % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
};

const StudentAvailability = ({ navigation, route }: any) => {
  const { consultantId } = route.params || {};
  // Multiple date selection support
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [activeDate, setActiveDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [availability, setAvailability] = useState<AvailabilitySchedule | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [availabilityWindows, setAvailabilityWindows] = useState<AvailabilityWindow[]>([]);
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
    if (availabilityWindows.length > 0) {
      const SLOT_DURATION_MINUTES = 60;
      const generatedSlots = availabilityWindows
        .filter(windowEntry => windowEntry?.date === dateString)
        .flatMap(windowEntry => {
          const start = parseTimeToMinutes(windowEntry?.startTime || '');
          const end = parseTimeToMinutes(windowEntry?.endTime || '');
          if (start < 0 || end < 0 || end <= start) {
            return [];
          }

          const labels: string[] = [];
          let cursor = start;
          while (cursor + SLOT_DURATION_MINUTES <= end) {
            labels.push(
              `${formatTimeFromMinutes(cursor)} - ${formatTimeFromMinutes(
                cursor + SLOT_DURATION_MINUTES,
              )}`,
            );
            cursor += SLOT_DURATION_MINUTES;
          }

          return labels;
        });

      if (generatedSlots.length > 0) {
        return Array.from(new Set(generatedSlots));
      }
    }

    const slot = availabilitySlots.find(s => s.date === dateString);
    return slot ? slot.timeSlots : [];
  }, [availabilitySlots, availabilityWindows]);

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
            if (__DEV__) {
        logger.debug('📅 Fetching consultant availability for student...')
      };
      
      if (!consultantId) {
                if (__DEV__) {
          logger.debug('⚠️ No consultant ID provided')
        };
        Alert.alert('Error', 'No consultant selected');
        setLoading(false);
        return;
      }
      
            if (__DEV__) {
        logger.debug('🔍 Fetching availability for consultant:', consultantId)
      };
      try {
        const response = await ConsultantService.getConsultantAvailability(consultantId);
                if (__DEV__) {
          logger.debug('✅ Availability response:', response)
        };

        if (response?.available) {
          if (Array.isArray(response.availabilityWindows)) {
            setAvailabilityWindows(response.availabilityWindows);
          } else {
            setAvailabilityWindows([]);
          }

          if (response.availabilitySlots && response.availabilitySlots.length > 0) {
            setAvailabilitySlots(response.availabilitySlots);
                        if (__DEV__) {
              logger.debug('✅ Availability slots loaded:', response.availabilitySlots)
            };
          } else if (response.availability) {
            setAvailability(response.availability);
                        if (__DEV__) {
              logger.debug('✅ Legacy availability loaded:', response.availability)
            };
          } else {
                        if (__DEV__) {
              logger.debug('ℹ️ No explicit slots in response; treating as no availability')
            };
          }
        } else {
                    if (__DEV__) {
            logger.debug('⚠️ Consultant not available:', response?.message)
          };
          setAvailabilityWindows([]);
          setAvailabilitySlots([]);
          setAvailability(null);
          // Non-blocking info toast instead of alert
        }
      } catch (err: any) {
        // Gracefully handle 404 (no availability configured)
        if (err?.response?.status === 404) {
                    if (__DEV__) {
            logger.debug('ℹ️ Availability API returned 404 - treating as no availability.')
          };
          setAvailabilitySlots([]);
          setAvailabilityWindows([]);
          setAvailability(null);
        } else {
          throw err;
        }
      }
    } catch (error: any) {
            if (__DEV__) {
        logger.error('❌ Error fetching consultant availability:', error)
      };
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
  }, [activeDate, availability, availabilitySlots, availabilityWindows, getTimeSlotsForSpecificDate, generateTimeSlotsForDay]);

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
        <LoadingState message="Loading consultant availability..." />
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
            minDate={new Date().toISOString().split('T')[0]} // Disable past dates
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


export default StudentAvailability;
