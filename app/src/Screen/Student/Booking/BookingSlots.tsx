import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import AppButton from '../../../components/ui/AppButton';
import { COLORS } from '../../../constants/core/colors';
import { servicesStackStyles as styles } from '../../../constants/styles/servicesStackStyles';
import { useAuth } from '../../../contexts/AuthContext';
import { ConsultantService } from '../../../services/consultant.service';
import { BookingService } from '../../../services/booking.service';

// Helper function to calculate end time
const calculateEndTime = (
  startTime: string,
  durationMinutes: number,
): string => {
  // Parse start time - handle both formats: "09:00 AM" and "09.00 AM"
  const timeMatch = startTime.match(/(\d+)[:.](\d+)\s*(AM|PM)/i);
  if (!timeMatch) {
    if (__DEV__) {
      console.warn('Could not parse time:', startTime);
    }
    return startTime;
  }

  let hours = parseInt(timeMatch[1], 10);
  let minutes = parseInt(timeMatch[2], 10);
  const period = timeMatch[3];

  if (__DEV__) {
    console.log('Parsed time:', { hours, minutes, period, durationMinutes });
  }

  // Convert to 24-hour format
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  // Add duration
  minutes += durationMinutes;
  hours += Math.floor(minutes / 60);
  minutes = minutes % 60;

  // Convert back to 12-hour format
  const endPeriod = hours >= 12 ? 'PM' : 'AM';
  let endHours = hours % 12;
  if (endHours === 0) endHours = 12;

  const result = `${String(endHours).padStart(2, '0')}:${String(
    minutes,
  ).padStart(2, '0')} ${endPeriod}`;
  if (__DEV__) {
    console.log('Calculated end time:', result);
  }

  return result;
};

const parseTimeToMinutes = (timeStr: string): number => {
  const timeMatch = (timeStr || '').match(/(\d+)[:.](\d+)\s*(AM|PM)/i);
  if (!timeMatch) {
    return -1;
  }

  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const period = (timeMatch[3] || '').toUpperCase();

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return -1;
  }

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

