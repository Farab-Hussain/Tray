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
  serviceImageUrl?: string;
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

  // Load cart from AsyncStorage and add new item if coming from BookingSlots
  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
        let existingItems: CartItem[] = storedCart ? JSON.parse(storedCart) : [];

        // Fetch service images for items that don't have them
        const itemsNeedingImages = existingItems.filter(item => !item.serviceImageUrl);
        if (itemsNeedingImages.length > 0) {
          console.log('🖼️ Fetching service images for', itemsNeedingImages.length, 'cart items');
          for (const item of itemsNeedingImages) {
            try {
              const services = await ConsultantService.getConsultantServices(item.consultantId);
              const service = services.services?.find((s: any) => s.id === item.serviceId);
              if (service && service.imageUrl) {
                item.serviceImageUrl = service.imageUrl;
                console.log('✅ Found service image for:', item.serviceTitle, service.imageUrl);
              }
            } catch (error) {
              console.error('❌ Error fetching service image for', item.serviceTitle, error);
            }
          }
          // Save updated items back to AsyncStorage
          if (itemsNeedingImages.some(item => item.serviceImageUrl)) {
            await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(existingItems));
          }
        }

        // If coming from BookingSlots with new booking data
        const newBooking = route?.params;
        if (newBooking && newBooking.consultantId && newBooking.serviceId) {
          console.log('📦 Adding new item to cart:', newBooking);
          console.log('🖼️ Service image URL:', (newBooking as any).serviceImageUrl);

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
              
              // Update service image if not already set
              if (!existingItems[existingItemIndex].serviceImageUrl && (newBooking as any).serviceImageUrl) {
                existingItems[existingItemIndex].serviceImageUrl = (newBooking as any).serviceImageUrl;
              }
              
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
              serviceImageUrl: (newBooking as any).serviceImageUrl, // Include service image URL
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
                const itemPrice = item.totalPrice || (item.pricePerSlot || item.price || 0) * item.counter;
                
                // Create proper imageUri with fallback
                let imageUri;
                if (item.serviceImageUrl && item.serviceImageUrl.trim() !== '') {
                  // Use the actual service image from database
                  imageUri = { uri: item.serviceImageUrl };
                  console.log('🖼️ Using real service image for', item.serviceTitle, ':', item.serviceImageUrl);
                } else {
                  // Use default placeholder if no image URL
                  imageUri = require('../../../assets/image/services.png');
                  console.log('⚠️ No service image URL for', item.serviceTitle, '- using placeholder');
                }
                
                return (
                  <CartCard
                    key={item.id}
                    id={item.id}
                    price={itemPrice}
                    image={imageUri}
                    consultantName={item.consultantName}
                    serviceName={item.serviceTitle}
                    onRemove={removeItem}
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
