import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/core/colors';
import { studentProfileStyles } from '../../../constants/styles/studentProfileStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { ResumeService } from '../../../services/resume.service';
import { logger } from '../../../utils/logger';
import {
  Award,
  Plus,
  X,
  Calendar,
  FileText,
} from 'lucide-react-native';

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  documentUrl?: string;
}

const CertificationsScreen = ({ navigation }: any) => {
  const [certificationList, setCertificationList] = useState<Certification[]>([]);
  const [newCertification, setNewCertification] = useState({
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCertifications();
  }, []);

  const loadCertifications = async () => {
    try {
      const response = await ResumeService.getMyResume();
      if (response.resume && response.resume.certifications) {
        setCertificationList(response.resume.certifications);
        if (__DEV__) {
          logger.debug('📥 [CertificationsScreen] Loaded certifications:', response.resume.certifications);
        }
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        logger.debug('No existing certifications found, starting with defaults');
      } else {
        if (__DEV__) {
          logger.error('Error loading certifications:', error);
        }
      }
    }
  };

  const addCertification = () => {
    if (!newCertification.name.trim() || !newCertification.issuer.trim()) {
      Alert.alert('Validation Error', 'Please fill in certification name and issuing organization');
      return;
    }

    const certification: Certification = {
      id: Date.now().toString(),
      ...newCertification,
    };

    setCertificationList(prev => [...prev, certification]);
    setNewCertification({
      name: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
    });
  };

  const removeCertification = (id: string) => {
    setCertificationList(prev => prev.filter(cert => cert.id !== id));
  };

  const handleDocumentUpload = (certificationId: string) => {
    Alert.alert(
      'Upload Document',
      'Choose how you want to upload your certification document:',
      [
        {
          text: 'Camera',
          onPress: () => {
            // TODO: Implement camera upload
            Alert.alert('Camera', 'Camera upload will be implemented');
          },
        },
        {
          text: 'Gallery',
          onPress: () => {
            // TODO: Implement gallery upload
            Alert.alert('Gallery', 'Gallery upload will be implemented');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSave = async () => {
    // More lenient validation - allow partial saves
    const errors: string[] = [];
    
    // Only validate if user has entered some data
    const hasSomeData = certificationList.length > 0;
    
    if (!hasSomeData) {
      errors.push('Please add at least one certification before saving');
    }
    
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n\n'));
      return;
    }

    setLoading(true);
    
    try {
      if (__DEV__) {
        logger.debug('💾 [CertificationsScreen] Saving certifications:', certificationList);
      }
      
      // Use existing updateResume endpoint instead of specific certifications endpoint
      await ResumeService.updateResume({ certifications: certificationList });
      Alert.alert('Success', 'Certifications saved successfully!');
      navigation.goBack();
    } catch (error) {
      logger.error('Error saving certifications:', error);
      Alert.alert('Error', 'Failed to save certifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes? Any unsaved information will be lost.',
      [
        {
          text: 'Keep Editing',
          style: 'cancel',
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={studentProfileStyles.container}>
      <ScreenHeader 
        title="Certifications" 
        onBackPress={() => navigation.goBack()} 
      />
      
      <ScrollView style={studentProfileStyles.scrollView}>
        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Professional Certifications</Text>
          
          <View style={studentProfileStyles.sectionContent}>
            {certificationList.map((certification, index) => (
              <View key={certification.id} style={studentProfileStyles.quickInfo}>
                <Award size={16} color={COLORS.purple} />
                <View style={{ flex: 1 }}>
                  <Text style={studentProfileStyles.quickInfoText}>
                    {certification.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.gray, marginTop: 2 }}>
                    Issued by: {certification.issuer}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.gray, marginTop: 2 }}>
                    Issued: {certification.issueDate}
                  </Text>
                  {certification.expiryDate && (
                    <Text style={{ fontSize: 12, color: COLORS.gray, marginTop: 2 }}>
                      Expires: {certification.expiryDate}
                    </Text>
                  )}
                  {certification.credentialId && (
                    <Text style={{ fontSize: 12, color: COLORS.gray, marginTop: 2 }}>
                      ID: {certification.credentialId}
                    </Text>
                  )}
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => handleDocumentUpload(certification.id)}>
                    <FileText size={16} color={COLORS.blue} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeCertification(certification.id)}>
                    <X size={16} color={COLORS.red} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TextInput
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLORS.lightGray,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16
                }}
                placeholder="Certification Name"
                value={newCertification.name}
                onChangeText={(value) => setNewCertification(prev => ({ ...prev, name: value }))}
              />
              <TextInput
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLORS.lightGray,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16
                }}
                placeholder="Issuing Organization"
                value={newCertification.issuer}
                onChangeText={(value) => setNewCertification(prev => ({ ...prev, issuer: value }))}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TextInput
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLORS.lightGray,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16
                }}
                placeholder="Issue Date (MM/YYYY)"
                value={newCertification.issueDate}
                onChangeText={(value) => setNewCertification(prev => ({ ...prev, issueDate: value }))}
              />
              <TextInput
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLORS.lightGray,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16
                }}
                placeholder="Expiry Date (Optional)"
                value={newCertification.expiryDate}
                onChangeText={(value) => setNewCertification(prev => ({ ...prev, expiryDate: value }))}
              />
            </View>
            
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: COLORS.lightGray,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                marginTop: 10
              }}
              placeholder="Credential ID (Optional)"
              value={newCertification.credentialId}
              onChangeText={(value) => setNewCertification(prev => ({ ...prev, credentialId: value }))}
            />
            
            <TouchableOpacity
              style={{
                padding: 12,
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: COLORS.lightGray,
                marginTop: 10,
                flexDirection: 'row',
                gap: 8
              }}
              onPress={addCertification}
            >
              <Plus size={16} color={COLORS.black} />
              <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: '600' }}>
                Add Certification
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Document Upload Guidelines</Text>
          <View style={studentProfileStyles.sectionContent}>
            <Text style={{ fontSize: 14, color: COLORS.gray, lineHeight: 20 }}>
              • Upload clear, readable copies of your certificates{'\n'}
              • Accepted formats: PDF, JPG, PNG{'\n'}
              • Maximum file size: 5MB{'\n'}
              • Ensure all text is visible and not blurred{'\n'}
              • Include both front and back if applicable
            </Text>
          </View>
        </View>

        <View style={{
          flexDirection: 'row',
          gap: 12,
          margin: 20,
        }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: COLORS.lightGray,
              padding: 16,
              borderRadius: 12,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8
            }}
            onPress={handleCancel}
          >
            <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: '600' }}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: COLORS.purple,
              padding: 16,
              borderRadius: 12,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8
            }}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '600' }}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CertificationsScreen;
