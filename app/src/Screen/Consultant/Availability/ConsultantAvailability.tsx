import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import Loader from '../../../components/ui/Loader';
import { COLORS } from '../../../constants/core/colors';
import { useAuth } from '../../../contexts/AuthContext';
import { getConsultantProfile } from '../../../services/consultantFlow.service';
import { ConsultantService } from '../../../services/consultant.service';
import { Plus, X, Trash2 } from 'lucide-react-native';
import { consultantAvailabilityStyles as cleanStyles } from '../../../constants/styles/consultantAvailabilityStyles';

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

const cloneAvailabilitySlots = (
  slots: AvailabilitySlot[],
): AvailabilitySlot[] =>
  slots.map(slot => ({
    ...slot,
    timeSlots: [...slot.timeSlots],
  }));

const ConsultantAvailability = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const {
    serviceId: initialServiceId,
    serviceDuration: initialServiceDuration,
    serviceTitle: initialServiceTitle,
  } = route?.params ?? {};
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [_availability, setAvailability] =
    useState<AvailabilitySchedule | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<
    AvailabilitySlot[]
  >([]);
  const [draftSlots, setDraftSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [slotDuration, setSlotDuration] = useState<number | null>(
    initialServiceDuration ?? null,
  );
  const [, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any | null>(null);

  useEffect(() => {
    if (initialServiceDuration && initialServiceDuration > 0) {
      setSlotDuration(initialServiceDuration);
    }
  }, [initialServiceDuration]);

  useEffect(() => {
    if ((initialServiceId || initialServiceTitle) && !selectedService) {
      setSelectedService({
        id: initialServiceId ?? null,
        title: initialServiceTitle ?? 'Selected service',
        duration: initialServiceDuration ?? slotDuration ?? undefined,
      });
    }
  }, [
    initialServiceId,
    initialServiceTitle,
    initialServiceDuration,
    slotDuration,
    selectedService,
  ]);

  const resetAvailabilityForm = useCallback(
    (baseSlots?: AvailabilitySlot[]) => {
      const slotsToUse = baseSlots ?? availabilitySlots;

      setSelectedDates([]);
      setStartTime('');
      setEndTime('');
      setShowStartTimePicker(false);
      setShowEndTimePicker(false);
      setDraftSlots(cloneAvailabilitySlots(slotsToUse));
    },
    [availabilitySlots],
  );

  const handleOpenAvailabilityModal = useCallback(() => {
    resetAvailabilityForm(availabilitySlots);
    setShowAvailabilityModal(true);
  }, [availabilitySlots, resetAvailabilityForm]);

  const handleCloseAvailabilityModal = useCallback(
    (baseSlots?: AvailabilitySlot[]) => {
      resetAvailabilityForm(baseSlots);
      setShowAvailabilityModal(false);
    },
    [resetAvailabilityForm],
  );

  // Helper function to get time slots for a specific date
  const getTimeSlotsForDate = (
    dateString: string,
    sourceSlots: AvailabilitySlot[] = draftSlots,
  ): string[] => {
    const slot = sourceSlots.find(s => s.date === dateString);
    return slot ? [...slot.timeSlots] : [];
  };

  const getSlotStartMinutes = useCallback((slotLabel: string): number => {
    const [start] = slotLabel.split(' - ');
    return parseTime(start ?? '');
  }, []);

  const sortedAvailabilitySlots = useMemo(
    () =>
      availabilitySlots
        .map(slot => ({
          ...slot,
          timeSlots: [...slot.timeSlots].sort(
            (a, b) => getSlotStartMinutes(a) - getSlotStartMinutes(b),
          ),
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),
    [availabilitySlots, getSlotStartMinutes],
  );

  // Helper function to check if a date is in the past
  const isPastDate = (dateString: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const selectedDate = new Date(dateString);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate < today;
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDateString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle multiple date selection
  const handleDatePress = (day: any) => {
    const dateString = day.dateString;
    
    // Prevent selection of past dates
    if (isPastDate(dateString)) {
      Alert.alert(
        'Invalid Date',
        'You cannot select past dates. Please select today or a future date.',
      );
      return;
    }

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
  function parseTime(timeStr: string): number {
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
  }

  function formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    return `${displayHours.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')} ${period}`;
  }

  const fetchConsultantServices = useCallback(async () => {
    if (!user?.uid) {
      return;
    }

    try {
      console.log(
        '📦 [ConsultantAvailability] Fetching consultant services for slot duration...',
      );
      const response = await ConsultantService.getConsultantServices(user.uid);
      const fetchedServices = response?.services || response || [];
      setServices(fetchedServices);

      if (fetchedServices.length === 0) {
        console.log(
          'ℹ️ [ConsultantAvailability] No services found for consultant; using default slot duration',
        );
        return;
      }

      let matchedService =
        fetchedServices.find(
          (service: any) => service.id === initialServiceId,
        ) || null;

      if (!matchedService && initialServiceTitle) {
        matchedService =
          fetchedServices.find(
            (service: any) => service.title === initialServiceTitle,
          ) || null;
      }

      if (!matchedService) {
        matchedService = fetchedServices[0];
      }

      if (matchedService) {
        setSelectedService(matchedService);
        if (!initialServiceDuration || initialServiceDuration <= 0) {
          const derivedDuration = matchedService.duration;
          if (derivedDuration && derivedDuration > 0) {
            setSlotDuration(derivedDuration);
          } else {
            setSlotDuration(null);
          }
        }
      }
    } catch (error) {
      console.error(
        '❌ [ConsultantAvailability] Error fetching consultant services:',
        error,
      );
    }
  }, [user?.uid, initialServiceId, initialServiceTitle, initialServiceDuration]);

  useEffect(() => {
    fetchConsultantServices();
  }, [fetchConsultantServices]);

  // Add time slots for selected dates
  const addTimeSlots = () => {
    if (selectedDates.length === 0 || !startTime || !endTime) {
      Alert.alert(
        'Error',
        'Please select at least one date and enter both start and end times',
      );
      return;
    }

    if (!slotDuration || slotDuration <= 0) {
      Alert.alert(
        'Duration Required',
        'Please ensure the selected service has a valid duration before adding availability.',
      );
      return;
    }

    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);

    if (startMinutes >= endMinutes) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    // Filter out past dates before processing
    const validDates = selectedDates.filter(dateString => {
      if (isPastDate(dateString)) {
        console.warn(`⚠️ Skipping past date: ${dateString}`);
        return false;
      }
      return true;
    });

    if (validDates.length === 0) {
      Alert.alert(
        'Error',
        'All selected dates are in the past. Please select today or future dates.',
      );
      return;
    }

    const totalDuration = endMinutes - startMinutes;
    if (totalDuration < slotDuration) {
      Alert.alert(
        'Error',
        `Selected range must be at least ${slotDuration} minutes.`,
      );
      return;
    }

    if (totalDuration % slotDuration !== 0) {
      Alert.alert(
        'Invalid Duration',
        `Please choose a time range in ${slotDuration}-minute increments.`,
      );
      return;
    }

    const durationPerSlot = slotDuration;
    const newSlotLabels: string[] = [];
    let currentStart = startMinutes;
    while (currentStart < endMinutes) {
      const currentEnd = currentStart + durationPerSlot;
      const slotLabel = `${formatTime(currentStart)} - ${formatTime(currentEnd)}`;
      newSlotLabels.push(slotLabel);
      currentStart = currentEnd;
    }

    // Check for overlapping slots
    let totalSlotsAdded = 0;
    let overlappingDates: string[] = [];
    const overlappingDetails: Record<string, string[]> = {};

    let updatedSlots = cloneAvailabilitySlots(draftSlots);
    const datesWithNewSlots = new Set<string>();

    validDates.forEach(dateString => {
      const existingIndex = updatedSlots.findIndex(slot => slot.date === dateString);

      if (existingIndex !== -1) {
        const existingSlot = updatedSlots[existingIndex];

        if (existingSlot.timeSlots.length > 0) {
          const duplicatesForDate = newSlotLabels.filter(slotLabel =>
            existingSlot.timeSlots.includes(slotLabel),
          );
          const uniqueNewSlots = newSlotLabels.filter(
            slotLabel => !existingSlot.timeSlots.includes(slotLabel),
          );

          if (duplicatesForDate.length > 0) {
            const readableDate = new Date(dateString).toLocaleDateString();
            if (!overlappingDates.includes(readableDate)) {
              overlappingDates.push(readableDate);
            }
            overlappingDetails[readableDate] = Array.from(
              new Set([
                ...(overlappingDetails[readableDate] || []),
                ...duplicatesForDate,
              ]),
            );
          }

          if (uniqueNewSlots.length > 0) {
            const mergedSlots = [...existingSlot.timeSlots, ...uniqueNewSlots].sort(
              (a, b) => getSlotStartMinutes(a) - getSlotStartMinutes(b),
            );

            updatedSlots[existingIndex] = {
              ...existingSlot,
              timeSlots: mergedSlots,
            };
            totalSlotsAdded += uniqueNewSlots.length;
            datesWithNewSlots.add(dateString);
          }
        } else {
          updatedSlots[existingIndex] = {
            ...existingSlot,
            timeSlots: [...newSlotLabels],
          };
          totalSlotsAdded += newSlotLabels.length;
          datesWithNewSlots.add(dateString);
        }
      } else {
        updatedSlots.push({
          date: dateString,
          timeSlots: [...newSlotLabels],
        });
        totalSlotsAdded += newSlotLabels.length;
        datesWithNewSlots.add(dateString);
      }
    });

    if (totalSlotsAdded > 0) {
      updatedSlots = updatedSlots
        .map(slot => ({
          ...slot,
          timeSlots: [...slot.timeSlots].sort(
            (a, b) => getSlotStartMinutes(a) - getSlotStartMinutes(b),
          ),
        }))
        .sort(
          (a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
      setDraftSlots(updatedSlots);
    }

    // Clear inputs
    setStartTime('');
    setEndTime('');
    setShowStartTimePicker(false);
    setShowEndTimePicker(false);

    // Show overlap alert if conflicts found
    if (overlappingDates.length > 0) {
      let overlapMessage = `Time slot overlap detected!\n\n`;
      overlapMessage += `The following slots already exist:\n\n`;
      overlapMessage += overlappingDates
        .map(date => {
          const duplicates = overlappingDetails[date] || [];
          return `${date}:\n${duplicates.map(slot => ` • ${slot}`).join('\n')}`;
        })
        .join('\n\n');
      overlapMessage += `\n\nPlease select a different time to create slots.`;

      Alert.alert('Time Slot Overlap', overlapMessage);
    } else if (totalSlotsAdded > 0) {
      Alert.alert(
        'Success',
        `Added ${totalSlotsAdded} time slot(s) for ${datesWithNewSlots.size} date(s)`,
      );
      // Clear selected dates after successful addition
      setSelectedDates([]);
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
        draftSlots.length,
      );

      const result = await ConsultantService.setAvailabilitySlots(
        user.uid,
        draftSlots,
      );
      console.log('✅ [ConsultantAvailability] Save result:', result);
      setAvailabilitySlots(cloneAvailabilitySlots(draftSlots));
      handleCloseAvailabilityModal(draftSlots);
      await fetchConsultantAvailability();
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
          // Filter out past dates from loaded slots
          const validSlots = slots.filter((slot: AvailabilitySlot) => {
            if (isPastDate(slot.date)) {
              console.warn(`⚠️ Filtering out past date slot: ${slot.date}`);
              return false;
            }
            return true;
          });
          setAvailabilitySlots(validSlots);
          setDraftSlots(cloneAvailabilitySlots(validSlots));
          if (validSlots.length < slots.length) {
            console.log(
              `ℹ️ [ConsultantAvailability] Filtered out ${slots.length - validSlots.length} past date slot(s)`,
            );
          }
        } else {
          setAvailabilitySlots([]);
          setDraftSlots([]);
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
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleDeleteSlot = useCallback(
    (date: string, slotLabel: string) => {
      Alert.alert(
        'Delete Availability',
        `Remove the slot ${slotLabel}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              if (!user?.uid) {
                Alert.alert(
                  'Error',
                  'Unable to delete slot. Please log in again.',
                );
                return;
              }

              const removeSlot = async () => {
                try {
                  await ConsultantService.deleteAvailabilitySlot(
                    user.uid,
                    date,
                    slotLabel,
                  );

                  setDraftSlots(prev =>
                    prev
                      .map(slot =>
                        slot.date === date
                          ? {
                              ...slot,
                              timeSlots: slot.timeSlots.filter(
                                time => time !== slotLabel,
                              ),
                            }
                          : slot,
                      )
                      .filter(slot => slot.timeSlots.length > 0),
                  );

                  setAvailabilitySlots(prev =>
                    prev
                      .map(slot =>
                        slot.date === date
                          ? {
                              ...slot,
                              timeSlots: slot.timeSlots.filter(
                                time => time !== slotLabel,
                              ),
                            }
                          : slot,
                      )
                      .filter(slot => slot.timeSlots.length > 0),
                  );

                  await fetchConsultantAvailability();
                } catch (error: any) {
                  console.error(
                    '❌ [ConsultantAvailability] Error deleting slot:',
                    error,
                  );
                  Alert.alert(
                    'Error',
                    'Failed to delete the availability slot. Please try again.',
                  );
                }
              };

              removeSlot();
            },
          },
        ],
        { cancelable: true },
      );
    },
    [user?.uid, fetchConsultantAvailability],
  );

  useEffect(() => {
    console.log('🚀 ConsultantAvailability useEffect starting...');

    setAvailability({
      days: [],
      startTime: '',
      endTime: '',
      timezone: 'UTC',
    });
    setAvailabilitySlots([]);
    setDraftSlots([]);

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
        <Loader message="Setting up availability calendar..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={cleanStyles.safeArea} edges={['top']}>
      <ScreenHeader
        title="My Availability"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={cleanStyles.headerAction}
            onPress={handleOpenAvailabilityModal}
            disabled={saving}
          >
            <Plus size={22} color={COLORS.black} />
          </TouchableOpacity>
        }
      />

      {selectedService && (
        <View style={cleanStyles.serviceInfoBanner}>
          <Text style={cleanStyles.serviceInfoTitle}>
            {selectedService.title}
          </Text>
          <Text style={cleanStyles.serviceInfoSubtitle}>
            {slotDuration && slotDuration > 0
              ? `Time slots use ${slotDuration}-minute duration`
              : 'Set a duration for this service to create availability slots'}
          </Text>
        </View>
      )}

      <ScrollView
        style={cleanStyles.container}
        showsVerticalScrollIndicator={false}
      >
        {sortedAvailabilitySlots.length === 0 ? (
          <View style={cleanStyles.emptyStateContainer}>
            <Text style={cleanStyles.emptyStateTitle}>
              No availability set yet
            </Text>
            <Text style={cleanStyles.emptyStateSubtitle}>
              Use the + button to create your first availability slot.
            </Text>
          </View>
        ) : (
          <View style={cleanStyles.availabilityList}>
            <Text style={cleanStyles.sectionTitle}>Upcoming Availability</Text>
            {sortedAvailabilitySlots.map(slot => (
              <View key={slot.date} style={cleanStyles.slotCard}>
                <Text style={cleanStyles.slotDate}>
                  {new Date(slot.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <View style={cleanStyles.slotTimesWrapper}>
                  {slot.timeSlots.map(time => (
                    <View
                      key={`${slot.date}-${time}`}
                      style={cleanStyles.slotTimeChip}
                    >
                      <Text style={cleanStyles.slotTimeText}>{time}</Text>
                      <TouchableOpacity
                        style={cleanStyles.slotDeleteButton}
                        onPress={() => handleDeleteSlot(slot.date, time)}
                      >
                        <Trash2 size={14} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showAvailabilityModal}
        animationType="slide"
        onRequestClose={() => handleCloseAvailabilityModal()}
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={cleanStyles.modalSafeArea} edges={['top']}>
          <View style={cleanStyles.modalHeader}>
            <Text style={cleanStyles.modalTitle}>Set Availability</Text>
            <TouchableOpacity
              onPress={() => handleCloseAvailabilityModal()}
              style={cleanStyles.modalCloseButton}
            >
              <X size={22} color={COLORS.black} />
            </TouchableOpacity>
          </View>

          {selectedService && (
            <View style={cleanStyles.modalServiceInfo}>
              <Text style={cleanStyles.modalServiceTitle}>
                {selectedService.title}
              </Text>
              <Text style={cleanStyles.modalServiceSubtitle}>
                {slotDuration && slotDuration > 0
                  ? `Slot duration: ${slotDuration} minutes`
                  : 'Slot duration unavailable. Update the service settings.'}
              </Text>
            </View>
          )}

          <ScrollView
            style={cleanStyles.container}
            showsVerticalScrollIndicator={false}
          >
            <View style={cleanStyles.calendarCard}>
              <Calendar
                onDayPress={handleDatePress}
                minDate={getTodayDateString()}
                markedDates={{
                  ...Object.fromEntries(
                    selectedDates.map(dateString => [
                      dateString,
                      {
                        selected: true,
                        selectedColor: '#90EE90',
                        selectedTextColor: '#333333',
                      },
                    ]),
                  ),
                  ...Object.fromEntries(
                    draftSlots
                      .map(slot => {
                        const dateString = slot.date;
                        if (
                          !selectedDates.includes(dateString) &&
                          slot.timeSlots.length > 0
                        ) {
                          return [
                            dateString,
                            {
                              marked: true,
                              dotColor: '#4CAF50',
                            },
                          ];
                        }
                        return [];
                      })
                      .filter(entry => entry.length === 2),
                  ),
                }}
                theme={{
                  backgroundColor: '#FFFFFF',
                  calendarBackground: '#FFFFFF',
                  textSectionTitleColor: '#999999',
                  selectedDayBackgroundColor: '#90EE90',
                  selectedDayTextColor: '#333333',
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

            {selectedDates.length > 0 && (
              <View style={cleanStyles.timeInputSection}>
                <Text style={cleanStyles.timeInputTitle}>
                  Add Time Slots for {selectedDates.length} Selected Date
                  {selectedDates.length > 1 ? 's' : ''}
                </Text>

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

                <TouchableOpacity
                  style={cleanStyles.addSlotsButton}
                  onPress={addTimeSlots}
                >
                  <Text style={cleanStyles.addSlotsButtonText}>
                    Add Time Slots
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {showStartTimePicker && (
              <View style={cleanStyles.timePickerModal}>
                <View style={cleanStyles.timePickerContainer}>
                  <Text style={cleanStyles.timePickerTitle}>
                    Select Start Time
                  </Text>
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
                        <Text style={cleanStyles.timePickerOptionText}>
                          {time}
                        </Text>
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
                  <Text style={cleanStyles.timePickerTitle}>
                    Select End Time
                  </Text>
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
                        <Text style={cleanStyles.timePickerOptionText}>
                          {time}
                        </Text>
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

            {selectedDates.length > 0 && (
              <View style={cleanStyles.timeSlotsSection}>
                <Text style={cleanStyles.timeSlotsTitle}>Time Slots Summary</Text>
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
      </Modal>
    </SafeAreaView>
  );
};


export default ConsultantAvailability;
