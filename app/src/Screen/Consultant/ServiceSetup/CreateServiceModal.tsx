import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';
import CreateServiceForm from '../../../components/ui/CreateServiceForm';
import ScreenHeader from '../../../components/shared/ScreenHeader';

interface CreateServiceModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

interface ServiceFormData {
  title: string;
  description: string;
  accessType: 'one-time' | 'weekly' | 'monthly' | 'yearly' | 'lifetime';
  curriculum: string[];
  enableCertificate: boolean;
  price: string;
}

const CreateServiceModal: React.FC<CreateServiceModalProps> = ({ visible, onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (data: ServiceFormData) => {
    setIsSubmitting(true);
    onSubmit(data);
    // Note: In a real implementation, you would handle the actual service creation here
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
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
          <View style={{ width: 32 }} />
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: COLORS.black,
          }}>
            Create New Service
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>

        {/* Form Content */}
        <CreateServiceForm 
          onClose={onClose}
          onSubmit={handleSubmit}
        />

        {/* Loading Overlay */}
        {isSubmitting && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <View style={{
              backgroundColor: COLORS.white,
              padding: 24,
              borderRadius: 12,
              alignItems: 'center',
            }}>
              <ActivityIndicator size="large" color={COLORS.green} />
              <Text style={{
                fontSize: 16,
                fontWeight: '500',
                color: COLORS.black,
                marginTop: 12,
              }}>
                Creating Service...
              </Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default CreateServiceModal;
