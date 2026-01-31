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
import { 
  Briefcase, 
  DollarSign, 
  MapPin, 
  Clock, 
  Users, 
  Check,
  X,
  CreditCard,
  AlertCircle
} from 'lucide-react-native';
import CompanyService from '../../../services/company.service';

interface JobPost {
  title: string;
  company: string;
  description: string;
  location: string;
  jobType: string;
  shiftType: string;
  requiredSkills: string[];
  preferredSkills: string[];
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  experienceLevel: string;
  educationLevel: string;
  workAuthorization: string[];
  backgroundCheckRequired: boolean;
  fairChanceHiring: {
    banTheBoxCompliant: boolean;
    felonyFriendly: boolean;
    caseByCaseReview: boolean;
    noBackgroundCheck: boolean;
  };
  isActive: boolean;
  companyId?: string;
}

const PostJobScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentUrl, setPaymentUrl] = useState('');

  const [jobPost, setJobPost] = useState<JobPost>({
    title: '',
    company: '',
    description: '',
    location: '',
    jobType: 'full-time',
    shiftType: 'day',
    requiredSkills: [],
    preferredSkills: [],
    salaryRange: {
      min: 0,
      max: 0,
      currency: 'USD',
    },
    experienceLevel: 'entry',
    educationLevel: 'high-school',
    workAuthorization: ['us-citizen'],
    backgroundCheckRequired: true,
    fairChanceHiring: {
      banTheBoxCompliant: false,
      felonyFriendly: false,
      caseByCaseReview: false,
      noBackgroundCheck: false,
    },
    isActive: true,
  });

  const [newSkill, setNewSkill] = useState('');
  const [newPreferredSkill, setNewPreferredSkill] = useState('');

  const jobTypes = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'internship', label: 'Internship' },
  ];

  const shiftTypes = [
    { value: 'day', label: 'Day Shift' },
    { value: 'evening', label: 'Evening Shift' },
    { value: 'night', label: 'Night Shift' },
    { value: 'flexible', label: 'Flexible' },
    { value: 'rotating', label: 'Rotating' },
  ];

  const experienceLevels = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior Level' },
    { value: 'executive', label: 'Executive' },
  ];

  const educationLevels = [
    { value: 'high-school', label: 'High School' },
    { value: 'associate', label: 'Associate Degree' },
    { value: 'bachelor', label: 'Bachelor\'s Degree' },
    { value: 'master', label: 'Master\'s Degree' },
    { value: 'phd', label: 'PhD' },
  ];

  const workAuthorizationOptions = [
    { value: 'us-citizen', label: 'US Citizen' },
    { value: 'green-card', label: 'Green Card Holder' },
    { value: 'work-visa', label: 'Work Visa Required' },
    { value: 'student-visa', label: 'Student Visa' },
    { value: 'open', label: 'Open to All' },
  ];

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await CompanyService.getMyCompanies();
      setCompanies(response.companies);
      
      if (response.companies.length > 0) {
        setSelectedCompany(response.companies[0]);
        setJobPost(prev => ({
          ...prev,
          company: response.companies[0].name,
          companyId: response.companies[0].id,
        }));
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validation
      if (!jobPost.title.trim()) {
        Alert.alert('Error', 'Job title is required');
        return;
      }

      if (!jobPost.description.trim()) {
        Alert.alert('Error', 'Job description is required');
        return;
      }

      if (!jobPost.location.trim()) {
        Alert.alert('Error', 'Location is required');
        return;
      }

      if (jobPost.requiredSkills.length === 0) {
        Alert.alert('Error', 'At least one required skill is required');
        return;
      }

      if (jobPost.salaryRange.min >= jobPost.salaryRange.max) {
        Alert.alert('Error', 'Maximum salary must be greater than minimum salary');
        return;
      }

      // TODO: Implement API call to post job
      // const response = await jobService.createJob(jobPost);
      
      // Check if payment is required
      if (paymentRequired) {
        Alert.alert(
          'Payment Required',
          `A payment of $${paymentAmount} is required to post this job. Proceed to payment?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Pay Now',
              onPress: () => {
                navigation.navigate('JobPostingPayment', { 
                  paymentUrl,
                  jobData: jobPost,
                  companyId: selectedCompany?.id
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Success', 'Job posted successfully');
        navigation.goBack();
      }
      
    } catch (error: any) {
      console.error('Error posting job:', error);
      if (error.response?.status === 402) {
        // Payment required
        setPaymentRequired(true);
        setPaymentAmount(error.response.data.paymentAmount);
        setPaymentUrl(error.response.data.paymentUrl);
        
        Alert.alert(
          'Payment Required',
          error.response.data.message,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Pay Now',
              onPress: () => {
                navigation.navigate('JobPostingPayment', { 
                  paymentUrl: error.response.data.paymentUrl,
                  jobData: jobPost,
                  companyId: selectedCompany?.id
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', error.response?.data?.error || 'Failed to post job');
      }
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !jobPost.requiredSkills.includes(newSkill.trim())) {
      setJobPost(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setJobPost(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addPreferredSkill = () => {
    if (newPreferredSkill.trim() && !jobPost.preferredSkills.includes(newPreferredSkill.trim())) {
      setJobPost(prev => ({
        ...prev,
        preferredSkills: [...prev.preferredSkills, newPreferredSkill.trim()]
      }));
      setNewPreferredSkill('');
    }
  };

  const removePreferredSkill = (skillToRemove: string) => {
    setJobPost(prev => ({
      ...prev,
      preferredSkills: prev.preferredSkills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleCompanySelect = (company: any) => {
    setSelectedCompany(company);
    setJobPost(prev => ({
      ...prev,
      company: company.name,
      companyId: company.id,
      fairChanceHiring: {
        ...prev.fairChanceHiring,
        ...company.fairChanceHiring,
      },
    }));
  };

  if (loading) {
    return (
      <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
        <ScreenHeader title="Post Job" onBackPress={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={{ marginTop: 10, color: COLORS.gray }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader title="Post Job" onBackPress={() => navigation.goBack()} />
      
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16 }}>
          {/* Company Selection */}
          {companies.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: COLORS.black }}>
                Company
              </Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {companies.map((company) => (
                  <TouchableOpacity
                    key={company.id}
                    style={{
                      backgroundColor: selectedCompany?.id === company.id ? COLORS.green : '#F5F5F5',
                      borderRadius: 8,
                      padding: 12,
                      marginRight: 12,
                      borderWidth: 1,
                      borderColor: selectedCompany?.id === company.id ? COLORS.green : COLORS.border,
                    }}
                    onPress={() => handleCompanySelect(company)}
                  >
                    <Text style={{ 
                      color: selectedCompany?.id === company.id ? COLORS.white : COLORS.black,
                      fontSize: 14,
                      fontWeight: '500'
                    }}>
                      {company.name}
                    </Text>
                    {company.verificationStatus === 'verified' && (
                      <Text style={{ 
                        color: selectedCompany?.id === company.id ? 'rgba(255,255,255,0.8)' : COLORS.green,
                        fontSize: 12,
                        marginTop: 4
                      }}>
                        ✓ Verified
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Basic Information */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: COLORS.black }}>
              Basic Information
            </Text>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Job Title *</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: COLORS.black,
                }}
                value={jobPost.title}
                onChangeText={(text) => setJobPost({ ...jobPost, title: text })}
                placeholder="e.g., Senior React Developer"
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Description *</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: COLORS.black,
                  height: 120,
                  textAlignVertical: 'top',
                }}
                value={jobPost.description}
                onChangeText={(text) => setJobPost({ ...jobPost, description: text })}
                placeholder="Describe the role, responsibilities, and requirements..."
                multiline
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Location *</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MapPin size={20} color={COLORS.gray} style={{ marginRight: 8 }} />
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    color: COLORS.black,
                    flex: 1,
                  }}
                  value={jobPost.location}
                  onChangeText={(text) => setJobPost({ ...jobPost, location: text })}
                  placeholder="e.g., New York, NY or Remote"
                />
              </View>
            </View>
          </View>

          {/* Job Details */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: COLORS.black }}>
              Job Details
            </Text>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Job Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {jobTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={{
                      backgroundColor: jobPost.jobType === type.value ? COLORS.green : '#F5F5F5',
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      marginRight: 8,
                      borderWidth: 1,
                      borderColor: jobPost.jobType === type.value ? COLORS.green : COLORS.border,
                    }}
                    onPress={() => setJobPost({ ...jobPost, jobType: type.value })}
                  >
                    <Text style={{ 
                      color: jobPost.jobType === type.value ? COLORS.white : COLORS.black,
                      fontSize: 14,
                      fontWeight: '500'
                    }}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Shift Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {shiftTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={{
                      backgroundColor: jobPost.shiftType === type.value ? COLORS.green : '#F5F5F5',
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      marginRight: 8,
                      borderWidth: 1,
                      borderColor: jobPost.shiftType === type.value ? COLORS.green : COLORS.border,
                    }}
                    onPress={() => setJobPost({ ...jobPost, shiftType: type.value })}
                  >
                    <Text style={{ 
                      color: jobPost.shiftType === type.value ? COLORS.white : COLORS.black,
                      fontSize: 14,
                      fontWeight: '500'
                    }}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Experience Level</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {experienceLevels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={{
                      backgroundColor: jobPost.experienceLevel === level.value ? COLORS.green : '#F5F5F5',
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      marginRight: 8,
                      borderWidth: 1,
                      borderColor: jobPost.experienceLevel === level.value ? COLORS.green : COLORS.border,
                    }}
                    onPress={() => setJobPost({ ...jobPost, experienceLevel: level.value })}
                  >
                    <Text style={{ 
                      color: jobPost.experienceLevel === level.value ? COLORS.white : COLORS.black,
                      fontSize: 14,
                      fontWeight: '500'
                    }}>
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>Education Level</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {educationLevels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={{
                      backgroundColor: jobPost.educationLevel === level.value ? COLORS.green : '#F5F5F5',
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      marginRight: 8,
                      borderWidth: 1,
                      borderColor: jobPost.educationLevel === level.value ? COLORS.green : COLORS.border,
                    }}
                    onPress={() => setJobPost({ ...jobPost, educationLevel: level.value })}
                  >
                    <Text style={{ 
                      color: jobPost.educationLevel === level.value ? COLORS.white : COLORS.black,
                      fontSize: 14,
                      fontWeight: '500'
                    }}>
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Skills */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: COLORS.black }}>
              Skills
            </Text>
            
            {/* Required Skills */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>
                Required Skills * ({jobPost.requiredSkills.length})
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8,
              }}>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    color: COLORS.black,
                    flex: 1,
                    marginRight: 8,
                  }}
                  value={newSkill}
                  onChangeText={setNewSkill}
                  placeholder="Add required skill"
                  onSubmitEditing={addSkill}
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.green,
                    borderRadius: 8,
                    padding: 12,
                  }}
                  onPress={addSkill}
                >
                  <Check size={20} color={COLORS.white} />
                </TouchableOpacity>
              </View>
              
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {jobPost.requiredSkills.map((skill, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: COLORS.green,
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      marginRight: 8,
                      marginBottom: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, color: COLORS.white, fontWeight: '500', marginRight: 4 }}>
                      {skill}
                    </Text>
                    <TouchableOpacity onPress={() => removeSkill(skill)}>
                      <X size={14} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Preferred Skills */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>
                Preferred Skills ({jobPost.preferredSkills.length})
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8,
              }}>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    color: COLORS.black,
                    flex: 1,
                    marginRight: 8,
                  }}
                  value={newPreferredSkill}
                  onChangeText={setNewPreferredSkill}
                  placeholder="Add preferred skill"
                  onSubmitEditing={addPreferredSkill}
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.blue,
                    borderRadius: 8,
                    padding: 12,
                  }}
                  onPress={addPreferredSkill}
                >
                  <Check size={20} color={COLORS.white} />
                </TouchableOpacity>
              </View>
              
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {jobPost.preferredSkills.map((skill, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: COLORS.blue,
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      marginRight: 8,
                      marginBottom: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, color: COLORS.white, fontWeight: '500', marginRight: 4 }}>
                      {skill}
                    </Text>
                    <TouchableOpacity onPress={() => removePreferredSkill(skill)}>
                      <X size={14} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Salary */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: COLORS.black }}>
              Salary Range
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <DollarSign size={20} color={COLORS.gray} style={{ marginRight: 8 }} />
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: COLORS.black,
                  flex: 1,
                  marginRight: 8,
                }}
                value={jobPost.salaryRange.min.toString()}
                onChangeText={(text) => setJobPost({
                  ...jobPost,
                  salaryRange: { ...jobPost.salaryRange, min: parseInt(text) || 0 }
                })}
                placeholder="Min"
                keyboardType="numeric"
              />
              <Text style={{ fontSize: 16, color: COLORS.black, marginHorizontal: 8 }}>to</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: COLORS.black,
                  flex: 1,
                  marginLeft: 8,
                }}
                value={jobPost.salaryRange.max.toString()}
                onChangeText={(text) => setJobPost({
                  ...jobPost,
                  salaryRange: { ...jobPost.salaryRange, max: parseInt(text) || 0 }
                })}
                placeholder="Max"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Fair Chance Hiring */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Users size={20} color={COLORS.green} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.black }}>
                Fair Chance Hiring
              </Text>
            </View>

            <View style={{
              backgroundColor: '#F0F9FF',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 12, color: COLORS.blue }}>
                These settings will be displayed to candidates and show your commitment to fair chance hiring practices.
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 14, color: COLORS.black }}>Ban-the-Box Compliant</Text>
                <Switch
                  value={jobPost.fairChanceHiring.banTheBoxCompliant}
                  onValueChange={(value) => setJobPost({
                    ...jobPost,
                    fairChanceHiring: { ...jobPost.fairChanceHiring, banTheBoxCompliant: value }
                  })}
                  trackColor={{ false: COLORS.border, true: COLORS.green }}
                  thumbColor={COLORS.white}
                />
              </View>
            </View>

            <View style={{ marginBottom: 12 }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 14, color: COLORS.black }}>Case-by-Case Review</Text>
                <Switch
                  value={jobPost.fairChanceHiring.caseByCaseReview}
                  onValueChange={(value) => setJobPost({
                    ...jobPost,
                    fairChanceHiring: { ...jobPost.fairChanceHiring, caseByCaseReview: value }
                  })}
                  trackColor={{ false: COLORS.border, true: COLORS.green }}
                  thumbColor={COLORS.white}
                />
              </View>
            </View>

            <View style={{ marginBottom: 12 }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 14, color: COLORS.black }}>No Background Check Required</Text>
                <Switch
                  value={jobPost.fairChanceHiring.noBackgroundCheck}
                  onValueChange={(value) => setJobPost({
                    ...jobPost,
                    fairChanceHiring: { ...jobPost.fairChanceHiring, noBackgroundCheck: value }
                  })}
                  trackColor={{ false: COLORS.border, true: COLORS.green }}
                  thumbColor={COLORS.white}
                />
              </View>
            </View>
          </View>

          {/* Background Check */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <AlertCircle size={20} color={COLORS.orange} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.black }}>
                Background Check
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 14, color: COLORS.black }}>Background Check Required</Text>
              <Switch
                value={jobPost.backgroundCheckRequired}
                onValueChange={(value) => setJobPost({ ...jobPost, backgroundCheckRequired: value })}
                trackColor={{ false: COLORS.border, true: COLORS.orange }}
                thumbColor={COLORS.white}
              />
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.green,
              borderRadius: 8,
              padding: 16,
              alignItems: 'center',
              marginBottom: 32,
            }}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '600' }}>
                Post Job
              </Text>
            )}
          </TouchableOpacity>

          {paymentRequired && (
            <View style={{
              backgroundColor: '#FEF3C7',
              borderRadius: 8,
              padding: 12,
              marginBottom: 32,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <CreditCard size={20} color={COLORS.orange} style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 14, color: COLORS.black, flex: 1 }}>
                A payment of ${paymentAmount} is required to post this job. You'll be prompted to complete payment after posting.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PostJobScreen;
