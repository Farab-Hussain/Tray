import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, X } from 'lucide-react-native';
import { COLORS } from '../../constants/core/colors';
import ScreenHeader from '../shared/ScreenHeader';

interface ServiceFormData {
  title: string;
  description: string;
  accessType: 'one-time' | 'weekly' | 'monthly' | 'yearly' | 'lifetime';
  curriculum: string[];
  enableCertificate: boolean;
  price: string;
}

interface CreateServiceFormProps {
  onClose: () => void;
  onSubmit: (data: ServiceFormData) => void;
}

const CreateServiceForm: React.FC<CreateServiceFormProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<ServiceFormData>({
    title: '',
    description: '',
    accessType: 'one-time',
    curriculum: [],
    enableCertificate: false,
    price: '150',
  });

  const [selectedAccess, setSelectedAccess] = useState<'one-time' | 'weekly' | 'monthly' | 'yearly' | 'lifetime'>('one-time');

  const accessTypes = [
    { 
      id: 'one-time', 
      label: 'Single session', 
      subLabel: 'One-time consultation',
      selected: selectedAccess === 'one-time' 
    },
    { 
      id: 'weekly', 
      label: 'Weekly', 
      subLabel: 'Access for 1 week',
      selected: selectedAccess === 'weekly' 
    },
    { 
      id: 'monthly', 
      label: 'Monthly', 
      subLabel: 'Access for 1 month',
      selected: selectedAccess === 'monthly' 
    },
    { 
      id: 'yearly', 
      label: 'Yearly', 
      subLabel: 'Access for 1 year',
      selected: selectedAccess === 'yearly' 
    },
    { 
      id: 'lifetime', 
      label: 'Lifetime', 
      subLabel: 'Forever access',
      selected: selectedAccess === 'lifetime' 
    },
  ];

  const handleAccessSelect = (type: typeof selectedAccess) => {
    setSelectedAccess(type);
  };

  const handleAddModule = () => {
    Alert.alert('Add Module', 'Module functionality coming soon!');
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      Alert.alert('Issue', 'Please enter a service title');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Issue', 'Please enter a service description');
      return;
    }

    onSubmit(formData);
  };

  const formatPrice = (value: string) => {
    // Remove any non-digit characters except decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1, 2).join('');
    }
    return cleaned;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
      }}>
        <TouchableOpacity onPress={onClose}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: COLORS.black,
        }}>
          Create New Service
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Description Section */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: COLORS.black,
            marginBottom: 8,
          }}>
            Description (min 20 chars) *
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: COLORS.gray,
              borderRadius: 8,
              padding: 16,
              fontSize: 16,
              color: COLORS.black,
              backgroundColor: COLORS.white,
              minHeight: 120,
              textAlignVertical: 'top',
            }}
            multiline
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Describe your service in detail..."
            maxLength={500}
          />
        </View>

        {/* Access Type Section */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: COLORS.black,
            marginBottom: 12,
          }}>
            Access Type *
          </Text>
          <Text style={{
            fontSize: 14,
            color: COLORS.gray,
            marginBottom: 16,
          }}>
            Choose how clients can access your service
          </Text>
          
          <View style={{ gap: 12 }}>
            {accessTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={{
                  borderWidth: 2,
                  borderColor: type.selected ? COLORS.green : COLORS.gray,
                  borderRadius: 12,
                  padding: 16,
                  backgroundColor: type.selected ? COLORS.green : COLORS.white,
                }}
                onPress={() => handleAccessSelect(type.id as typeof selectedAccess)}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: type.selected ? COLORS.white : COLORS.black,
                  marginBottom: 4,
                }}>
                  {type.label}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: type.selected ? COLORS.white : COLORS.gray,
                }}>
                  {type.subLabel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Service Curriculum Section */}
        <View style={{ marginBottom: 24 }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: COLORS.black,
            }}>
              Service Curriculum
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: COLORS.green,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
              onPress={handleAddModule}
            >
              <Plus size={16} color={COLORS.white} />
              <Text style={{
                color: COLORS.white,
                fontSize: 14,
                fontWeight: '500',
                marginLeft: 6,
              }}>
                Add Module
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={{
            fontSize: 14,
            color: COLORS.gray,
            marginBottom: 12,
          }}>
            Create a structured outline for your service (optional)
          </Text>
        </View>

        {/* Certificate Options Section */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: COLORS.black,
            marginBottom: 12,
          }}>
            Certificate Options
          </Text>
          <Text style={{
            fontSize: 14,
            color: COLORS.gray,
            marginBottom: 16,
          }}>
            Offer certificates to students who complete your service
          </Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: COLORS.lightGray,
            padding: 16,
            borderRadius: 8,
          }}>
            <Switch
              value={formData.enableCertificate}
              onValueChange={(value) => setFormData(prev => ({ ...prev, enableCertificate: value }))}
              trackColor={{ false: COLORS.gray, true: COLORS.green }}
              thumbColor={COLORS.white}
            />
            <Text style={{
              fontSize: 16,
              fontWeight: '500',
              color: COLORS.black,
              marginLeft: 12,
            }}>
              Enable certificate of completion
            </Text>
          </View>
        </View>

        {/* Pricing Section */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: COLORS.black,
            marginBottom: 12,
          }}>
            Pricing *
          </Text>
          <Text style={{
            fontSize: 14,
            color: COLORS.gray,
            marginBottom: 16,
          }}>
            Set price for single session
          </Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: COLORS.gray,
            borderRadius: 8,
            paddingHorizontal: 16,
            backgroundColor: COLORS.white,
          }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '600',
              color: COLORS.black,
              marginRight: 8,
            }}>
              $
            </Text>
            <TextInput
              style={{
                flex: 1,
                fontSize: 20,
                fontWeight: '600',
                color: COLORS.black,
                paddingVertical: 16,
              }}
              value={formData.price}
              onChangeText={(text) => setFormData(prev => ({ ...prev, price: formatPrice(text) }))}
              placeholder="150"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.green,
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginHorizontal: 20,
            marginBottom: 40,
          }}
          onPress={handleSubmit}
        >
          <Text style={{
            color: COLORS.white,
            fontSize: 16,
            fontWeight: '600',
          }}>
            Create Service
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateServiceForm;