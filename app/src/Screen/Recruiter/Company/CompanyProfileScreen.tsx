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
import { ActionSheetIOS, Platform } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { COLORS } from '../../../constants/core/colors';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { Building2, Globe, Users, MapPin, Shield, Check, X, Upload, ChevronsDownUp } from 'lucide-react-native';
import companyService from '../../../services/company.service';

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
  hiringVolumeMonthly?: string;
  hiringRequirements?: string;
  backgroundPolicyType?: string;
  drugTestingPolicy?: string;
  requiredCertifications?: string;
  shiftRequirements?: string;
  transportationRequired?: boolean;
  payRange?: string;
  benefitsOffered?: string;
  retention90DayRate?: string;
  subscriptionTier?: string;
  referralFeeAgreement?: string;
  workforcePartnerLevel?: string;
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
    hiringVolumeMonthly: '',
    hiringRequirements: '',
    backgroundPolicyType: '',
    drugTestingPolicy: '',
    requiredCertifications: '',
    shiftRequirements: '',
    transportationRequired: false,
    payRange: '',
    benefitsOffered: '',
    retention90DayRate: '',
    subscriptionTier: '',
    referralFeeAgreement: '',
    workforcePartnerLevel: '',
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
    'Custom',
  ];

  const shiftTypes = [
    'full-time',
    'part-time',
    'contract',
    'temporary',
    'internship',
  ];

  const subscriptionTiers = ['Free', 'Basic', 'Premium', 'Enterprise'];

  const showPicker = (
    title: string,
    options: string[],
    onSelect: (val: string) => void,
  ) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title,
          options: [...options, 'Cancel'],
          cancelButtonIndex: options.length,
        },
        (buttonIndex) => {
          if (buttonIndex < options.length) {
            onSelect(options[buttonIndex]);
          }
        }
      );
    } else {
      Alert.alert(
        title,
        'Choose an option',
        options.map((o) => ({ text: o, onPress: () => onSelect(o) })).concat({ text: 'Cancel', style: 'cancel' })
      );
    }
  };

  const handleRetentionChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    if (digits === '') {
      setCompany({ ...company, retention90DayRate: '' });
      return;
    }
    const num = Math.min(100, Math.max(0, parseInt(digits, 10)));
    setCompany({ ...company, retention90DayRate: String(num) });
  };

  useEffect(() => {
    loadCompanyProfile();
  }, []);

  const loadCompanyProfile = async () => {
    try {
      setLoading(true);
      const response = await companyService.getMyCompanies();
      if (response.companies?.length) {
        setCompany({ ...company, ...response.companies[0] });
      }
    } catch (error) {
      console.error('Error loading company profile:', error);
      Alert.alert('Issue', 'Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validation
      if (!company.name.trim()) {
        Alert.alert('Issue', 'Company name is required');
        return;
      }

      if (!company.industry) {
        Alert.alert('Issue', 'Industry is required');
        return;
      }

      if (!company.contactInfo.email.trim()) {
        Alert.alert('Issue', 'Contact email is required');
        return;
      }

      if (company.id) {
        const response = await companyService.updateCompany(company.id, company);
        setCompany(response.company);
      } else {
        const response = await companyService.createCompany(company);
        setCompany(response.company);
      }

      Alert.alert('Success', 'Company profile saved successfully');
    } catch (error) {
      console.error('Error saving company profile:', error);
      Alert.alert('Issue', 'Failed to save company profile');
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
              if (!company.id) {
                Alert.alert('Issue', 'Please save the company profile first.');
                return;
              }
              // No docs yet; send empty payload
              await companyService.submitForVerification(company.id, {});
              setCompany({ ...company, verificationStatus: 'pending' });
              Alert.alert('Success', 'Company submitted for verification');
            } catch (error) {
              Alert.alert('Issue', 'Failed to submit for verification');
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
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 8,
                  padding: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onPress={() => showPicker('Select Industry', industries, (val) => {
                  if (val === 'Other') {
                    Alert.prompt(
                      'Add Industry',
                      'Enter your industry',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Save',
                          onPress: (text) => {
                            if (text?.trim()) {
                              setCompany({ ...company, industry: text.trim() });
                            }
                          }
                        }
                      ],
                      'plain-text'
                    );
                  } else {
                    setCompany({ ...company, industry: val });
                  }
                })}
              >
                <Text style={{ color: company.industry ? COLORS.black : COLORS.gray }}>
                  {company.industry || 'Select industry'}
                </Text>
                <ChevronsDownUp size={16} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Company Size</Text>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 8,
                  padding: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onPress={() => showPicker('Select Company Size', companySizes, (val) => {
                  if (val === 'Custom') {
                    Alert.prompt(
                      'Custom Company Size',
                      'Enter your company size (e.g., 1500-2000 or 12)',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Save',
                          onPress: (text) => {
                            if (text?.trim()) {
                              setCompany({ ...company, size: text.trim() });
                            }
                          }
                        }
                      ],
                      'plain-text'
                    );
                  } else {
                    setCompany({ ...company, size: val });
                  }
                })}
              >
                <Text style={{ color: company.size ? COLORS.black : COLORS.gray }}>
                  {company.size || 'Select company size'}
                </Text>
                <ChevronsDownUp size={16} color={COLORS.gray} />
              </TouchableOpacity>
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
                autoCapitalize="none"
                autoCorrect={false}
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
                  contactInfo: { ...company.contactInfo, phone: text.replace(/[^0-9+()\-\s]/g, '') }
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

          {/* Hiring Info */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: COLORS.black }}>
              Hiring Info
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Hiring Volume (Monthly Estimate)</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.black }}
                value={company.hiringVolumeMonthly}
                onChangeText={(text) => setCompany({ ...company, hiringVolumeMonthly: text })}
                placeholder="e.g., 15 roles per month"
                keyboardType="default"
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Hiring Requirements</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.black, height: 80, textAlignVertical: 'top' }}
                value={company.hiringRequirements}
                onChangeText={(text) => setCompany({ ...company, hiringRequirements: text })}
                placeholder="Background checks, assessments, experience requirements, etc."
                multiline
              />
            </View>
          </View>

          {/* Policies & Certifications */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: COLORS.black }}>
              Policies & Certifications
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Background Policy Type</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.black }}
                value={company.backgroundPolicyType}
                onChangeText={(text) => setCompany({ ...company, backgroundPolicyType: text })}
                placeholder="e.g., Level 1 check, case-by-case"
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Drug Testing Policy</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.black }}
                value={company.drugTestingPolicy}
                onChangeText={(text) => setCompany({ ...company, drugTestingPolicy: text })}
                placeholder="Pre-employment, random, none"
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Required Certifications</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.black }}
                value={company.requiredCertifications}
                onChangeText={(text) => setCompany({ ...company, requiredCertifications: text })}
                placeholder="List certifications or licenses"
              />
            </View>
          </View>

          {/* Shift & Transportation */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: COLORS.black }}>
              Shift & Transportation
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Shift Requirements</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.black }}
                value={company.shiftRequirements}
                onChangeText={(text) => setCompany({ ...company, shiftRequirements: text })}
                placeholder="e.g., weekend availability, rotating shifts"
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: COLORS.black }}>Transportation Required</Text>
              <Switch
                value={company.transportationRequired}
                onValueChange={(value) => setCompany({ ...company, transportationRequired: value })}
                trackColor={{ false: COLORS.border, true: COLORS.green }}
                thumbColor={COLORS.white}
              />
            </View>
          </View>

          {/* Compensation */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: COLORS.black }}>
              Compensation
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Pay Range</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.black }}
                value={company.payRange}
                onChangeText={(text) => setCompany({ ...company, payRange: text })}
                placeholder="e.g., $60k - $90k or $30/hr"
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Benefits Offered</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.black, height: 80, textAlignVertical: 'top' }}
                value={company.benefitsOffered}
                onChangeText={(text) => setCompany({ ...company, benefitsOffered: text })}
                placeholder="Health, PTO, 401k, bonuses, etc."
                multiline
              />
            </View>
          </View>

          {/* Retention & Partnership */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: COLORS.black }}>
              Retention & Partnership
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>90-Day Retention Rate (%)</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.black }}
                value={company.retention90DayRate}
                onChangeText={handleRetentionChange}
                placeholder="e.g., 85"
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Job Posting Subscription Tier</Text>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 8,
                  padding: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onPress={() =>
                  showPicker('Select Subscription Tier', subscriptionTiers, (val) =>
                    setCompany({ ...company, subscriptionTier: val })
                  )
                }
              >
                <Text style={{ color: company.subscriptionTier ? COLORS.black : COLORS.gray }}>
                  {company.subscriptionTier || 'Select subscription tier'}
                </Text>
                <ChevronsDownUp size={16} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Referral Fee Agreement</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.black }}
                value={company.referralFeeAgreement}
                onChangeText={(text) =>
                  setCompany({ ...company, referralFeeAgreement: text.slice(0, 120) })
                }
                placeholder="e.g., 10% of first-year salary"
                maxLength={120}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Workforce Partner Level</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 16, color: COLORS.black }}
                value={company.workforcePartnerLevel}
                onChangeText={(text) =>
                  setCompany({ ...company, workforcePartnerLevel: text.slice(0, 60) })
                }
                placeholder="Gold, Silver, etc."
                maxLength={60}
              />
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