import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { COLORS } from '../../../constants/core/colors';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { Building2, Globe, Users, MapPin, Shield, Check, X, Upload } from 'lucide-react-native';

interface CompanyProfile {
  id?: string;
  name: string;
  description: string;
  industry: string;
  website: string;
  size: string;
  foundedYear?: string;
  locations: CompanyLocation[];
  headquarters: CompanyLocation;
  contactInfo: CompanyContactInfo;
  socialLinks: CompanySocialLinks;
  fairChanceHiring: FairChanceHiringSettings;
}

interface CompanyLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isHeadquarters: boolean;
  shiftTypes: string[];
  locationType: string;
}

interface CompanyContactInfo {
  email: string;
  phone?: string;
  hrEmail?: string;
  careersEmail?: string;
  linkedinUrl?: string;
}

interface CompanySocialLinks {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  website?: string;
}

interface FairChanceHiringSettings {
  enabled: boolean;
  banTheBoxCompliant: boolean;
  felonyFriendly: boolean;
  caseByCaseReview: boolean;
  noBackgroundCheck: boolean;
  secondChancePolicy: string;
  backgroundCheckPolicy: string;
  rehabilitationSupport: boolean;
  reentryProgramPartnership: boolean;
}

const CompanyProfileScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<CompanyProfile>({
    name: '',
    description: '',
    industry: '',
    website: '',
    size: '',
    foundedYear: '',
    locations: [],
    headquarters: {
      id: 'headquarters',
      name: 'Headquarters',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      isHeadquarters: true,
      shiftTypes: [],
      locationType: 'office',
    },
    contactInfo: {
      email: '',
      phone: '',
      hrEmail: '',
      careersEmail: '',
      linkedinUrl: '',
    },
    socialLinks: {
      linkedin: '',
      twitter: '',
      facebook: '',
      instagram: '',
      website: '',
    },
    fairChanceHiring: {
      enabled: false,
      banTheBoxCompliant: false,
      felonyFriendly: false,
      caseByCaseReview: false,
      noBackgroundCheck: false,
      secondChancePolicy: '',
      backgroundCheckPolicy: '',
      rehabilitationSupport: false,
      reentryProgramPartnership: false,
    },
  });

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Manufacturing',
    'Retail',
    'Hospitality',
    'Construction',
    'Transportation',
    'Energy',
    'Agriculture',
    'Government',
    'Non-profit',
    'Real Estate',
    'Media & Entertainment',
    'Telecommunications',
    'Consulting',
    'Legal',
    'Insurance',
    'Other',
  ];

  const companySizes = [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '501-1000',
    '1000+',
  ];

  const shiftTypes = [
    'full-time',
    'part-time',
    'contract',
    'temporary',
    'internship',
  ];

  useEffect(() => {
    loadCompanyProfile();
  }, []);

  const loadCompanyProfile = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to get company profile
      // const response = await companyService.getMyCompanies();
      // if (response.companies.length > 0) {
      //   setCompany(response.companies[0]);
      // }
    } catch (error) {
      console.error('Error loading company profile:', error);
      Alert.alert('Error', 'Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validation
      if (!company.name.trim()) {
        Alert.alert('Error', 'Company name is required');
        return;
      }

      if (!company.industry) {
        Alert.alert('Error', 'Industry is required');
        return;
      }

      if (!company.contactInfo.email.trim()) {
        Alert.alert('Error', 'Contact email is required');
        return;
      }

      // TODO: Implement API call to save company profile
      // if (company.id) {
      //   await companyService.updateCompany(company.id, company);
      // } else {
      //   const response = await companyService.createCompany(company);
      //   setCompany(response.company);
      // }

      Alert.alert('Success', 'Company profile saved successfully');
    } catch (error) {
      console.error('Error saving company profile:', error);
      Alert.alert('Error', 'Failed to save company profile');
    } finally {
      setSaving(false);
    }
  };

  const handleVerificationSubmit = async () => {
    Alert.alert(
      'Submit for Verification',
      'Are you ready to submit your company for verification? You will need to provide business registration documents.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              // TODO: Implement verification submission
              // await companyService.submitForVerification(company.id, verificationData);
              Alert.alert('Success', 'Company submitted for verification');
            } catch (error) {
              Alert.alert('Error', 'Failed to submit for verification');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
        <ScreenHeader title="Company Profile" onBackPress={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={{ marginTop: 10, color: COLORS.gray }}>Loading company profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader title="Company Profile" onBackPress={() => navigation.goBack()} />
      
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16 }}>
          {/* Basic Information */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: COLORS.black }}>
              Basic Information
            </Text>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Company Name *</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: COLORS.black,
                }}
                value={company.name}
                onChangeText={(text) => setCompany({ ...company, name: text })}
                placeholder="Enter company name"
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Description</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: COLORS.black,
                  height: 80,
                  textAlignVertical: 'top',
                }}
                value={company.description}
                onChangeText={(text) => setCompany({ ...company, description: text })}
                placeholder="Describe your company"
                multiline
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Industry *</Text>
              <View style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 8,
                padding: 12,
              }}>
                <Text style={{ color: company.industry ? COLORS.black : COLORS.gray }}>
                  {company.industry || 'Select industry'}
                </Text>
              </View>
              {/* TODO: Add industry picker */}
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Company Size</Text>
              <View style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 8,
                padding: 12,
              }}>
                <Text style={{ color: company.size ? COLORS.black : COLORS.gray }}>
                  {company.size || 'Select company size'}
                </Text>
              </View>
              {/* TODO: Add size picker */}
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Website</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: COLORS.black,
                }}
                value={company.website}
                onChangeText={(text) => setCompany({ ...company, website: text })}
                placeholder="https://www.company.com"
                keyboardType="url"
              />
            </View>
          </View>

          {/* Contact Information */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: COLORS.black }}>
              Contact Information
            </Text>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Email *</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: COLORS.black,
                }}
                value={company.contactInfo.email}
                onChangeText={(text) => setCompany({
                  ...company,
                  contactInfo: { ...company.contactInfo, email: text }
                })}
                placeholder="contact@company.com"
                keyboardType="email-address"
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Phone</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: COLORS.black,
                }}
                value={company.contactInfo.phone}
                onChangeText={(text) => setCompany({
                  ...company,
                  contactInfo: { ...company.contactInfo, phone: text }
                })}
                placeholder="+1 (555) 123-4567"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Fair Chance Hiring */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Shield size={20} color={COLORS.green} />
              <Text style={{ fontSize: 18, fontWeight: '600', marginLeft: 8, color: COLORS.black }}>
                Fair Chance Hiring
              </Text>
            </View>

            <View style={{ marginBottom: 16 }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <Text style={{ fontSize: 16, color: COLORS.black }}>Enable Fair Chance Hiring</Text>
                <Switch
                  value={company.fairChanceHiring.enabled}
                  onValueChange={(value) => setCompany({
                    ...company,
                    fairChanceHiring: { ...company.fairChanceHiring, enabled: value }
                  })}
                  trackColor={{ false: COLORS.border, true: COLORS.green }}
                  thumbColor={COLORS.white}
                />
              </View>

              {company.fairChanceHiring.enabled && (
                <>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}>
                    <Text style={{ fontSize: 14, color: COLORS.black }}>Ban-the-Box Compliant</Text>
                    <Switch
                      value={company.fairChanceHiring.banTheBoxCompliant}
                      onValueChange={(value) => setCompany({
                        ...company,
                        fairChanceHiring: { ...company.fairChanceHiring, banTheBoxCompliant: value }
                      })}
                      trackColor={{ false: COLORS.border, true: COLORS.green }}
                      thumbColor={COLORS.white}
                    />
                  </View>

                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}>
                    <Text style={{ fontSize: 14, color: COLORS.black }}>Case-by-Case Review</Text>
                    <Switch
                      value={company.fairChanceHiring.caseByCaseReview}
                      onValueChange={(value) => setCompany({
                        ...company,
                        fairChanceHiring: { ...company.fairChanceHiring, caseByCaseReview: value }
                      })}
                      trackColor={{ false: COLORS.border, true: COLORS.green }}
                      thumbColor={COLORS.white}
                    />
                  </View>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>
                      Second Chance Policy
                    </Text>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 14,
                        color: COLORS.black,
                        height: 60,
                        textAlignVertical: 'top',
                      }}
                      value={company.fairChanceHiring.secondChancePolicy}
                      onChangeText={(text) => setCompany({
                        ...company,
                        fairChanceHiring: { ...company.fairChanceHiring, secondChancePolicy: text }
                      })}
                      placeholder="Describe your second chance policy..."
                      multiline
                    />
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ marginBottom: 32 }}>
            <TouchableOpacity
              style={{
                backgroundColor: COLORS.green,
                borderRadius: 8,
                padding: 16,
                alignItems: 'center',
                marginBottom: 12,
              }}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '600' }}>
                  Save Profile
                </Text>
              )}
            </TouchableOpacity>

            {company.id && (
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.blue,
                  borderRadius: 8,
                  padding: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
              onPress={handleVerificationSubmit}
              >
                <Upload size={20} color={COLORS.white} />
                <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
                  Submit for Verification
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CompanyProfileScreen;
