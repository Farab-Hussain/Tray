import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, ActivityIndicator, RefreshControl, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { useAuth } from '../../../contexts/AuthContext';
import { COLORS } from '../../../constants/core/colors';
import { ConsultantService } from '../../../services/consultant.service';
import LoadingState from '../../../components/ui/LoadingState';
import { Calendar, Clock, XCircle } from 'lucide-react-native';
import { formatDateWithWeekday, formatTimeString } from '../../../utils/dateUtils';
import { logger } from '../../../utils/logger';

interface Slot {
  date: string;
  slots: Array<{
    time: string;
    isAvailable: boolean;
  }>;
}

const ConsultantSlots = ({ navigation }: any) => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSlots = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
            if (__DEV__) {
        logger.debug('📅 Fetching consultant availability slots...')
      };
      
      const response = await ConsultantService.getConsultantAvailability(user.uid);
            if (__DEV__) {
        logger.debug('✅ Received availability data:', response)
      };
      
      // Transform the availability data into slots format
      if (response && response.availabilitySlots && Array.isArray(response.availabilitySlots)) {
        const availabilitySlots = response.availabilitySlots;
        const slotsData: Slot[] = [];
        
                if (__DEV__) {
          logger.debug('🔍 Processing availability slots:', availabilitySlots.length)
        };
        
        // Transform availability slots into our Slot format
        availabilitySlots.forEach((slotGroup: any) => {
          if (slotGroup.date && slotGroup.timeSlots && Array.isArray(slotGroup.timeSlots) && slotGroup.timeSlots.length > 0) {
                        if (__DEV__) {
              logger.debug(`  Processing date: ${slotGroup.date} with ${slotGroup.timeSlots.length} time slots`)
            };
            slotsData.push({
              date: slotGroup.date,
              slots: slotGroup.timeSlots.map((timeSlot: string) => ({
                time: timeSlot,
                isAvailable: true
              }))
            });
          }
        });
        
        // Sort by date
        slotsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
                if (__DEV__) {
          logger.debug(`✅ Processed ${slotsData.length} slot groups`)
        };
        setSlots(slotsData);
      } else {
                if (__DEV__) {
          logger.debug('⚠️ No availability slots found in response')
        };
        setSlots([]);
      }
    } catch (error) {
            if (__DEV__) {
        logger.error('❌ Error fetching consultant slots:', error)
      };
      setSlots([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSlots();
  };


  const handleDeleteSlot = async (date: string, time: string) => {
    try {
            if (__DEV__) {
        logger.debug('🗑️ Deleting slot:', date, time)
      };
      
      if (!user?.uid) {
                if (__DEV__) {
          logger.error('❌ User ID not available')
        };
        return;
      }

      // Show confirmation alert
      Alert.alert(
        'Delete Slot',
        `Are you sure you want to delete the slot "${formatTimeString(time)}" on ${formatDateWithWeekday(date)}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsLoading(true);
                await ConsultantService.deleteAvailabilitySlot(user.uid, date, time);
                                if (__DEV__) {
                  logger.debug('✅ Slot deleted successfully')
                };
                
                // Refresh the slots list
                await fetchSlots();
              } catch (error) {
                                if (__DEV__) {
                  logger.error('❌ Error deleting slot:', error)
                };
                Alert.alert('Issue', 'Failed to delete slot. Please try again.');
              } finally {
                setIsLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
            if (__DEV__) {
        logger.error('❌ Error in handleDeleteSlot:', error)
      };
    }
  };

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader 
        title="My Slots" 
        onBackPress={() => navigation.goBack()} 
      />

      <ScrollView 
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.green]}
            tintColor={COLORS.green}
          />
        }
      >
        {isLoading ? (
          <LoadingState message="Loading your slots..." />
        ) : slots.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={64} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No Slots Created</Text>
            <Text style={styles.emptySubtitle}>
              You haven't created any availability slots yet.{'\n'}
              Go to Availability to create your first slot.
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('ConsultantAvailability')}
            >
              <Text style={styles.createButtonText}>Create Availability</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.slotsContainer}>
            {slots.map((slotGroup, index) => (
              <View key={index} style={styles.dateCard}>
                {/* Date Header */}
                <View style={styles.dateHeader}>
                  <Calendar size={20} color={COLORS.green} />
                  <Text style={styles.dateText}>{formatDateWithWeekday(slotGroup.date)}</Text>
                  <Text style={styles.slotCount}>
                    {slotGroup.slots.length} {slotGroup.slots.length === 1 ? 'slot' : 'slots'}
                  </Text>
                </View>

                {/* Slots List */}
                <View style={styles.slotsList}>
                  {slotGroup.slots.map((slot, slotIndex) => (
                    <View key={slotIndex} style={styles.slotItem}>
                      <View style={styles.slotInfo}>
                        <Clock size={16} color={COLORS.green} />
                        <Text style={styles.slotTime}>{formatTimeString(slot.time)}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteSlot(slotGroup.date, slot.time)}
                      >
                        <XCircle size={16} color={COLORS.red} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Total Slots Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Total Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Dates:</Text>
                <Text style={styles.summaryValue}>{slots.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Slots:</Text>
                <Text style={styles.summaryValue}>
                  {slots.reduce((total, slotGroup) => total + slotGroup.slots.length, 0)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  slotsContainer: {
    paddingBottom: 20,
  },
  dateCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.chatInputBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginLeft: 8,
  },
  slotCount: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  slotsList: {
    padding: 8,
  },
  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  slotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 4,
  },
  summaryCard: {
    backgroundColor: COLORS.green,
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default ConsultantSlots;
