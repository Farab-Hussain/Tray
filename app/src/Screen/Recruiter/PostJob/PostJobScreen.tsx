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
import AppButton from '../../../components/ui/AppButton';
import { COLORS } from '../../../constants/core/colors';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { JobService } from '../../../services/job.service';
import { 
  Briefcase, 
  DollarSign, 
  MapPin, 
  Clock, 
  Users, 
  Check,
  X,
  CreditCard,
  AlertCircle,
  Plus,
  User,
  GraduationCap,
  Shield
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
    // Prepare job data for API outside try-catch to make it accessible in catch block
    const jobDataForAPI = {
      title: jobPost.title.trim(),
      description: jobPost.description.trim(),
      company: selectedCompany?.name || '', // Send company name instead of ID
      location: jobPost.location.trim(),
      jobType: jobPost.jobType as 'full-time' | 'part-time' | 'contract' | 'internship',
      requiredSkills: jobPost.requiredSkills.filter(skill => skill.trim() !== ''), // Filter out empty strings
      salaryRange: {
        min: jobPost.salaryRange.min,
        max: jobPost.salaryRange.max,
        currency: jobPost.salaryRange.currency,
      },
      experienceRequired: jobPost.experienceLevel === 'entry' ? 0 : 
                        jobPost.experienceLevel === 'mid' ? 3 : 
                        jobPost.experienceLevel === 'senior' ? 5 : 10,
      educationRequired: jobPost.educationLevel,
      backgroundCheckRequired: jobPost.backgroundCheckRequired,
      fairChanceHiring: {
        banTheBox: jobPost.fairChanceHiring.banTheBoxCompliant,
        felonyFriendly: jobPost.fairChanceHiring.felonyFriendly,
        caseByCaseReview: jobPost.fairChanceHiring.caseByCaseReview,
        noBackgroundCheck: jobPost.fairChanceHiring.noBackgroundCheck,
        secondChancePolicy: false, // Default value
      },
      status: 'active' as const,
    };

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

      if (!selectedCompany) {
        Alert.alert('Error', 'Please select a company');
        return;
      }

      // Make API call to post job
      await JobService.createJob(jobDataForAPI);
      
      Alert.alert('Success', 'Job posted successfully');
      navigation.goBack();
      
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
                  jobData: jobDataForAPI,
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
      
      <ScrollView style={{ flex: 1, backgroundColor: '#FAFAFA' }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16 }}>
          {/* Company Selection */}
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Briefcase size={20} color={COLORS.green} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.black }}>
                Select Company
              </Text>
            </View>
            
            {companies.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <AlertCircle size={40} color={COLORS.gray} style={{ marginBottom: 12 }} />
                <Text style={{ fontSize: 16, color: COLORS.gray, textAlign: 'center' }}>
                  No companies found. Please create a company first.
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {companies.map((company) => (
                  <TouchableOpacity
                    key={company.id}
                    style={{
                      backgroundColor: selectedCompany?.id === company.id ? COLORS.green : '#F8F9FA',
                      borderRadius: 12,
                      padding: 16,
                      marginRight: 12,
                      borderWidth: 2,
                      borderColor: selectedCompany?.id === company.id ? COLORS.green : '#E9ECEF',
                      minWidth: 140,
                    }}
                    onPress={() => handleCompanySelect(company)}
                  >
                    <Text style={{ 
                      color: selectedCompany?.id === company.id ? COLORS.white : COLORS.black,
                      fontSize: 14,
                      fontWeight: '600',
                      textAlign: 'center'
                    }}>
                      {company.name}
                    </Text>
                    {selectedCompany?.id === company.id && (
                      <Text style={{ 
                        color: 'rgba(255,255,255,0.9)', 
                        fontSize: 12, 
                        marginTop: 4,
                        textAlign: 'center'
                      }}>
                        Selected
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Job Information */}
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <Users size={20} color={COLORS.green} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.black }}>
                Job Information
              </Text>
            </View>
            
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8, fontWeight: '500' }}>
                Job Title *
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#E9ECEF',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: COLORS.black,
                  backgroundColor: '#F8F9FA',
                }}
                value={jobPost.title}
                onChangeText={(text) => setJobPost({ ...jobPost, title: text })}
                placeholder="e.g., Senior Software Engineer"
                placeholderTextColor={COLORS.gray}
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8, fontWeight: '500' }}>
                Job Description *
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#E9ECEF',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: COLORS.black,
                  backgroundColor: '#F8F9FA',
                  height: 120,
                  textAlignVertical: 'top'
                }}
                value={jobPost.description}
                onChangeText={(text) => setJobPost({ ...jobPost, description: text })}
                placeholder="Describe the role, responsibilities, and requirements..."
                placeholderTextColor={COLORS.gray}
                multiline
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8, fontWeight: '500' }}>
                Location *
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MapPin size={20} color={COLORS.green} style={{ marginRight: 8 }} />
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#E9ECEF',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: COLORS.black,
                    backgroundColor: '#F8F9FA',
                    flex: 1,
                  }}
                  value={jobPost.location}
                  onChangeText={(text) => setJobPost({ ...jobPost, location: text })}
                  placeholder="e.g., New York, NY or Remote"
                  placeholderTextColor={COLORS.gray}
                />
              </View>
            </View>
          </View>

          {/* Job Details */}
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <Clock size={20} color={COLORS.green} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.black }}>
                Job Details
              </Text>
            </View>
            
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 12, fontWeight: '500' }}>
                Job Type
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {jobTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={{
                      backgroundColor: jobPost.jobType === type.value ? COLORS.green : '#F8F9FA',
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      marginRight: 8,
                      borderWidth: 2,
                      borderColor: jobPost.jobType === type.value ? COLORS.green : '#E9ECEF',
                    }}
                    onPress={() => setJobPost({ ...jobPost, jobType: type.value })}
                  >
                    <Text style={{ 
                      color: jobPost.jobType === type.value ? COLORS.white : COLORS.black,
                      fontSize: 14,
                      fontWeight: '600'
                    }}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 12, fontWeight: '500' }}>
                Shift Type
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {shiftTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={{
                      backgroundColor: jobPost.shiftType === type.value ? COLORS.green : '#F8F9FA',
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      marginRight: 8,
                      borderWidth: 2,
                      borderColor: jobPost.shiftType === type.value ? COLORS.green : '#E9ECEF',
                    }}
                    onPress={() => setJobPost({ ...jobPost, shiftType: type.value })}
                  >
                    <Text style={{ 
                      color: jobPost.shiftType === type.value ? COLORS.white : COLORS.black,
                      fontSize: 14,
                      fontWeight: '600'
                    }}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 12, fontWeight: '500' }}>
                Experience Level
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {experienceLevels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={{
                      backgroundColor: jobPost.experienceLevel === level.value ? COLORS.green : '#F8F9FA',
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      marginRight: 8,
                      borderWidth: 2,
                      borderColor: jobPost.experienceLevel === level.value ? COLORS.green : '#E9ECEF',
                    }}
                    onPress={() => setJobPost({ ...jobPost, experienceLevel: level.value })}
                  >
                    <Text style={{ 
                      color: jobPost.experienceLevel === level.value ? COLORS.white : COLORS.black,
                      fontSize: 14,
                      fontWeight: '600'
                    }}>
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 12, fontWeight: '500' }}>
                Education Level
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {educationLevels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={{
                      backgroundColor: jobPost.educationLevel === level.value ? COLORS.green : '#F8F9FA',
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      marginRight: 8,
                      borderWidth: 2,
                      borderColor: jobPost.educationLevel === level.value ? COLORS.green : '#E9ECEF',
                    }}
                    onPress={() => setJobPost({ ...jobPost, educationLevel: level.value })}
                  >
                    <Text style={{ 
                      color: jobPost.educationLevel === level.value ? COLORS.white : COLORS.black,
                      fontSize: 14,
                      fontWeight: '600'
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
          <AppButton
            title="Post Job"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            icon={Briefcase}
            style={{
              marginBottom: 32,
              backgroundColor: COLORS.green,
            }}
          />

          {paymentRequired && (
            <View style={{
              backgroundColor: '#FEF3C7',
              borderRadius: 12,
              padding: 16,
              marginBottom: 32,
              flexDirection: 'row',
              alignItems: 'center',
              borderLeftWidth: 4,
              borderLeftColor: COLORS.orange,
            }}>
              <CreditCard size={24} color={COLORS.orange} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 4 }}>
                  Payment Required
                </Text>
                <Text style={{ fontSize: 14, color: COLORS.gray, lineHeight: 20 }}>
                  A payment of ${paymentAmount} is required to post this job. You'll be prompted to complete payment after posting.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PostJobScreen;
