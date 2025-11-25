import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { FormInput, TextArea, PriceInput } from './FormComponents';
import {
  consultantFlowStyles,
  serviceApplicationStyles,
} from '../../constants/styles/consultantFlowStyles';
import { createConsultantApplication } from '../../services/consultantFlow.service';
import ImageUpload from '../ui/ImageUpload';

const styles = {
  emptyServiceText: {
    textAlign: 'center' as const,
    color: '#666',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
};

interface ServiceApplicationFormProps {
  onSuccess?: () => void;
}

export const ServiceApplicationForm: React.FC<ServiceApplicationFormProps> = ({
  onSuccess,
}) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State variables
  const [applicationType, setApplicationType] = useState<'existing' | 'new'>(
    'existing',
  );
  const [_selectedServiceId, _setSelectedServiceId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customDuration, setCustomDuration] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  // VIDEO UPLOAD CODE - COMMENTED OUT
  // const [customVideoUrl, setCustomVideoUrl] = useState<string>('');
  const [customImagePublicId, setCustomImagePublicId] = useState<string>('');
  // const [customVideoPublicId, setCustomVideoPublicId] = useState<string>('');

  const handleSubmit = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    // Validation
    if (applicationType === 'existing' && !_selectedServiceId) {
      Alert.alert('Error', 'Please select a service');
      return;
    }

    if (applicationType === 'new') {
      if (!customTitle.trim()) {
        Alert.alert('Error', 'Please enter a service title');
        return;
      }
      if (!customDescription.trim()) {
        Alert.alert('Error', 'Please enter a service description');
        return;
      }
      if (parseInt(customDuration, 10) <= 0) {
        Alert.alert('Error', 'Please enter a valid duration');
        return;
      }
      if (parseFloat(customPrice) <= 0) {
        Alert.alert('Error', 'Please enter a valid price');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const applicationData = {
        consultantId: user.uid,
        type: applicationType,
        ...(applicationType === 'existing'
          ? { serviceId: _selectedServiceId }
          : {
              customService: {
                title: customTitle.trim(),
                description: customDescription.trim(),
                duration: parseInt(customDuration, 10),
                price: parseFloat(customPrice),
                imageUrl: customImageUrl || undefined,
                // VIDEO UPLOAD CODE - COMMENTED OUT
                // videoUrl: customVideoUrl || undefined,
                imagePublicId: customImagePublicId || undefined,
                // videoPublicId: customVideoPublicId || undefined,
              },
            }),
      };

      await createConsultantApplication(applicationData);

      Alert.alert(
        'Success',
        "Service application submitted successfully! You will be notified once it's reviewed.",
        [
          {
            text: 'OK',
            onPress: () => {
              // Call onSuccess callback first (if provided)
              onSuccess?.();
              // Navigate back - the PendingApproval screen will refresh on focus
              navigation.goBack();
            },
          },
        ],
      );
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error submitting application:', error);
      }
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to submit application',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderServiceTypeSelection = () => (
    <View style={consultantFlowStyles.section}>
      <Text style={consultantFlowStyles.sectionTitle}>Application Type</Text>

      <View style={serviceApplicationStyles.serviceTypeContainer}>
        <TouchableOpacity
          style={[
            serviceApplicationStyles.serviceTypeCard,
            applicationType === 'existing' &&
              serviceApplicationStyles.serviceTypeCardSelected,
          ]}
          onPress={() => setApplicationType('existing')}
        >
          <Text style={serviceApplicationStyles.serviceTypeTitle}>
            Existing Service
          </Text>
          <Text style={serviceApplicationStyles.serviceTypeDescription}>
            Apply for a predefined service category
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            serviceApplicationStyles.serviceTypeCard,
            applicationType === 'new' &&
              serviceApplicationStyles.serviceTypeCardSelected,
          ]}
          onPress={() => setApplicationType('new')}
        >
          <Text style={serviceApplicationStyles.serviceTypeTitle}>
            Custom Service
          </Text>
          <Text style={serviceApplicationStyles.serviceTypeDescription}>
            Create your own service offering
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderExistingServiceSelection = () => (
    <View style={consultantFlowStyles.section}>
      <Text style={consultantFlowStyles.sectionTitle}>Select Service</Text>

      <View style={serviceApplicationStyles.serviceList}>
        <Text style={styles.emptyServiceText}>
          No predefined services available. Please create a custom service.
        </Text>
      </View>
    </View>
  );

  const renderCustomServiceForm = () => (
    <View style={consultantFlowStyles.section}>
      <Text style={consultantFlowStyles.sectionTitle}>
        Custom Service Details
      </Text>

      <FormInput
        label="Service Title"
        value={customTitle}
        onChangeText={setCustomTitle}
        placeholder="e.g., Resume Writing Service"
        required
      />

      <TextArea
        label="Service Description"
        value={customDescription}
        onChangeText={setCustomDescription}
        placeholder="Describe what this service includes..."
        required
        minLength={20}
      />

      <View style={serviceApplicationStyles.durationContainer}>
        <View style={serviceApplicationStyles.durationInput}>
          <FormInput
            label="Duration (minutes)"
            value={customDuration}
            onChangeText={setCustomDuration}
            placeholder="60"
            keyboardType="numeric"
            required
          />
        </View>
        <View style={serviceApplicationStyles.durationUnit}>
          <Text style={serviceApplicationStyles.durationUnitText}>minutes</Text>
        </View>
      </View>

      <PriceInput
        label="Price (USD)"
        value={customPrice}
        onChangeText={setCustomPrice}
        required
      />

      <View style={{ marginTop: 16 }}>
        <Text style={consultantFlowStyles.sectionTitle}>Service Media</Text>
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
          Upload an image to showcase your service
        </Text>

        <ImageUpload
          currentImageUrl={customImageUrl}
          // VIDEO UPLOAD CODE - COMMENTED OUT: currentVideoUrl={customVideoUrl}
          currentPublicId={customImagePublicId}
          // VIDEO UPLOAD CODE - COMMENTED OUT: currentVideoPublicId={customVideoPublicId}
          onImageUploaded={(imageUrl, publicId) => {
            setCustomImageUrl(imageUrl);
            setCustomImagePublicId(publicId);
            // VIDEO UPLOAD CODE - COMMENTED OUT
            // // Clear video when image is uploaded (user can only have one media type)
            // setCustomVideoUrl('');
            // setCustomVideoPublicId('');
            setCustomImageUrl('');
            setCustomImagePublicId('');
          }}
          uploadType="service"
          placeholder="Tap to upload image"
          style={{ marginBottom: 16 }}
        />
      </View>
    </View>
  );

  return (
    <View style={consultantFlowStyles.container}>
      {/* Header */}
      <View style={consultantFlowStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={consultantFlowStyles.headerTitle}>
          Service Application
        </Text>
        <View style={consultantFlowStyles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderServiceTypeSelection()}

        {applicationType === 'existing' && renderExistingServiceSelection()}
        {applicationType === 'new' && renderCustomServiceForm()}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            consultantFlowStyles.submitButton,
            isSubmitting && consultantFlowStyles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={consultantFlowStyles.submitButtonText}>
              Submit Application
            </Text>
          )}
        </TouchableOpacity>

        <View style={consultantFlowStyles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};
