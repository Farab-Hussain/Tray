import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORS } from '../../../constants/core/colors';
import { studentProfileStyles } from '../../../constants/styles/studentProfileStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import {
  Shield,
  FileText,
  CheckCircle,
  AlertTriangle,
  Upload,
} from 'lucide-react-native';

const AuthorizationDocuments = ({ navigation }: any) => {
  const [uploadedDocuments, setUploadedDocuments] = useState({
    workPermit: null,
    visa: null,
    passport: null
  });

  const handleDocumentUpload = (documentType: string) => {
    Alert.alert(
      'Document Upload',
      `Upload ${documentType} functionality will be implemented soon.\n\nThis will allow you to upload your ${documentType} for verification.`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleSave = () => {
    // Validation checks
    const errors: string[] = [];
    
    if (!uploadedDocuments.workPermit && !uploadedDocuments.visa && !uploadedDocuments.passport) {
      errors.push('Please upload at least one authorization document');
    }
    
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n\n'));
      return;
    }

    Alert.alert('Success', 'Authorization documents saved successfully!');
    navigation.goBack();
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
        title="Work Authorization" 
        onBackPress={() => navigation.goBack()} 
      />
      
      <ScrollView style={studentProfileStyles.scrollView}>
        <View style={studentProfileStyles.section}>
          <View style={studentProfileStyles.sectionHeader}>
            <Text style={studentProfileStyles.sectionTitle}>Work Authorization Status</Text>
            <Shield size={20} color={COLORS.blue} />
          </View>
          
          <View style={studentProfileStyles.sectionContent}>
            <View style={studentProfileStyles.quickInfo}>
              <CheckCircle size={16} color={COLORS.green} />
              <Text style={studentProfileStyles.quickInfoText}>Work authorized: Yes</Text>
            </View>
            
            <View style={studentProfileStyles.quickInfo}>
              <FileText size={16} color={COLORS.orange} />
              <Text style={studentProfileStyles.quickInfoText}>Background check: Required</Text>
            </View>
          </View>
        </View>

        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Authorization Documents</Text>
          
          <View style={studentProfileStyles.sectionContent}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderWidth: 1,
                borderColor: COLORS.lightGray,
                borderRadius: 8,
                marginBottom: 12
              }}
              onPress={() => handleDocumentUpload('Work Permit')}
            >
              <Upload size={20} color={COLORS.green} />
              <Text style={{ marginLeft: 12, fontSize: 16 }}>Upload Work Permit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderWidth: 1,
                borderColor: COLORS.lightGray,
                borderRadius: 8,
                marginBottom: 12
              }}
              onPress={() => handleDocumentUpload('Visa')}
            >
              <Upload size={20} color={COLORS.green} />
              <Text style={{ marginLeft: 12, fontSize: 16 }}>Upload Visa</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderWidth: 1,
                borderColor: COLORS.lightGray,
                borderRadius: 8
              }}
              onPress={() => handleDocumentUpload('Passport')}
            >
              <Upload size={20} color={COLORS.green} />
              <Text style={{ marginLeft: 12, fontSize: 16 }}>Upload Passport</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Background Check</Text>
          
          <View style={studentProfileStyles.sectionContent}>
            <View style={studentProfileStyles.quickInfo}>
              <AlertTriangle size={16} color={COLORS.yellow} />
              <Text style={studentProfileStyles.quickInfoText}>Background check pending</Text>
            </View>
            
            <Text style={{ fontSize: 14, color: COLORS.gray, marginTop: 8 }}>
              Your background check is currently being processed. This typically takes 3-5 business days.
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
              backgroundColor: COLORS.blue,
              padding: 16,
              borderRadius: 12,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8
            }}
            onPress={handleSave}
          >
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '600' }}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AuthorizationDocuments;
