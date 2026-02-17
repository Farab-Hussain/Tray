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
import {  Clock, DollarSign, MessageCircle, Video, Phone, Star, ArrowLeft } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';
// import { BookingService } from '../../../services/booking.service';
import { createChatIfNotExists } from '../../../services/chat.Service';
// import { ConsultantService } from '../../../services/consultant.service';
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
  rating?: number;
  tags?: string[];
  category?: string;
}

export default function ServiceDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  const { serviceId }: { serviceId: string } = route.params as any;
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServiceDetails();
  }, [serviceId]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      // Mock service data - replace with actual API call
      const mockService: Service = {
        id: serviceId,
        title: 'Business Consulting',
        description: 'Get expert advice on business strategy, marketing, and growth. I help entrepreneurs and business owners develop effective strategies to scale their operations and increase revenue.',
        duration: 60,
        price: 150,
        imageUrl: 'https://example.com/service-image.jpg',
        consultantId: 'consultant123',
        consultantName: 'John Smith',
        rating: 4.8,
        tags: ['Strategy', 'Marketing', 'Growth'],
        category: 'Business',
      };
      setService(mockService);
    } catch (error) {
      Alert.alert('Error', 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = () => {
    navigation.navigate('ServiceBooking', { service });
  };

  const handleMessageConsultant = async () => {
    if (!service) return;
    
    try {
      await createChatIfNotExists(user?.uid || '', service.consultantId);
      navigation.navigate('Chat', { consultantId: service.consultantId });
    } catch (error) {
      Alert.alert('Error', 'Failed to open chat');
    }
  };

  const handleVideoCall = () => {
    if (!service) return;
    navigation.navigate('Call', { consultantId: service.consultantId, callType: 'video' as const });
  };

  const handleAudioCall = () => {
    if (!service) return;
    navigation.navigate('Call', { consultantId: service.consultantId, callType: 'audio' as const });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.green} />
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: COLORS.gray }}>Service not found</Text>
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
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: COLORS.black,
          marginLeft: 16,
          flex: 1,
        }}>
          Service Details
        </Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Service Image */}
        {service.imageUrl && (
          <View style={{
            width: '100%',
            height: 200,
            backgroundColor: COLORS.lightGray,
            borderRadius: 12,
            marginBottom: 16,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ color: COLORS.gray }}>Service Image</Text>
          </View>
        )}

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
            fontSize: 24,
            fontWeight: '700',
            color: COLORS.black,
            marginBottom: 8,
          }}>
            {service.title}
          </Text>
          
          {service.category && (
            <Text style={{
              fontSize: 14,
              color: COLORS.blue,
              marginBottom: 12,
            }}>
              {service.category}
            </Text>
          )}
          
          <Text style={{
            fontSize: 16,
            color: COLORS.gray,
            lineHeight: 24,
            marginBottom: 16,
          }}>
            {service.description}
          </Text>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
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
            marginBottom: 12,
          }}>
            <DollarSign size={16} color={COLORS.green} />
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: COLORS.green,
              marginLeft: 8,
            }}>
              ${service.price}
            </Text>
          </View>
          
          {service.rating && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Star size={16} color={COLORS.orange} />
              <Text style={{
                fontSize: 14,
                color: COLORS.gray,
                marginLeft: 8,
              }}>
                {service.rating} rating
              </Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {service.tags && service.tags.length > 0 && (
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
              marginBottom: 12,
            }}>
              Tags
            </Text>
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}>
              {service.tags.map((tag, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: COLORS.lightGray,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    marginRight: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    color: COLORS.black,
                  }}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Consultant Info */}
        {service.consultantName && (
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
              marginBottom: 12,
            }}>
              Consultant
            </Text>
            <Text style={{
              fontSize: 16,
              color: COLORS.black,
              marginBottom: 8,
            }}>
              {service.consultantName}
            </Text>
            {service.rating && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <Star size={16} color={COLORS.orange} />
                <Text style={{
                  fontSize: 14,
                  color: COLORS.gray,
                  marginLeft: 8,
                }}>
                  {service.rating} rating
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
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
            Get in Touch
          </Text>
          
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 16,
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
          
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.green,
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
            }}
            onPress={handleBookService}
          >
            <Text style={{
              color: COLORS.white,
              fontSize: 16,
              fontWeight: '700',
            }}>
              Book Service - ${service.price}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