const formatTimeFromMinutes = (minutesTotal: number): string => {
  const total = ((minutesTotal % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hours24 = Math.floor(total / 60);
  const minutes = total % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0',
  )} ${period}`;
};

const extractStartFromSlot = (slotLabel: string): string => {
  const [start] = (slotLabel || '').split(' - ');
  return (start || slotLabel || '').trim();
};

const BookingSlots = ({ navigation, route }: any) => {
  const { user } = useAuth();
  // Determine user role from navigation state or route params
  const isConsultant =
    navigation
      .getState()
      ?.routes?.some(
        (r: any) =>
          r.name === 'ConsultantTabs' || r.name === 'ConsultantAvailability',
      ) || route?.params?.isConsultant;

  // Get consultant and service data from navigation
  const {
    consultantId,
    consultantName,
    serviceId,
    serviceTitle,
    serviceImageUrl,
    serviceDuration,
  } = route?.params || {};

  // Multi-selection state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<
    Array<{
      date: string;
      startTime: string;
      endTime: string;
      displayStartTime: string;
      displayEndTime: string;
    }>
  >([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]); // For current date
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [loadingSlots, _setLoadingSlots] = useState(false);
  const [consultantAvailability, setConsultantAvailability] =
    useState<any>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Default time slots (fallback if API fails) - removed hardcoded data
  const defaultTimeSlots = useMemo(() => [], []);

  // Track if availability API is unavailable to prevent repeated failed calls
  const [_availabilityApiUnavailable, _setAvailabilityApiUnavailable] =
    React.useState(false);

  // Helper function to get day name from date
  const getDayName = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[date.getDay()];
  }, []);

  // Helper function to check if date is available
  const isDateAvailable = (dateString: string): boolean => {
    // Check new format first (specific date slots)
    if (consultantAvailability?.availabilitySlots) {
      const specificSlots = getTimeSlotsForSpecificDate(dateString);
      if (specificSlots.length > 0) return true;
    }

    // Fall back to legacy format (day-based availability)
    if (consultantAvailability?.availability) {
      const dayName = getDayName(dateString);
      return consultantAvailability.availability.hasOwnProperty(
        dayName.toLowerCase(),
      );
    }

    return false;
  };

  // Helper function to generate time slots for a specific day
  const generateTimeSlotsForDay = useCallback(
    (dayName: string): string[] => {
      if (!consultantAvailability?.availability) return [];

      const daySlots =
        consultantAvailability.availability[dayName.toLowerCase()];
      if (!daySlots || !Array.isArray(daySlots)) return [];

      return daySlots;
    },
    [consultantAvailability],
  );

  // Helper function to get time slots for specific date (new format)
  const getTimeSlotsForSpecificDate = useCallback(
    (dateString: string): string[] => {
      const serviceDurationMinutes =
        typeof serviceDuration === 'number' && serviceDuration > 0
          ? serviceDuration
          : 60;

      const windows = Array.isArray(consultantAvailability?.availabilityWindows)
        ? consultantAvailability.availabilityWindows
        : [];

      if (windows.length > 0) {
        const generatedSlots = windows
          .filter((windowEntry: any) => windowEntry?.date === dateString)
          .flatMap((windowEntry: any) => {
            const start = parseTimeToMinutes(windowEntry?.startTime || '');
            const end = parseTimeToMinutes(windowEntry?.endTime || '');
            if (start < 0 || end < 0 || end <= start) {
              return [];
            }

            const labels: string[] = [];
            let cursor = start;
            while (cursor + serviceDurationMinutes <= end) {
              labels.push(
                `${formatTimeFromMinutes(cursor)} - ${formatTimeFromMinutes(
                  cursor + serviceDurationMinutes,
                )}`,
              );
              cursor += serviceDurationMinutes;
            }
            return labels;
          });

        if (generatedSlots.length > 0) {
          return Array.from(new Set(generatedSlots));
        }
      }

      if (!consultantAvailability?.availabilitySlots) return [];

      const slot = consultantAvailability.availabilitySlots.find(
        (s: any) => s.date === dateString,
      );
      return slot ? slot.timeSlots : [];
    },
    [consultantAvailability, serviceDuration],
  );

  // Helper function to fetch booked slots for consultant
  const fetchBookedSlots = useCallback(async () => {
    if (!consultantId) return;

    try {
      if (__DEV__) {
        console.log('🔍 Fetching booked slots for consultant:', consultantId);
      }
      const response = await BookingService.getConsultantBookedSlots(
        consultantId,
      );
      if (__DEV__) {
        console.log('📅 Booked slots response:', response);
      }

      if (response?.bookedSlots) {
        const bookedSlotsSet = new Set<string>();
        response.bookedSlots.forEach((slot: any) => {
          const slotKey = `${slot.date}_${slot.time}`;
          bookedSlotsSet.add(slotKey);
        });

        setBookedSlots(bookedSlotsSet);
        if (__DEV__) {
          console.log(
            '✅ Loaded booked slots for consultant:',
            Array.from(bookedSlotsSet),
          );
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Error fetching booked slots:', error);
      }
      // Don't fail the entire component if booked slots can't be fetched
    }
  }, [consultantId]);

  // Helper function to check if a slot is booked
  const isSlotBooked = useCallback(
    (date: string, time: string): boolean => {
      const slotKey = `${date}_${time}`;
      const startOnlyKey = `${date}_${extractStartFromSlot(time)}`;
      return bookedSlots.has(slotKey) || bookedSlots.has(startOnlyKey);
    },
    [bookedSlots],
  );

  const highlightedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    const datesWithSlots = new Set<string>();

    if (
      !isConsultant &&
      Array.isArray(consultantAvailability?.availabilitySlots)
    ) {
      consultantAvailability.availabilitySlots.forEach((slot: any) => {
        if (
          slot?.date &&
          Array.isArray(slot?.timeSlots) &&
          slot.timeSlots.length > 0
        ) {
          datesWithSlots.add(slot.date);
        }
      });
    }

    if (!isConsultant && consultantAvailability?.availability) {
      const daysToProject = 90;
      for (let i = 0; i < daysToProject; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        const dayName = getDayName(dateString).toLowerCase();
        const daySlots = consultantAvailability.availability[dayName];
        if (Array.isArray(daySlots) && daySlots.length > 0) {
          datesWithSlots.add(dateString);
        }
      }
    }

    if (!isConsultant) {
      datesWithSlots.forEach(dateString => {
        marks[dateString] = {
          customStyles: {
            container: {
              backgroundColor: 'rgba(96, 193, 105, 0.18)',
              borderRadius: 8,
            },
            text: {
              color: COLORS.black,
              fontWeight: '600',
            },
          },
        };
      });
    }

    if (selectedDate) {
      marks[selectedDate] = {
        customStyles: {
          container: {
            backgroundColor: COLORS.green,
            borderRadius: 8,
          },
          text: {
            color: COLORS.white,
            fontWeight: '600',
          },
        },
      };
    }

    return marks;
  }, [consultantAvailability, getDayName, isConsultant, selectedDate]);

  const upcomingAvailableDates = useMemo(() => {
    const dates: Array<{ date: string; label: string; weekday: string }> = [];
    if (!consultantAvailability) {
      return dates;
    }

    const seen = new Set<string>();

    const addDate = (dateString: string) => {
      if (seen.has(dateString)) return;
      const dateObj = new Date(`${dateString}T00:00:00`);
      if (Number.isNaN(dateObj.getTime())) return;

      const label = dateObj.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      const weekday = dateObj.toLocaleDateString(undefined, {
        weekday: 'short',
      });

      dates.push({
        date: dateString,
        label,
        weekday,
      });
      seen.add(dateString);
    };

    if (Array.isArray(consultantAvailability?.availabilitySlots)) {
      consultantAvailability.availabilitySlots
        .filter(
          (slot: any) =>
            slot?.date &&
            Array.isArray(slot?.timeSlots) &&
            slot.timeSlots.length > 0,
        )
        .sort(
          (a: any, b: any) =>
            new Date(`${a.date}T00:00:00`).getTime() -
            new Date(`${b.date}T00:00:00`).getTime(),
        )
        .forEach((slot: any) => addDate(slot.date));
    }

    if (consultantAvailability?.availability) {
      const projectionDays = 180;
      for (let i = 0; i < projectionDays; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        const dayName = getDayName(dateString).toLowerCase();
        const daySlots = consultantAvailability.availability[dayName];
        if (Array.isArray(daySlots) && daySlots.length > 0) {
          addDate(dateString);
        }
      }
    }

    dates.sort(
      (a, b) =>
        new Date(`${a.date}T00:00:00`).getTime() -
        new Date(`${b.date}T00:00:00`).getTime(),
    );
    return dates.slice(0, 20);
  }, [consultantAvailability, getDayName]);

  const parseSlotTime = useCallback(
    (slot: string): { startDisplay: string; endDisplay: string } => {
      if (!slot) {
        return { startDisplay: '', endDisplay: '' };
      }

      const normalized = slot.replace(/–/g, '-');
      const parts = normalized
        .split('-')
        .map(part => part.trim())
        .filter(Boolean);

      const startDisplay = parts[0] || slot.trim();
      let endDisplay = parts[1] || '';

      if (!endDisplay) {
        endDisplay = calculateEndTime(
          startDisplay,
          typeof serviceDuration === 'number' && serviceDuration > 0
            ? serviceDuration
            : 60,
        );
      }

      return { startDisplay, endDisplay };
    },
    [serviceDuration],
  );

  const fetchAvailabilityData = useCallback(
    async (skipLoading = false) => {
      if (!consultantId) return;

      try {
        if (!skipLoading) {
          setLoadingAvailability(true);
        }

        const [availabilityResponse] = await Promise.all([
          ConsultantService.getConsultantAvailability(consultantId),
          fetchBookedSlots(),
        ]);

        if (__DEV__) {
          console.log('✅ Availability response:', availabilityResponse);
        }

        if (availabilityResponse?.available) {
          const hasAvailability =
            availabilityResponse.availability &&
            Object.keys(availabilityResponse.availability).length > 0;
          const hasAvailabilitySlots =
            availabilityResponse.availabilitySlots &&
            availabilityResponse.availabilitySlots.length > 0;

          if (hasAvailability || hasAvailabilitySlots) {
            setConsultantAvailability(availabilityResponse);
            if (__DEV__) {
              console.log(
                '✅ Consultant availability loaded:',
                availabilityResponse.availability,
              );
            }
          } else {
            if (__DEV__) {
              console.log('⚠️ Consultant has no availability set');
            }
            setConsultantAvailability(null);
          }
        } else {
          if (__DEV__) {
            console.log(
              '⚠️ Consultant not available:',
              availabilityResponse?.message,
            );
          }
          setConsultantAvailability(null);
        }
      } catch (error: any) {
        if (__DEV__) {
          console.error('❌ Error fetching consultant data:', error);
        }
        setConsultantAvailability(null);
      } finally {
        setLoadingAvailability(false);
      }
    },
    [consultantId, fetchBookedSlots],
  );

  useFocusEffect(
    useCallback(() => {
      fetchAvailabilityData();
    }, [fetchAvailabilityData]),
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchAvailabilityData(true);
    setIsRefreshing(false);
  }, [fetchAvailabilityData]);

  // Update time slots when date is selected
  useEffect(() => {
    if (!selectedDate || !consultantAvailability) return;

    // Check new format first (specific date slots)
    const specificSlots = getTimeSlotsForSpecificDate(selectedDate);
    if (specificSlots.length > 0) {
      setAvailableSlots(specificSlots);
      // Reset time slot selections for current date
      setSelectedTimeSlots([]);
      return;
    }

    // Fall back to legacy format (day-based availability)
    const dayName = getDayName(selectedDate);
    const slots = generateTimeSlotsForDay(dayName);
    setAvailableSlots(slots);
    // Reset time slot selections for current date
    setSelectedTimeSlots([]);
  }, [
    selectedDate,
    consultantAvailability,
    generateTimeSlotsForDay,
    getTimeSlotsForSpecificDate,
    getDayName,
  ]);

  // Use fetched slots or default slots
  const timeSlots =
    availableSlots.length > 0 ? availableSlots : defaultTimeSlots;

  const slotStateStats = useMemo(() => {
    if (!selectedDate || timeSlots.length === 0) {
      return { total: 0, bookedByOthers: 0, alreadyAdded: 0, open: 0 };
    }

    let bookedByOthers = 0;
    let alreadyAdded = 0;

    timeSlots.forEach(slot => {
      const slotStart = extractStartFromSlot(slot);
      const added = selectedSlots.some(
        s => s.date === selectedDate && s.startTime === slotStart,
      );
      const booked = isSlotBooked(selectedDate, slot);
      if (added) {
        alreadyAdded += 1;
      } else if (booked) {
        bookedByOthers += 1;
      }
    });

    return {
      total: timeSlots.length,
      bookedByOthers,
      alreadyAdded,
      open: Math.max(timeSlots.length - bookedByOthers - alreadyAdded, 0),
    };
  }, [selectedDate, timeSlots, selectedSlots, isSlotBooked]);

  // Handle time slot selection/deselection
  const handleTimeSlotToggle = (timeSlot: string) => {
    setSelectedTimeSlots(prev => {
      const isSelected = prev.includes(timeSlot);
      if (isSelected) {
        // Remove from selection
        return prev.filter(t => t !== timeSlot);
      } else {
        // Add to selection
        return [...prev, timeSlot];
      }
    });
  };

  // Handle adding current date's selected time slots to main selection
  const handleAddSlotsForDate = () => {
    if (!selectedDate || selectedTimeSlots.length === 0) {
      Alert.alert(
        'Selection Required',
        'Please select at least one time slot for the selected date',
      );
      return;
    }

    // Add all selected time slots for this date
    const newSlots = selectedTimeSlots.map(slotString => {
      const { startDisplay, endDisplay } = parseSlotTime(slotString);
      return {
        date: selectedDate,
        startTime: startDisplay || extractStartFromSlot(slotString),
        endTime: endDisplay,
        displayStartTime: startDisplay,
        displayEndTime: endDisplay,
      };
    });

    setSelectedSlots(prev => {
      const existingKeys = new Set(
        prev.map(slot => `${slot.date}_${slot.startTime}`),
      );
      const deduped = newSlots.filter(
        slot => !existingKeys.has(`${slot.date}_${slot.startTime}`),
      );
      if (deduped.length === 0) {
        return prev;
      }
      return [...prev, ...deduped];
    });
    setSelectedTimeSlots([]); // Reset current selections

    if (__DEV__) {
      console.log(
        '✅ Added slots for date:',
        selectedDate,
        'Slots:',
        newSlots.length,
      );
    }
  };

  // Handle removing a slot from main selection
  const handleRemoveSlot = (slotToRemove: {
    date: string;
    startTime: string;
  }) => {
    setSelectedSlots(prev =>
      prev.filter(
        slot =>
          !(
            slot.date === slotToRemove.date &&
            slot.startTime === slotToRemove.startTime
          ),
      ),
    );
  };

  // Handle booking - add ALL selected slots to cart
  const handleAddToCart = async () => {
    if (selectedSlots.length === 0) {
      Alert.alert(
        'No Slots Selected',
        'Please select at least one date and time slot before adding to cart',
      );
      return;
    }

    if (!consultantId || !serviceId) {
      Alert.alert('Error', 'Missing booking information');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Error', 'Please log in to book a consultation');
      return;
    }

    // Prepare cart item data with all booked slots
    const cartItem = {
      consultantId,
      consultantName: consultantName || 'Consultant',
      consultantCategory: route?.params?.consultantCategory || 'Consultation',
      serviceId,
      serviceTitle: serviceTitle || 'Consultation Service',
      serviceImageUrl: serviceImageUrl, // Include service image URL
      pricePerSlot: route?.params?.servicePrice || 100,
      bookedSlots: selectedSlots.map(slot => ({
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
      duration: serviceDuration,
    };

    if (__DEV__) {
      console.log('📦 Adding to cart:', {
        consultant: cartItem.consultantName,
        service: cartItem.serviceTitle,
        totalSlots: selectedSlots.length,
        slots: selectedSlots,
      });
    }

    // Navigate to cart with the new item
    navigation.navigate('Cart', cartItem);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader
        title={isConsultant ? 'Manage Availability' : 'Select Slots'}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.bookingContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.green}
          />
        }
      >
        {/* Calendar */}
        <View style={styles.calendarContainer}>
          {loadingAvailability ? (
            <View style={mergedStyles.loadingContainer}>
              <Text style={mergedStyles.loadingText}>
                Loading consultant availability...
              </Text>
            </View>
          ) : !consultantAvailability ? (
            <View style={mergedStyles.errorContainer}>
              <Text style={mergedStyles.errorText}>
                This consultant hasn't set their availability yet.{'\n'}
                Please check back later.
              </Text>
            </View>
          ) : (
            <Calendar
              current={selectedDate || undefined}
              minDate={new Date().toISOString().split('T')[0]} // Disable past dates
              onDayPress={day => {
                const { dateString } = day;
                if (!isDateAvailable(dateString)) {
                  Alert.alert(
                    'Date Not Available',
                    'This consultant is not available on this day',
                  );
                  return;
                }

                setSelectedDate(prev =>
                  prev === dateString ? '' : dateString,
                );
              }}
              markedDates={highlightedDates}
              markingType="custom"
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
          )}
        </View>

        {/* Available Time Slots */}
        <View style={styles.timeSlotsContainer}>
          <Text style={styles.timeSlotsTitle}>
            {isConsultant
              ? 'Set Your Available Time Slots'
              : 'Available Time Slots'}
          </Text>

          {!isConsultant && (
            <View style={mergedStyles.availableDatesContainer}>
              <Text style={mergedStyles.availableDatesHeading}>
                Upcoming available dates
              </Text>
              {upcomingAvailableDates.length === 0 ? (
                <Text style={mergedStyles.noUpcomingDatesText}>
                  This consultant hasn't published any availability yet.
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={mergedStyles.availableDatesScroll}
                >
                  {upcomingAvailableDates.map(({ date, label, weekday }) => {
                    const isActive = selectedDate === date;
                    return (
                      <TouchableOpacity
                        key={date}
                        style={[
                          mergedStyles.availableDateChip,
                          isActive && mergedStyles.availableDateChipActive,
                        ]}
                        onPress={() => {
                          if (isDateAvailable(date)) {
                            setSelectedDate(prev =>
                              prev === date ? '' : date,
                            );
                          }
                        }}
                      >
                        <Text
                          style={[
                            mergedStyles.availableDateChipLabel,
                            isActive &&
                              mergedStyles.availableDateChipLabelActive,
                          ]}
                        >
                          {label}
                        </Text>
                        <Text
                          style={[
                            mergedStyles.availableDateChipWeekday,
                            isActive &&
                              mergedStyles.availableDateChipWeekdayActive,
                          ]}
                        >
                          {weekday}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          )}

          {loadingSlots ? (
            <View style={styles.timeSlotsGrid}>
              <Text style={styles.loadingText}>Loading available slots...</Text>
            </View>
          ) : !selectedDate ? (
            <View style={styles.timeSlotsGrid}>
              <Text style={mergedStyles.noSlotsText}>
                Please select a date to see available time slots
              </Text>
            </View>
          ) : !isDateAvailable(selectedDate) ? (
            <View style={styles.timeSlotsGrid}>
              <Text style={mergedStyles.noSlotsText}>
                No availability on this day
              </Text>
            </View>
          ) : timeSlots.length === 0 ? (
            <View style={styles.timeSlotsGrid}>
              <Text style={mergedStyles.noSlotsText}>
                No time slots available for this day
              </Text>
            </View>
          ) : (
            <>
              {/* Show info about booked slots */}
              {selectedDate &&
                timeSlots.some(slot => isSlotBooked(selectedDate, slot)) && (
                  <View style={mergedStyles.bookedSlotsInfo}>
                    <Text style={mergedStyles.bookedSlotsInfoText}>
                      {timeSlots.every(slot => isSlotBooked(selectedDate, slot))
                        ? '🔒 All slots for this date are already booked by students'
                        : '🔒 Some slots are already booked by students'}
                    </Text>
                  </View>
                )}

              <View style={mergedStyles.slotLegendRow}>
                <Text style={mergedStyles.slotLegendText}>
                  Open: {slotStateStats.open}
                </Text>
                <Text style={mergedStyles.slotLegendText}>
                  Booked: {slotStateStats.bookedByOthers}
                </Text>
                <Text style={mergedStyles.slotLegendText}>
                  Added: {slotStateStats.alreadyAdded}
                </Text>
              </View>

              <View style={styles.timeSlotsGrid}>
                {timeSlots.map((slot, index) => {
                  const slotStart = extractStartFromSlot(slot);
                  const isAlreadyBooked = selectedSlots.some(
                    s => s.date === selectedDate && s.startTime === slotStart,
                  );
                  const isCurrentlySelected = selectedTimeSlots.includes(slot);
                  const isSlotBookedByOthers = isSlotBooked(selectedDate, slot);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.timeSlot,
                        isCurrentlySelected && styles.selectedTimeSlot,
                        isSlotBookedByOthers && mergedStyles.bookedByOthersSlot,
                        isAlreadyBooked && styles.bookedTimeSlot,
                      ]}
                      onPress={() => {
                        if (isAlreadyBooked) {
                          Alert.alert(
                            'Already Added',
                            'This slot is already in your selected sessions list.',
                          );
                          return;
                        }
                        if (isSlotBookedByOthers) {
                          Alert.alert(
                            'Slot Unavailable',
                            'This slot has already been booked. Please choose another available slot.',
                          );
                          return;
                        }
                        handleTimeSlotToggle(slot);
                      }}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          (isCurrentlySelected || isAlreadyBooked) &&
                            styles.selectedTimeSlotText,
                          isSlotBookedByOthers &&
                            mergedStyles.bookedByOthersText,
                        ]}
                      >
                        {slot} {isAlreadyBooked && '✓'}{' '}
                        {isSlotBookedByOthers && '🔒'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selectedTimeSlots.length > 0 && (
                <View style={mergedStyles.addSlotsButtonContainer}>
                  <AppButton
                    title={`Add ${selectedTimeSlots.length} slot${
                      selectedTimeSlots.length > 1 ? 's' : ''
                    } for ${selectedDate}`}
                    onPress={handleAddSlotsForDate}
                    style={mergedStyles.addSlotsButton}
                  />
                </View>
              )}
            </>
          )}
        </View>

        {/* Display All Selected Slots Summary */}
        {!isConsultant && selectedSlots.length > 0 && (
          <View style={styles.selectedTimeInfo}>
            <Text style={styles.selectedTimeLabel}>
              📅 Selected Sessions ({selectedSlots.length})
            </Text>
            <ScrollView
              style={mergedStyles.selectedSlotsList}
              nestedScrollEnabled
            >
              {selectedSlots.map((slot, idx) => (
                <View key={idx} style={mergedStyles.selectedSlotItem}>
                  <View style={mergedStyles.slotInfo}>
                    <Text style={mergedStyles.slotDate}>{slot.date}</Text>
                    <Text style={mergedStyles.slotTime}>
                      {slot.displayStartTime || slot.startTime}
                      {slot.displayEndTime ? ` - ${slot.displayEndTime}` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveSlot(slot)}
                    style={mergedStyles.removeSlotButton}
                  >
                    <Text style={mergedStyles.removeSlotText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <Text style={mergedStyles.totalPriceText}>
              Total: $
              {(route?.params?.servicePrice || 100) * selectedSlots.length}
            </Text>
          </View>
        )}

        {/* Action Button */}
        <View style={styles.bookButtonContainer}>
          <AppButton
            title={
              isConsultant
                ? 'Save Availability'
                : `Add ${selectedSlots.length || 0} Session${
                    selectedSlots.length !== 1 ? 's' : ''
                  } to Cart`
            }
            onPress={() => {
              if (isConsultant) {
                // Consultant: Navigate to ConsultantAvailability
                navigation.navigate('ConsultantAvailability');
              } else {
                // Student: Add to cart
                handleAddToCart();
              }
            }}
            disabled={!isConsultant && selectedSlots.length === 0}
            style={styles.bookButton}
            textStyle={styles.bookButtonText}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Additional styles for new elements
const additionalStyles = {
  loadingContainer: {
    padding: 20,
    alignItems: 'center' as const,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center' as const,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.orange,
    textAlign: 'center' as const,
  },
  noSlotsText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },
  addSlotsButtonContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  addSlotsButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 12,
  },
  availableDatesContainer: {
    marginBottom: 20,
  },
  availableDatesHeading: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 12,
  },
  availableDatesScroll: {
    paddingRight: 24,
  },
  noUpcomingDatesText: {
    fontSize: 14,
    color: COLORS.gray,
    fontStyle: 'italic' as const,
  },
  availableDateChip: {
    backgroundColor: COLORS.lightBackground,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    minWidth: 76,
  },
  availableDateChipActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  availableDateChipLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    textAlign: 'center' as const,
  },
  availableDateChipLabelActive: {
    color: COLORS.white,
  },
  availableDateChipWeekday: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center' as const,
    marginTop: 4,
  },
  availableDateChipWeekdayActive: {
    color: COLORS.white,
  },
  selectedSlotsList: {
    maxHeight: 200,
    marginVertical: 10,
  },
  selectedSlotItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.green,
  },
  slotInfo: {
    flex: 1,
  },
  slotDate: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.green,
    marginBottom: 4,
  },
  slotTime: {
    fontSize: 13,
    color: COLORS.green,
  },
  removeSlotButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.red,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginLeft: 12,
  },
  removeSlotText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  totalPriceText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: COLORS.green,
    textAlign: 'right' as const,
    marginTop: 8,
  },
  bookedByOthersSlot: {
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.gray,
    opacity: 0.6,
  },
  bookedByOthersText: {
    color: COLORS.gray,
    textDecorationLine: 'line-through' as const,
  },
  bookedSlotsInfo: {
    backgroundColor: COLORS.orange,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  bookedSlotsInfoText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  slotLegendRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: COLORS.lightBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    marginHorizontal: 16,
  },
  slotLegendText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
};

// Merge additional styles with existing styles
const mergedStyles = {
  ...styles,
  ...additionalStyles,
};

export default BookingSlots;
