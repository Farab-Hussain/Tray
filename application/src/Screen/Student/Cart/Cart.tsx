import React, { useEffect, useState } from 'react';
import { Text, ScrollView, View, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { servicesStackStyles as styles } from '../../../constants/styles/servicesStackStyles';
import { COLORS } from '../../../constants/core/colors';
import CartCard from '../../../components/ui/CartCard';
import Summary from '../../../components/ui/Summary';
import { useAuth } from '../../../contexts/AuthContext';
import { ConsultantService } from '../../../services/consultant.service';

interface BookedSlot {
  date: string;
  startTime: string;
  endTime: string;
}

interface CartItem {
  id: string;
  consultantId: string;
  consultantName: string;
  consultantCategory: string;
  serviceId: string;
  serviceTitle: string;
  pricePerSlot: number;
  bookedSlots: BookedSlot[];
  counter: number; // Total number of slots = bookedSlots.length
  totalPrice: number; // counter × pricePerSlot
  duration?: number;
  
  // For backward compatibility with old format
  price?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
}

const CART_STORAGE_KEY = '@tray_cart_items';

const Cart = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const [cartItemsState, setCartItemsState] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Load cart from AsyncStorage and add new item if coming from BookingSlots
  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
        let existingItems: CartItem[] = storedCart ? JSON.parse(storedCart) : [];

        // If coming from BookingSlots with new booking data
        const newBooking = route?.params;
        if (newBooking && newBooking.consultantId && newBooking.serviceId) {
          console.log('📦 Adding new item to cart:', newBooking);

          // Check if this consultant+service combination already exists
          const existingItemIndex = existingItems.findIndex(
            item => 
              item.consultantId === newBooking.consultantId &&
              item.serviceId === newBooking.serviceId
          );

          if (existingItemIndex >= 0 && newBooking.bookedSlots) {
            // Consultant+Service already in cart - merge booked slots
            const existingItem = existingItems[existingItemIndex];
            const newSlots = newBooking.bookedSlots;
            
            // Filter out any duplicate slots
            const uniqueNewSlots = newSlots.filter((newSlot: BookedSlot) =>
              !existingItem.bookedSlots.some(
                existingSlot =>
                  existingSlot.date === newSlot.date &&
                  existingSlot.startTime === newSlot.startTime
              )
            );
            
            if (uniqueNewSlots.length === 0) {
              Alert.alert(
                'Duplicate Slots',
                'All selected slots are already in your cart.',
                [{ text: 'OK' }]
              );
            } else {
              // Merge unique slots
              existingItems[existingItemIndex].bookedSlots = [
                ...existingItem.bookedSlots,
                ...uniqueNewSlots
              ];
              existingItems[existingItemIndex].counter = existingItems[existingItemIndex].bookedSlots.length;
              existingItems[existingItemIndex].totalPrice = 
                existingItems[existingItemIndex].counter * existingItems[existingItemIndex].pricePerSlot;
              
              await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(existingItems));
              
              console.log('✅ Merged slots to existing cart item:', {
                consultant: existingItem.consultantName,
                addedSlots: uniqueNewSlots.length,
                totalSlots: existingItems[existingItemIndex].counter
              });
            }
          } else if (newBooking.bookedSlots && newBooking.bookedSlots.length > 0) {
            // New consultant+service - add new item with all booked slots
            const newItem: CartItem = {
              id: `${newBooking.consultantId}-${newBooking.serviceId}-${Date.now()}`,
              consultantId: newBooking.consultantId,
              consultantName: newBooking.consultantName,
              consultantCategory: newBooking.consultantCategory,
              serviceId: newBooking.serviceId,
              serviceTitle: newBooking.serviceTitle,
              pricePerSlot: newBooking.pricePerSlot,
              bookedSlots: newBooking.bookedSlots,
              counter: newBooking.bookedSlots.length,
              totalPrice: newBooking.bookedSlots.length * newBooking.pricePerSlot,
              duration: newBooking.duration,
            };
            existingItems.push(newItem);
            await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(existingItems));
            
            console.log('✅ Added new booking to cart:', {
              consultant: newItem.consultantName,
              service: newItem.serviceTitle,
              totalSlots: newItem.counter,
              totalItemsInCart: existingItems.length
            });
          }
        }

        setCartItemsState(existingItems);
      } catch (error) {
        console.error('Error loading cart:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [route?.params]);

  // Save cart whenever it changes
  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItemsState));
    }
  }, [cartItemsState, loading]);

  // Calculate totals based on current state
  const subtotal = cartItemsState.reduce((total, item) => {
    // Support both old and new format
    const itemTotal = item.totalPrice || (item.price || item.pricePerSlot) * item.counter;
    return total + itemTotal;
  }, 0);

  // Helper function to calculate end time
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const timeMatch = startTime.match(/(\d+)[:.](\d+)\s*(AM|PM)/i);
    if (!timeMatch) return startTime;
    
    let hours = parseInt(timeMatch[1], 10);
    let minutes = parseInt(timeMatch[2], 10);
    const period = timeMatch[3];
    
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
    
    return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${endPeriod}`;
  };

  // Function to update item counter (Smart Increment/Decrement with Race Condition Prevention)
  const updateItemCounter = async (itemId: string, newCounter: number) => {
    const item = cartItemsState.find(i => i.id === itemId);
    if (!item) return;

    // Prevent multiple simultaneous updates for the same item
    if (updatingItems.has(itemId)) {
      console.log('⚠️ Update already in progress for item:', itemId);
      return;
    }

    const currentCounter = item.counter;
    
    // DECREMENT: Remove most recently added slot
    if (newCounter < currentCounter) {
      if (item.bookedSlots && item.bookedSlots.length > 1) {
        setCartItemsState(prevItems =>
          prevItems.map(i => {
            if (i.id === itemId) {
              const updatedSlots = i.bookedSlots.slice(0, -1); // Remove last slot (LIFO)
              return {
                ...i,
                bookedSlots: updatedSlots,
                counter: updatedSlots.length,
                totalPrice: updatedSlots.length * i.pricePerSlot
              };
            }
            return i;
          })
        );
        console.log('✅ Decremented: Removed last slot');
      } else {
        Alert.alert('Minimum Reached', 'Cannot reduce below 1 session. Use the delete button to remove this item.');
      }
      return;
    }

    // INCREMENT: Add next available slot from same date
    if (newCounter > currentCounter) {
      // Mark this item as being updated
      setUpdatingItems(prev => new Set(prev).add(itemId));
      
      try {
        // Fetch consultant availability
        const availability = await ConsultantService.getConsultantAvailability(item.consultantId);
        
        if (!availability || !availability.availabilitySlots) {
          Alert.alert('No Availability', 'Unable to fetch consultant availability.');
          return;
        }

        // Get dates from booked slots
        const bookedDates = [...new Set(item.bookedSlots.map(slot => slot.date))];
        
        // Try to find available slot on the same dates first
        let foundSlot: BookedSlot | null = null;
        
        for (const date of bookedDates) {
          const dateAvailability = availability.availabilitySlots.find((s: any) => s.date === date);
          if (!dateAvailability) continue;
          
          // Find time slots not yet booked
          const bookedTimesForDate = item.bookedSlots
            .filter(slot => slot.date === date)
            .map(slot => slot.startTime);
          
          const availableTime = dateAvailability.timeSlots.find(
            (time: string) => !bookedTimesForDate.includes(time)
          );
          
          if (availableTime) {
            foundSlot = {
              date,
              startTime: availableTime,
              endTime: calculateEndTime(availableTime, item.duration || 60)
            };
            break;
          }
        }

        if (foundSlot) {
          // Add the found slot
          setCartItemsState(prevItems =>
            prevItems.map(i => {
              if (i.id === itemId) {
                const updatedSlots = [...i.bookedSlots, foundSlot!];
                return {
                  ...i,
                  bookedSlots: updatedSlots,
                  counter: updatedSlots.length,
                  totalPrice: updatedSlots.length * i.pricePerSlot
                };
              }
              return i;
            })
          );
          console.log('✅ Incremented: Added slot', foundSlot);
        } else {
          Alert.alert(
            'No More Slots Available',
            `No more time slots available on the selected dates (${bookedDates.join(', ')}). Please go back to booking screen to select additional dates.`,
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error fetching availability for increment:', error);
        Alert.alert('Error', 'Failed to fetch available slots. Please try again.');
      } finally {
        // Remove the updating flag
        setUpdatingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }
    }
  };

  // Function to remove item from cart
  const removeItem = (itemId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setCartItemsState(prevItems => prevItems.filter(item => item.id !== itemId));
          }
        }
      ]
    );
  };

  const handleProceedToCheckout = async () => {
    if (!user) {
      Alert.alert('Error', 'Please login to proceed');
      return;
    }

    if (cartItemsState.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before proceeding');
      return;
    }

    // Navigate to payment screen with cart items
    navigation.navigate('Payment', { cartItems: cartItemsState });
  };

  return (
    <SafeAreaView style={styles.cartSafeArea} edges={['top']}>
      <ScreenHeader title="My Cart" onBackPress={() => navigation.goBack()} />
      
      <View style={styles.cartContainer}>
        {/* Scrollable Cart Items */}
        <ScrollView
          style={styles.cartScrollView}
          contentContainerStyle={styles.cartContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.green} />
              <Text style={styles.loadingText}>Loading cart...</Text>
            </View>
          ) : cartItemsState.length === 0 ? (
            <Text style={styles.cartEmptyText}>Your cart is empty</Text>
          ) : (
            <View style={styles.cartItemsContainer}>
              {cartItemsState.map((item) => {
                // Format description to show all booked slots
                const slotsDescription = item.bookedSlots && item.bookedSlots.length > 0
                  ? `${item.serviceTitle}\n${item.bookedSlots.map(slot => 
                      `${slot.date} • ${slot.startTime} - ${slot.endTime}`
                    ).join('\n')}`
                  : `${item.serviceTitle}\n${item.date || 'N/A'} • ${item.startTime || 'N/A'} - ${item.endTime || 'N/A'}`;
                
                const itemPrice = item.pricePerSlot || item.price || 0;
                
                return (
                  <CartCard
                    key={item.id}
                    id={item.id}
                    counter={item.counter}
                    price={itemPrice}
                    image={require('../../../assets/image/services.png')}
                    title={item.consultantName}
                    description={slotsDescription}
                    bookedSlots={item.bookedSlots}
                    onCounterChange={updateItemCounter}
                    onRemove={removeItem}
                    isUpdating={updatingItems.has(item.id)}
                  />
                );
              })}
            </View>
          )}
        </ScrollView>
        
        {/* Sticky Summary Section */}
        {cartItemsState.length > 0 && (
          <View style={styles.stickySummary}>
            <Summary
              subtotal={subtotal}
              onProceedToCheckout={handleProceedToCheckout}
              loading={checkoutLoading}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Cart;
