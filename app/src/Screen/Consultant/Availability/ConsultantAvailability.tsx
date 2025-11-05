import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { COLORS } from '../../../constants/core/colors';
import { useAuth } from '../../../contexts/AuthContext';
import { getConsultantProfile } from '../../../services/consultantFlow.service';
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

const ConsultantAvailability = ({ navigation }: any) => {
  const { user } = useAuth();
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [_availability, setAvailability] =
    useState<AvailabilitySchedule | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<
    AvailabilitySlot[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Helper function to get time slots for a specific date
  const getTimeSlotsForDate = (dateString: string): string[] => {
    const slot = availabilitySlots.find(s => s.date === dateString);
    return slot ? slot.timeSlots : [];
  };

  // Handle multiple date selection
  const handleDatePress = (day: any) => {
    const dateString = day.dateString;
    setSelectedDates(prev => {
      if (prev.includes(dateString)) {
        // Remove date if already selected
        return prev.filter(date => date !== dateString);
      } else {
        // Add date if not selected
        return [...prev, dateString];
      }
    });
  };

  // Generate time options for picker
  const generateTimeOptions = (): string[] => {
    const options: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // 30-minute intervals
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        const time12 = `${displayHour.toString().padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')} ${period}`;
        options.push(time12);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Parse time string to minutes
  const parseTime = (timeStr: string): number => {
    if (!timeStr || typeof timeStr !== 'string') return 0;

    const [time, period] = timeStr.split(' ');
    if (!time || !period) return 0;

    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;

    let totalMinutes = hours * 60 + minutes;

    if (period === 'PM' && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (period === 'AM' && hours === 12) {
      totalMinutes -= 12 * 60;
    }

    return totalMinutes;
  };

  // Format minutes to time string
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    return `${displayHours.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')} ${period}`;
  };

  // Get overlapping time range info
  const getOverlappingInfo = (
    existingSlots: string[],
    newSlots: string[],
  ): {
    hasOverlap: boolean;
    overlappingTimes: string[];
    existingRange: string;
  } => {
    const existingMinutes = existingSlots
      .map(slot => parseTime(slot))
      .sort((a, b) => a - b);
    const newMinutes = newSlots
      .map(slot => parseTime(slot))
      .sort((a, b) => a - b);

    const overlappingTimes: string[] = [];
    const overlappingMinutes: number[] = [];

    // Find overlapping times
    for (let i = 0; i < newMinutes.length; i++) {
      if (existingMinutes.includes(newMinutes[i])) {
        overlappingTimes.push(formatTime(newMinutes[i]));
        overlappingMinutes.push(newMinutes[i]);
      }
    }

    // Get existing range
    const minExisting = Math.min(...existingMinutes);
    const maxExisting = Math.max(...existingMinutes);
    const existingRange = `${formatTime(minExisting)} - ${formatTime(
      maxExisting + 30,
    )}`;

    return {
      hasOverlap: overlappingTimes.length > 0,
      overlappingTimes,
      existingRange,
    };
  };

  // Add time slots for selected dates
  const addTimeSlots = () => {
    if (selectedDates.length === 0 || !startTime || !endTime) {
      Alert.alert(
        'Error',
        'Please select at least one date and enter both start and end times',
      );
      return;
    }

    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);

    if (startMinutes >= endMinutes) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    // Generate 30-minute slots between start and end time
    const slots: string[] = [];
    let current = startMinutes;
    while (current < endMinutes) {
      slots.push(formatTime(current));
      current += 30; // Add 30 minutes
    }

    // Check for overlapping slots
    let totalSlotsAdded = 0;
    let overlappingDates: string[] = [];
    let overlappingInfo: any = null;

    selectedDates.forEach(dateString => {
      const existingSlot = availabilitySlots.find(s => s.date === dateString);
      if (existingSlot && existingSlot.timeSlots.length > 0) {
        // Check for overlaps
        const overlapCheck = getOverlappingInfo(existingSlot.timeSlots, slots);
        if (overlapCheck.hasOverlap) {
          overlappingDates.push(new Date(dateString).toLocaleDateString());
          overlappingInfo = overlapCheck;
        } else {
          // No overlap, add slots
          existingSlot.timeSlots.push(...slots);
          totalSlotsAdded += slots.length;
        }
      } else {
        // No existing slots, add all
        setAvailabilitySlots(prev => [
          ...prev,
          { date: dateString, timeSlots: [...slots] },
        ]);
        totalSlotsAdded += slots.length;
      }
    });

    // Clear inputs
    setStartTime('');
    setEndTime('');
    setShowStartTimePicker(false);
    setShowEndTimePicker(false);

    // Show overlap alert if conflicts found
    if (overlappingDates.length > 0) {
      const newRange = `${startTime} - ${endTime}`;
      let overlapMessage = `Time slot overlap detected!\n\n`;
      overlapMessage += `Selected time: ${newRange}\n`;
      overlapMessage += `Existing time: ${overlappingInfo.existingRange}\n`;
      overlapMessage += `Overlapping times: ${overlappingInfo.overlappingTimes.join(
        ', ',
      )}\n\n`;
      overlapMessage += `Please select a different time to create slots.`;

      Alert.alert('Time Slot Overlap', overlapMessage);
    } else if (totalSlotsAdded > 0) {
      Alert.alert(
        'Success',
        `Added ${totalSlotsAdded} time slot(s) for ${selectedDates.length} date(s)`,
      );
    }
  };

  const saveAvailabilitySlots = async () => {
    console.log('🚨🚨🚨 SAVE AVAILABILITY SLOTS FUNCTION CALLED 🚨🚨🚨');

    if (!user?.uid) {
      console.error('❌ [ConsultantAvailability] No user UID available');
      return;
    }

    try {
      setSaving(true);
      console.log(
        '💾 [ConsultantAvailability] Starting to save availability slots...',
      );
      console.log('👤 [ConsultantAvailability] User UID:', user.uid);
      console.log(
        '📊 [ConsultantAvailability] Availability slots to save:',
        availabilitySlots.length,
      );

      const result = await ConsultantService.setAvailabilitySlots(
        user.uid,
        availabilitySlots,
      );
      console.log('✅ [ConsultantAvailability] Save result:', result);
      Alert.alert('Success', 'Availability slots saved successfully!');
    } catch (error: any) {
      console.error(
        '❌ [ConsultantAvailability] Error saving availability slots:',
        error,
      );
      Alert.alert('Error', 'Failed to save availability slots');
    } finally {
      setSaving(false);
    }
  };

  const fetchConsultantAvailability = useCallback(async () => {
    try {
      console.log(
        '📅 [ConsultantAvailability] Fetching consultant availability...',
      );

      if (!user?.uid) {
        console.log(
          '⚠️ [ConsultantAvailability] No user UID available, using defaults',
        );
        return;
      }

      try {
        const profile = await getConsultantProfile(user.uid);
        console.log('✅ [ConsultantAvailability] Profile response:', profile);

        if ((profile as any)?.professionalInfo?.availability) {
          setAvailability((profile as any).professionalInfo.availability);
        }

        if ((profile as any)?.professionalInfo?.availabilitySlots) {
          const slots = (profile as any).professionalInfo.availabilitySlots;
          console.log(
            '✅ [ConsultantAvailability] Availability slots loaded:',
            slots.length,
          );
          setAvailabilitySlots(slots);
        }
      } catch (profileError) {
        console.log(
          '⚠️ [ConsultantAvailability] Profile fetch failed, using defaults:',
          profileError,
        );
      }
    } catch (error: any) {
      console.error(
        '❌ [ConsultantAvailability] Error in fetchConsultantAvailability:',
        error,
      );
    }
  }, [user]);

  useEffect(() => {
    console.log('🚀 ConsultantAvailability useEffect starting...');

    setAvailability({
      days: [],
      startTime: '',
      endTime: '',
      timezone: 'UTC',
    });
    setAvailabilitySlots([]);

    const forceLoadingTimeout = setTimeout(() => {
      console.log('⏰ Force loading timeout - showing calendar');
      setLoading(false);
    }, 1000);

    fetchConsultantAvailability();

    return () => {
      clearTimeout(forceLoadingTimeout);
    };
  }, [fetchConsultantAvailability]);

  // Refetch data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 ConsultantAvailability screen focused - refetching data');
      fetchConsultantAvailability();
    });

    return unsubscribe;
  }, [navigation, fetchConsultantAvailability]);

  if (loading) {
    return (
      <SafeAreaView style={cleanStyles.safeArea} edges={['top']}>
        <ScreenHeader
          title="My Availability"
          onBackPress={() => navigation.goBack()}
        />
        <View style={cleanStyles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={cleanStyles.loadingText}>
            Setting up availability calendar...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={cleanStyles.safeArea} edges={['top']}>
      <ScreenHeader
        title="My Availability"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={cleanStyles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar */}
        <View style={cleanStyles.calendarCard}>
          <Calendar
            onDayPress={handleDatePress}
            markedDates={{
              // Mark selected dates with light green background (consistent for all selected dates)
              ...Object.fromEntries(
                selectedDates.map(dateString => [
                  dateString,
                  {
                    selected: true,
                    selectedColor: '#90EE90', // Light green background
                    selectedTextColor: '#333333', // Dark text for readability
                  },
                ]),
              ),
              // Mark dates with existing slots (only if not selected) with green dots
              ...Object.fromEntries(
                availabilitySlots
                  .map(slot => {
                    const dateString = slot.date;
                    // Only show dot if date is NOT currently selected
                    if (
                      !selectedDates.includes(dateString) &&
                      slot.timeSlots.length > 0
                    ) {
                      return [
                        dateString,
                        {
                          marked: true,
                          dotColor: '#4CAF50', // Green dot
                        },
                      ];
                    }
                    return []; // Don't mark if selected or no slots
                  })
                  .filter(Boolean), // Filter out empty arrays
              ),
            }}
            theme={{
              backgroundColor: '#FFFFFF',
              calendarBackground: '#FFFFFF',
              textSectionTitleColor: '#999999',
              selectedDayBackgroundColor: '#90EE90', // Light green for selected dates
              selectedDayTextColor: '#333333', // Dark text for readability
              todayTextColor: '#4CAF50',
              dayTextColor: '#333333',
              textDisabledColor: '#D9D9D9',
              monthTextColor: '#333333',
              textMonthFontWeight: '600',
              textMonthFontSize: 18,
              textDayFontSize: 16,
              textDayHeaderFontSize: 12,
              arrowColor: '#999999',
            }}
            style={cleanStyles.calendar}
          />
        </View>

        {/* Time Input Section */}
        {selectedDates.length > 0 && (
          <View style={cleanStyles.timeInputSection}>
            <Text style={cleanStyles.timeInputTitle}>
              Add Time Slots for {selectedDates.length} Selected Date
              {selectedDates.length > 1 ? 's' : ''}
            </Text>

            {/* Selected Dates Display */}
            <View style={cleanStyles.selectedDatesContainer}>
              <Text style={cleanStyles.selectedDatesLabel}>
                Selected Dates:
              </Text>
              <View style={cleanStyles.selectedDatesList}>
                {selectedDates.map((date, index) => (
                  <View key={index} style={cleanStyles.selectedDateChip}>
                    <Text style={cleanStyles.selectedDateText}>
                      {new Date(date).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Start Time Input */}
            <View style={cleanStyles.timeInputRow}>
              <Text style={cleanStyles.timeInputLabel}>Start Time:</Text>
              <TouchableOpacity
                style={cleanStyles.timeInputButton}
                onPress={() => setShowStartTimePicker(!showStartTimePicker)}
              >
                <Text style={cleanStyles.timeInputButtonText}>
                  {startTime || 'Select Start Time'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* End Time Input */}
            <View style={cleanStyles.timeInputRow}>
              <Text style={cleanStyles.timeInputLabel}>End Time:</Text>
              <TouchableOpacity
                style={cleanStyles.timeInputButton}
                onPress={() => setShowEndTimePicker(!showEndTimePicker)}
              >
                <Text style={cleanStyles.timeInputButtonText}>
                  {endTime || 'Select End Time'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Add Time Slots Button */}
            <TouchableOpacity
              style={cleanStyles.addSlotsButton}
              onPress={addTimeSlots}
            >
              <Text style={cleanStyles.addSlotsButtonText}>Add Time Slots</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Time Picker Modals */}
        {showStartTimePicker && (
          <View style={cleanStyles.timePickerModal}>
            <View style={cleanStyles.timePickerContainer}>
              <Text style={cleanStyles.timePickerTitle}>Select Start Time</Text>
              <ScrollView style={cleanStyles.timePickerScroll}>
                {timeOptions.map((time, index) => (
                  <TouchableOpacity
                    key={index}
                    style={cleanStyles.timePickerOption}
                    onPress={() => {
                      setStartTime(time);
                      setShowStartTimePicker(false);
                    }}
                  >
                    <Text style={cleanStyles.timePickerOptionText}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={cleanStyles.timePickerCancel}
                onPress={() => setShowStartTimePicker(false)}
              >
                <Text style={cleanStyles.timePickerCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {showEndTimePicker && (
          <View style={cleanStyles.timePickerModal}>
            <View style={cleanStyles.timePickerContainer}>
              <Text style={cleanStyles.timePickerTitle}>Select End Time</Text>
              <ScrollView style={cleanStyles.timePickerScroll}>
                {timeOptions.map((time, index) => (
                  <TouchableOpacity
                    key={index}
                    style={cleanStyles.timePickerOption}
                    onPress={() => {
                      setEndTime(time);
                      setShowEndTimePicker(false);
                    }}
                  >
                    <Text style={cleanStyles.timePickerOptionText}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={cleanStyles.timePickerCancel}
                onPress={() => setShowEndTimePicker(false)}
              >
                <Text style={cleanStyles.timePickerCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Available Time Slots */}
        {selectedDates.length > 0 && (
          <View style={cleanStyles.timeSlotsSection}>
            <Text style={cleanStyles.timeSlotsTitle}>Time Slots Summary</Text>

            {/* Compact Summary */}
            <Text style={cleanStyles.compactSummary}>
              {selectedDates.length} dates •{' '}
              {selectedDates.reduce(
                (total, date) => total + getTimeSlotsForDate(date).length,
                0,
              )}{' '}
              slots
            </Text>
          </View>
        )}

        {/* Save Button */}
        <View style={cleanStyles.saveButtonContainer}>
          <TouchableOpacity
            style={cleanStyles.saveButton}
            onPress={saveAvailabilitySlots}
            disabled={saving}
          >
            <Text style={cleanStyles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Availability Slots'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Clean styles matching the design from the image
const cleanStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  calendar: {
    borderRadius: 12,
  },
  timeSlotsSection: {
    marginBottom: 20,
  },
  timeSlotsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  timeSlot: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  debugText: {
    color: '#4CAF50',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  noSlotsText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  saveButtonContainer: {
    marginBottom: 20,
    paddingBottom: 16,
  },
  saveButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  timeInputSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timeInputTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  timeInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    width: 90,
  },
  timeInputButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginLeft: 10,
  },
  timeInputButtonText: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  addSlotsButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addSlotsButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  timePickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  timePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 15,
  },
  timePickerScroll: {
    maxHeight: 200,
  },
  timePickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  timePickerOptionText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
  timePickerCancel: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  timePickerCancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666666',
  },
  selectedDatesContainer: {
    marginBottom: 20,
  },
  selectedDatesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  selectedDatesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  selectedDateChip: {
    backgroundColor: '#90EE90',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    width: '30%',
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  dateSlotsContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateSlotsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
    textAlign: 'center',
  },
  summaryContainer: {
    backgroundColor: '#F0F8FF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0F0FF',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 5,
    textAlign: 'center',
  },
  moreDatesContainer: {
    backgroundColor: '#FFF8DC',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FFE4B5',
  },
  moreDatesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    textAlign: 'center',
    marginBottom: 5,
  },
  moreDatesSubText: {
    fontSize: 12,
    color: '#8B4513',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  compactSummary: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 12,
  },
  compactDateContainer: {
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  compactDateTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  compactOverflow: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
});

export default ConsultantAvailability;
