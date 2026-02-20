import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react-native';
import CompanyService from '../../../services/company.service';
import { AIProvider, AIService } from '../../../services/ai.service';

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

const PostJobScreen = ({ navigation }: any) => {
  const [loading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [, setErrors] = useState<{ [key: string]: string }>({});
  const [newSkill, setNewSkill] = useState('');
  const [newPreferredSkill, setNewPreferredSkill] = useState('');
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [, setPaymentUrl] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiImproving, setAiImproving] = useState(false);
  const [aiSuggestingSkills, setAiSuggestingSkills] = useState(false);
  const [aiAutocompleteProvider, setAiAutocompleteProvider] =
    useState<AIProvider>('openai');
  const [requiredSkillSuggestions, setRequiredSkillSuggestions] = useState<
    string[]
  >([]);
  const [preferredSkillSuggestions, setPreferredSkillSuggestions] = useState<
    string[]
  >([]);
  const [loadingRequiredSuggestions, setLoadingRequiredSuggestions] =
    useState(false);
  const [loadingPreferredSuggestions, setLoadingPreferredSuggestions] =
    useState(false);
  const requiredSkillDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const preferredSkillDebounceRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  // Validation functions
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'title':
        if (!value || value.trim() === '') {
          return 'Job title is required';
        }
        if (value.trim().length < 3) {
          return 'Job title must be at least 3 characters';
        }
        if (value.trim().length > 200) {
          return 'Job title must be less than 200 characters';
        }
        return '';

      case 'description':
        if (!value || value.trim() === '') {
          return 'Job description is required';
        }
        if (value.trim().length < 10) {
          return 'Job description must be at least 10 characters';
        }
        if (value.trim().length > 5000) {
          return 'Job description must be less than 5000 characters';
        }
        return '';

      case 'location':
        if (!value || value.trim() === '') {
          return 'Location is required';
        }
        if (value.trim().length < 1) {
          return 'Location must be at least 1 character';
        }
        if (value.trim().length > 200) {
          return 'Location must be less than 200 characters';
        }
        return '';

      case 'company':
        if (!selectedCompany) {
          return 'Please select a company';
        }
        return '';

      case 'requiredSkills':
        if (!value || value.length === 0) {
          return 'At least one required skill is needed';
        }
        if (value.some((skill: string) => skill.trim() === '')) {
          return 'Skills cannot be empty';
        }
        return '';

      case 'salaryMin':
        if (value < 0) {
          return 'Minimum salary cannot be negative';
        }
        if (value > 999999) {
          return 'Minimum salary seems too high';
        }
        return '';

      case 'salaryMax':
        if (value < 0) {
          return 'Maximum salary cannot be negative';
        }
        if (value > 999999) {
          return 'Maximum salary seems too high';
        }
        if (jobPost.salaryRange.min > 0 && value < jobPost.salaryRange.min) {
          return 'Maximum salary must be greater than minimum salary';
        }
        return '';

      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate all fields
    newErrors.title = validateField('title', jobPost.title);
    newErrors.description = validateField('description', jobPost.description);
    newErrors.location = validateField('location', jobPost.location);
    newErrors.company = validateField('company', selectedCompany);
    newErrors.requiredSkills = validateField(
      'requiredSkills',
      jobPost.requiredSkills,
    );
    newErrors.salaryMin = validateField('salaryMin', jobPost.salaryRange.min);
    newErrors.salaryMax = validateField('salaryMax', jobPost.salaryRange.max);

    setErrors(newErrors);

    // Check if there are any errors
    return Object.values(newErrors).every(error => error === '');
  };

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
    { value: 'bachelor', label: "Bachelor's Degree" },
    { value: 'master', label: "Master's Degree" },
    { value: 'phd', label: 'PhD' },
  ];

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    return () => {
      if (requiredSkillDebounceRef.current)
        clearTimeout(requiredSkillDebounceRef.current);
      if (preferredSkillDebounceRef.current)
        clearTimeout(preferredSkillDebounceRef.current);
    };
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
    // Validate form before submission
    if (!validateForm()) {
      Alert.alert(
        'Validation Error',
        'Please fix the errors in the form before submitting.',
      );
      return;
    }

    // Prepare job data for API outside try-catch to make it accessible in catch block
    const jobDataForAPI = {
      title: jobPost.title.trim(),
      description: jobPost.description.trim(),
      company: selectedCompany?.name || '', // Send company name instead of ID
      location: jobPost.location.trim(),
      jobType: jobPost.jobType as
        | 'full-time'
        | 'part-time'
        | 'contract'
        | 'internship',
      requiredSkills: jobPost.requiredSkills.filter(
        skill => skill.trim() !== '',
      ), // Filter out empty strings
      salaryRange: {
        min: jobPost.salaryRange.min,
        max: jobPost.salaryRange.max,
        currency: jobPost.salaryRange.currency,
      },
      experienceRequired:
        jobPost.experienceLevel === 'entry'
          ? 0
          : jobPost.experienceLevel === 'mid'
          ? 3
          : jobPost.experienceLevel === 'senior'
          ? 5
          : 10,
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

      // Make API call to post job
      await JobService.createJob(jobDataForAPI);

      Alert.alert('Success', 'Job posted successfully');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error posting job:', error);
      console.log('Error response:', error.response);
      console.log('Error status:', error.response?.status);
      console.log('Error data:', error.response?.data);

      if (error.response?.status === 402) {
        // Payment required
        setPaymentRequired(true);
        setPaymentAmount(error.response.data.paymentAmount);
        setPaymentUrl(error.response.data.paymentUrl);

        Alert.alert('Payment Required', error.response.data.message, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pay Now',
            onPress: () => {
              navigation.navigate('JobPostingPayment', {
                paymentUrl: error.response.data.paymentUrl,
                jobData: jobDataForAPI,
                companyId: selectedCompany?.id,
              });
            },
          },
        ]);
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.error || 'Failed to post job',
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !jobPost.requiredSkills.includes(newSkill.trim())) {
      setJobPost(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, newSkill.trim()],
      }));
      setNewSkill('');
      setRequiredSkillSuggestions([]);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setJobPost(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(
        skill => skill !== skillToRemove,
      ),
    }));
  };

  const addPreferredSkill = () => {
    if (
      newPreferredSkill.trim() &&
      !jobPost.preferredSkills.includes(newPreferredSkill.trim())
    ) {
      setJobPost(prev => ({
        ...prev,
        preferredSkills: [...prev.preferredSkills, newPreferredSkill.trim()],
      }));
      setNewPreferredSkill('');
      setPreferredSkillSuggestions([]);
    }
  };

  const removePreferredSkill = (skillToRemove: string) => {
    setJobPost(prev => ({
      ...prev,
      preferredSkills: prev.preferredSkills.filter(
        skill => skill !== skillToRemove,
      ),
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

  const normalizeUniqueSkills = (items: string[]) =>
    Array.from(
      new Set(
        items
          .map(item => item?.trim())
          .filter(Boolean)
          .map(item => item as string),
      ),
    );

  const fetchSkillAutocomplete = async (
    text: string,
    target: 'required' | 'preferred',
  ) => {
    const query = text.trim();
    if (query.length < 2) {
      if (target === 'required') setRequiredSkillSuggestions([]);
      if (target === 'preferred') setPreferredSkillSuggestions([]);
      return;
    }

    try {
      if (target === 'required') setLoadingRequiredSuggestions(true);
      if (target === 'preferred') setLoadingPreferredSuggestions(true);

      const result = await AIService.autocomplete({
        provider: aiAutocompleteProvider,
        field_type: 'skill',
        partial_text: query,
        max_suggestions: 5,
        context: {
          role: jobPost.title || 'general',
          company: selectedCompany?.name || 'general',
        },
      });

      const suggestions = Array.isArray(result?.suggestions)
        ? normalizeUniqueSkills(result.suggestions)
        : [];

      if (target === 'required') {
        const filtered = suggestions.filter(
          skill =>
            !jobPost.requiredSkills.some(
              existing => existing.toLowerCase() === skill.toLowerCase(),
            ),
        );
        setRequiredSkillSuggestions(filtered);
      } else {
        const filtered = suggestions.filter(
          skill =>
            !jobPost.preferredSkills.some(
              existing => existing.toLowerCase() === skill.toLowerCase(),
            ),
        );
        setPreferredSkillSuggestions(filtered);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Skill autocomplete failed:', error);
      }
      if (target === 'required') setRequiredSkillSuggestions([]);
      if (target === 'preferred') setPreferredSkillSuggestions([]);
    } finally {
      if (target === 'required') setLoadingRequiredSuggestions(false);
      if (target === 'preferred') setLoadingPreferredSuggestions(false);
    }
  };

  const handleRequiredSkillInputChange = (text: string) => {
    setNewSkill(text);
    if (requiredSkillDebounceRef.current)
      clearTimeout(requiredSkillDebounceRef.current);
    requiredSkillDebounceRef.current = setTimeout(() => {
      fetchSkillAutocomplete(text, 'required');
    }, 350);
  };

  const handlePreferredSkillInputChange = (text: string) => {
    setNewPreferredSkill(text);
    if (preferredSkillDebounceRef.current)
      clearTimeout(preferredSkillDebounceRef.current);
    preferredSkillDebounceRef.current = setTimeout(() => {
      fetchSkillAutocomplete(text, 'preferred');
    }, 350);
  };

  const handleAIGenerateJobPost = async (provider: AIProvider) => {
    if (!jobPost.title.trim()) {
      Alert.alert(
        'Job Title Required',
        'Enter a job title before generating with AI.',
      );
      return;
    }

    try {
      setAiGenerating(true);
      const generated = await AIService.generateJobPost({
        provider,
        role_title: jobPost.title.trim(),
        company_name: selectedCompany?.name || 'Your Company',
        company_description: selectedCompany?.description || undefined,
        location: jobPost.location.trim() || 'Remote',
        job_type: jobPost.jobType,
        experience_level: jobPost.experienceLevel,
        required_skills: jobPost.requiredSkills.length
          ? jobPost.requiredSkills
          : ['Communication'],
        nice_to_have: jobPost.preferredSkills,
        salary_range:
          jobPost.salaryRange.min > 0 || jobPost.salaryRange.max > 0
            ? `${jobPost.salaryRange.min}-${jobPost.salaryRange.max} ${jobPost.salaryRange.currency}`
            : undefined,
        tone: 'professional',
      });

      const generatedText = generated?.job_post?.trim();
      if (!generatedText) {
        Alert.alert(
          'AI Error',
          'Generated job post was empty. Please try again.',
        );
        return;
      }

      setJobPost(prev => ({ ...prev, description: generatedText }));
      Alert.alert('Success', 'Job description generated with AI.');
    } catch (error: any) {
      if (__DEV__) {
        console.error('AI generate job post failed:', error);
      }
      Alert.alert(
        'AI Error',
        error?.response?.data?.detail ||
          error?.message ||
          'Failed to generate job post.',
      );
    } finally {
      setAiGenerating(false);
    }
  };

  const openGenerateProviderPicker = () => {
    Alert.alert('Choose AI Provider', 'Select model provider for generation.', [
      { text: 'OpenAI', onPress: () => handleAIGenerateJobPost('openai') },
      { text: 'Claude', onPress: () => handleAIGenerateJobPost('claude') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleAIImproveDescription = async (
    provider: AIProvider,
    improvementType: string,
  ) => {
    if (!jobPost.description.trim()) {
      Alert.alert(
        'Description Required',
        'Add description text before improving with AI.',
      );
      return;
    }

    try {
      setAiImproving(true);
      const improved = await AIService.improveJobPost({
        provider,
        existing_post: jobPost.description.trim(),
        improvement_type: improvementType,
      });

      const improvedText = improved?.improved_post?.trim();
      if (!improvedText) {
        Alert.alert('AI Error', 'Improved text was empty. Please try again.');
        return;
      }

      setJobPost(prev => ({ ...prev, description: improvedText }));
      Alert.alert('Success', 'Job description improved.');
    } catch (error: any) {
      if (__DEV__) {
        console.error('AI improve job post failed:', error);
      }
      Alert.alert(
        'AI Error',
        error?.response?.data?.detail ||
          error?.message ||
          'Failed to improve job post.',
      );
    } finally {
      setAiImproving(false);
    }
  };

  const openImprovePicker = () => {
    Alert.alert('Improve Job Description', 'Pick an improvement type.', [
      { text: 'Clarity', onPress: () => openImproveProviderPicker('clarity') },
      {
        text: 'Inclusivity',
        onPress: () => openImproveProviderPicker('inclusivity'),
      },
      { text: 'Tone', onPress: () => openImproveProviderPicker('tone') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openImproveProviderPicker = (improvementType: string) => {
    Alert.alert(
      'Choose AI Provider',
      'Select model provider for improvement.',
      [
        {
          text: 'OpenAI',
          onPress: () => handleAIImproveDescription('openai', improvementType),
        },
        {
          text: 'Claude',
          onPress: () => handleAIImproveDescription('claude', improvementType),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const handleAISuggestSkills = async (provider: AIProvider) => {
    if (!jobPost.description.trim()) {
      Alert.alert(
        'Description Required',
        'Add a job description before extracting skills.',
      );
      return;
    }

    try {
      setAiSuggestingSkills(true);
      const extracted = await AIService.extractJobSkills({
        provider,
        job_description: jobPost.description.trim(),
      });

      const required = Array.isArray(extracted?.required_skills)
        ? extracted.required_skills
        : [];
      const niceToHave = Array.isArray(extracted?.nice_to_have)
        ? extracted.nice_to_have
        : [];

      const mergedRequired = normalizeUniqueSkills([
        ...jobPost.requiredSkills,
        ...required,
      ]);
      const mergedPreferred = normalizeUniqueSkills([
        ...jobPost.preferredSkills,
        ...niceToHave,
      ]);

      setJobPost(prev => ({
        ...prev,
        requiredSkills: mergedRequired,
        preferredSkills: mergedPreferred,
      }));

      Alert.alert('Success', 'AI skill suggestions added.');
    } catch (error: any) {
      if (__DEV__) {
        console.error('AI skill extraction failed:', error);
      }
      Alert.alert(
        'AI Error',
        error?.response?.data?.detail ||
          error?.message ||
          'Failed to extract skills.',
      );
    } finally {
      setAiSuggestingSkills(false);
    }
  };

  const openSuggestSkillsProviderPicker = () => {
    Alert.alert(
      'Choose AI Provider',
      'Select model provider for skill suggestions.',
      [
        { text: 'OpenAI', onPress: () => handleAISuggestSkills('openai') },
        { text: 'Claude', onPress: () => handleAISuggestSkills('claude') },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
        <ScreenHeader
          title="Post Job"
          onBackPress={() => navigation.goBack()}
        />
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={{ marginTop: 10, color: COLORS.gray }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader title="Post Job" onBackPress={() => navigation.goBack()} />

      <ScrollView
        style={{ flex: 1, backgroundColor: '#FAFAFA' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: 16 }}>
          {/* Company Selection */}
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Briefcase
                size={20}
                color={COLORS.green}
                style={{ marginRight: 8 }}
              />
              <Text
                style={{ fontSize: 18, fontWeight: '600', color: COLORS.black }}
              >
                Select Company
              </Text>
            </View>

            {companies.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <AlertCircle
                  size={40}
                  color={COLORS.gray}
                  style={{ marginBottom: 12 }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    color: COLORS.gray,
                    textAlign: 'center',
                  }}
                >
                  No companies found. Please create a company first.
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {companies.map(company => (
                  <TouchableOpacity
                    key={company.id}
                    style={{
                      backgroundColor:
                        selectedCompany?.id === company.id
                          ? COLORS.green
                          : '#F8F9FA',
                      borderRadius: 12,
                      padding: 16,
                      marginRight: 12,
                      borderWidth: 2,
                      borderColor:
                        selectedCompany?.id === company.id
                          ? COLORS.green
                          : '#E9ECEF',
                      minWidth: 140,
                    }}
                    onPress={() => handleCompanySelect(company)}
                  >
                    <Text
                      style={{
                        color:
                          selectedCompany?.id === company.id
                            ? COLORS.white
                            : COLORS.black,
                        fontSize: 14,
                        fontWeight: '600',
                        textAlign: 'center',
                      }}
                    >
                      {company.name}
                    </Text>
                    {selectedCompany?.id === company.id && (
                      <Text
                        style={{
                          color: 'rgba(255,255,255,0.9)',
                          fontSize: 12,
                          marginTop: 4,
                          textAlign: 'center',
                        }}
                      >
                        Selected
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Job Information */}
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <Users
                size={20}
                color={COLORS.green}
                style={{ marginRight: 8 }}
              />
              <Text
                style={{ fontSize: 18, fontWeight: '600', color: COLORS.black }}
              >
                Job Information
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.gray,
                  marginBottom: 8,
                  fontWeight: '500',
                }}
              >
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
                onChangeText={text => setJobPost({ ...jobPost, title: text })}
                placeholder="e.g., Senior Software Engineer"
                placeholderTextColor={COLORS.gray}
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.gray,
                  marginBottom: 8,
                  fontWeight: '500',
                }}
              >
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
                  textAlignVertical: 'top',
                }}
                value={jobPost.description}
                onChangeText={text =>
                  setJobPost({ ...jobPost, description: text })
                }
                placeholder="Describe the role, responsibilities, and requirements..."
                placeholderTextColor={COLORS.gray}
                multiline
              />
              <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <TouchableOpacity
                  onPress={openGenerateProviderPicker}
                  disabled={aiGenerating || aiImproving}
                  style={{
                    backgroundColor: COLORS.blue,
                    borderRadius: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    marginRight: 8,
                    opacity: aiGenerating || aiImproving ? 0.7 : 1,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.white,
                      fontWeight: '600',
                      fontSize: 13,
                    }}
                  >
                    {aiGenerating ? 'Generating...' : 'Generate with AI'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={openImprovePicker}
                  disabled={aiGenerating || aiImproving}
                  style={{
                    backgroundColor: COLORS.green,
                    borderRadius: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    opacity: aiGenerating || aiImproving ? 0.7 : 1,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.black,
                      fontWeight: '600',
                      fontSize: 13,
                    }}
                  >
                    {aiImproving ? 'Improving...' : 'Improve with AI'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.gray,
                  marginBottom: 8,
                  fontWeight: '500',
                }}
              >
                Location *
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MapPin
                  size={20}
                  color={COLORS.green}
                  style={{ marginRight: 8 }}
                />
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
                  onChangeText={text =>
                    setJobPost({ ...jobPost, location: text })
                  }
                  placeholder="e.g., New York, NY or Remote"
                  placeholderTextColor={COLORS.gray}
                />
              </View>
            </View>
          </View>

          {/* Job Details */}
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <Clock
                size={20}
                color={COLORS.green}
                style={{ marginRight: 8 }}
              />
              <Text
                style={{ fontSize: 18, fontWeight: '600', color: COLORS.black }}
              >
                Job Details
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.gray,
                  marginBottom: 12,
                  fontWeight: '500',
                }}
              >
                Job Type
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {jobTypes.map(type => (
                  <TouchableOpacity
                    key={type.value}
                    style={{
                      backgroundColor:
                        jobPost.jobType === type.value
                          ? COLORS.green
                          : '#F8F9FA',
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      marginRight: 8,
                      borderWidth: 2,
                      borderColor:
                        jobPost.jobType === type.value
                          ? COLORS.green
                          : '#E9ECEF',
                    }}
                    onPress={() =>
                      setJobPost({ ...jobPost, jobType: type.value })
                    }
                  >
                    <Text
                      style={{
                        color:
                          jobPost.jobType === type.value
                            ? COLORS.white
                            : COLORS.black,
                        fontSize: 14,
                        fontWeight: '600',
                      }}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.gray,
                  marginBottom: 12,
                  fontWeight: '500',
                }}
              >
                Shift Type
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {shiftTypes.map(type => (
                  <TouchableOpacity
                    key={type.value}
                    style={{
                      backgroundColor:
                        jobPost.shiftType === type.value
                          ? COLORS.green
                          : '#F8F9FA',
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      marginRight: 8,
                      borderWidth: 2,
                      borderColor:
                        jobPost.shiftType === type.value
                          ? COLORS.green
                          : '#E9ECEF',
                    }}
                    onPress={() =>
                      setJobPost({ ...jobPost, shiftType: type.value })
                    }
                  >
                    <Text
                      style={{
                        color:
                          jobPost.shiftType === type.value
                            ? COLORS.white
                            : COLORS.black,
                        fontSize: 14,
                        fontWeight: '600',
                      }}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.gray,
                  marginBottom: 12,
                  fontWeight: '500',
                }}
              >
                Experience Level
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {experienceLevels.map(level => (
                  <TouchableOpacity
                    key={level.value}
                    style={{
                      backgroundColor:
                        jobPost.experienceLevel === level.value
                          ? COLORS.green
                          : '#F8F9FA',
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      marginRight: 8,
                      borderWidth: 2,
                      borderColor:
                        jobPost.experienceLevel === level.value
                          ? COLORS.green
                          : '#E9ECEF',
                    }}
                    onPress={() =>
                      setJobPost({ ...jobPost, experienceLevel: level.value })
                    }
                  >
                    <Text
                      style={{
                        color:
                          jobPost.experienceLevel === level.value
                            ? COLORS.white
                            : COLORS.black,
                        fontSize: 14,
                        fontWeight: '600',
                      }}
                    >
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.gray,
                  marginBottom: 12,
                  fontWeight: '500',
                }}
              >
                Education Level
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {educationLevels.map(level => (
                  <TouchableOpacity
                    key={level.value}
                    style={{
                      backgroundColor:
                        jobPost.educationLevel === level.value
                          ? COLORS.green
                          : '#F8F9FA',
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      marginRight: 8,
                      borderWidth: 2,
                      borderColor:
                        jobPost.educationLevel === level.value
                          ? COLORS.green
                          : '#E9ECEF',
                    }}
                    onPress={() =>
                      setJobPost({ ...jobPost, educationLevel: level.value })
                    }
                  >
                    <Text
                      style={{
                        color:
                          jobPost.educationLevel === level.value
                            ? COLORS.white
                            : COLORS.black,
                        fontSize: 14,
                        fontWeight: '600',
                      }}
                    >
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Skills */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                marginBottom: 16,
                color: COLORS.black,
              }}
            >
              Skills
            </Text>
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              <TouchableOpacity
                onPress={() => setAiAutocompleteProvider('openai')}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: COLORS.lightGray,
                  backgroundColor:
                    aiAutocompleteProvider === 'openai'
                      ? COLORS.blue
                      : COLORS.white,
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    color:
                      aiAutocompleteProvider === 'openai'
                        ? COLORS.white
                        : COLORS.black,
                    fontWeight: '600',
                    fontSize: 12,
                  }}
                >
                  OpenAI
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAiAutocompleteProvider('claude')}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: COLORS.lightGray,
                  backgroundColor:
                    aiAutocompleteProvider === 'claude'
                      ? COLORS.blue
                      : COLORS.white,
                }}
              >
                <Text
                  style={{
                    color:
                      aiAutocompleteProvider === 'claude'
                        ? COLORS.white
                        : COLORS.black,
                    fontWeight: '600',
                    fontSize: 12,
                  }}
                >
                  Claude
                </Text>
              </TouchableOpacity>
            </View>

            {/* Required Skills */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}
              >
                Required Skills * ({jobPost.requiredSkills.length})
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
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
                  onChangeText={handleRequiredSkillInputChange}
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
              {loadingRequiredSuggestions ? (
                <Text
                  style={{ fontSize: 12, color: COLORS.gray, marginBottom: 8 }}
                >
                  Getting suggestions...
                </Text>
              ) : null}
              {requiredSkillSuggestions.length > 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    marginBottom: 8,
                  }}
                >
                  {requiredSkillSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={`${suggestion}-${index}`}
                      onPress={() => {
                        setNewSkill(suggestion);
                        setRequiredSkillSuggestions([]);
                      }}
                      style={{
                        backgroundColor: '#E0F2FE',
                        borderRadius: 14,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        marginRight: 8,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: '#BAE6FD',
                      }}
                    >
                      <Text
                        style={{
                          color: '#075985',
                          fontSize: 12,
                          fontWeight: '600',
                        }}
                      >
                        {suggestion}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              <TouchableOpacity
                onPress={openSuggestSkillsProviderPicker}
                disabled={aiSuggestingSkills || !jobPost.description.trim()}
                style={{
                  backgroundColor: COLORS.orange,
                  borderRadius: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  alignSelf: 'flex-start',
                  marginBottom: 8,
                  opacity:
                    aiSuggestingSkills || !jobPost.description.trim() ? 0.7 : 1,
                }}
              >
                <Text
                  style={{
                    color: COLORS.white,
                    fontWeight: '600',
                    fontSize: 13,
                  }}
                >
                  {aiSuggestingSkills
                    ? 'Extracting...'
                    : 'Suggest Skills with AI'}
                </Text>
              </TouchableOpacity>

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
                    <Text
                      style={{
                        fontSize: 14,
                        color: COLORS.white,
                        fontWeight: '500',
                        marginRight: 4,
                      }}
                    >
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
              <Text
                style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}
              >
                Preferred Skills ({jobPost.preferredSkills.length})
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
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
                  onChangeText={handlePreferredSkillInputChange}
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
              {loadingPreferredSuggestions ? (
                <Text
                  style={{ fontSize: 12, color: COLORS.gray, marginBottom: 8 }}
                >
                  Getting suggestions...
                </Text>
              ) : null}
              {preferredSkillSuggestions.length > 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    marginBottom: 8,
                  }}
                >
                  {preferredSkillSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={`${suggestion}-${index}`}
                      onPress={() => {
                        setNewPreferredSkill(suggestion);
                        setPreferredSkillSuggestions([]);
                      }}
                      style={{
                        backgroundColor: '#EFF6FF',
                        borderRadius: 14,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        marginRight: 8,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: '#BFDBFE',
                      }}
                    >
                      <Text
                        style={{
                          color: '#1D4ED8',
                          fontSize: 12,
                          fontWeight: '600',
                        }}
                      >
                        {suggestion}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

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
                    <Text
                      style={{
                        fontSize: 14,
                        color: COLORS.white,
                        fontWeight: '500',
                        marginRight: 4,
                      }}
                    >
                      {skill}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removePreferredSkill(skill)}
                    >
                      <X size={14} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Salary */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                marginBottom: 16,
                color: COLORS.black,
              }}
            >
              Salary Range
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <DollarSign
                size={20}
                color={COLORS.gray}
                style={{ marginRight: 8 }}
              />
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
                onChangeText={text =>
                  setJobPost({
                    ...jobPost,
                    salaryRange: {
                      ...jobPost.salaryRange,
                      min: parseInt(text) || 0,
                    },
                  })
                }
                placeholder="Min"
                keyboardType="numeric"
              />
              <Text
                style={{
                  fontSize: 16,
                  color: COLORS.black,
                  marginHorizontal: 8,
                }}
              >
                to
              </Text>
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
                onChangeText={text =>
                  setJobPost({
                    ...jobPost,
                    salaryRange: {
                      ...jobPost.salaryRange,
                      max: parseInt(text) || 0,
                    },
                  })
                }
                placeholder="Max"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Fair Chance Hiring */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Users
                size={20}
                color={COLORS.green}
                style={{ marginRight: 8 }}
              />
              <Text
                style={{ fontSize: 18, fontWeight: '600', color: COLORS.black }}
              >
                Fair Chance Hiring
              </Text>
            </View>

            <View
              style={{
                backgroundColor: '#F0F9FF',
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 12, color: COLORS.blue }}>
                These settings will be displayed to candidates and show your
                commitment to fair chance hiring practices.
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, color: COLORS.black }}>
                  Ban-the-Box Compliant
                </Text>
                <Switch
                  value={jobPost.fairChanceHiring.banTheBoxCompliant}
                  onValueChange={value =>
                    setJobPost({
                      ...jobPost,
                      fairChanceHiring: {
                        ...jobPost.fairChanceHiring,
                        banTheBoxCompliant: value,
                      },
                    })
                  }
                  trackColor={{ false: COLORS.border, true: COLORS.green }}
                  thumbColor={COLORS.white}
                />
              </View>
            </View>

            <View style={{ marginBottom: 12 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, color: COLORS.black }}>
                  Case-by-Case Review
                </Text>
                <Switch
                  value={jobPost.fairChanceHiring.caseByCaseReview}
                  onValueChange={value =>
                    setJobPost({
                      ...jobPost,
                      fairChanceHiring: {
                        ...jobPost.fairChanceHiring,
                        caseByCaseReview: value,
                      },
                    })
                  }
                  trackColor={{ false: COLORS.border, true: COLORS.green }}
                  thumbColor={COLORS.white}
                />
              </View>
            </View>

            <View style={{ marginBottom: 12 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, color: COLORS.black }}>
                  No Background Check Required
                </Text>
                <Switch
                  value={jobPost.fairChanceHiring.noBackgroundCheck}
                  onValueChange={value =>
                    setJobPost({
                      ...jobPost,
                      fairChanceHiring: {
                        ...jobPost.fairChanceHiring,
                        noBackgroundCheck: value,
                      },
                    })
                  }
                  trackColor={{ false: COLORS.border, true: COLORS.green }}
                  thumbColor={COLORS.white}
                />
              </View>
            </View>
          </View>

          {/* Background Check */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <AlertCircle
                size={20}
                color={COLORS.orange}
                style={{ marginRight: 8 }}
              />
              <Text
                style={{ fontSize: 18, fontWeight: '600', color: COLORS.black }}
              >
                Background Check
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, color: COLORS.black }}>
                Background Check Required
              </Text>
              <Switch
                value={jobPost.backgroundCheckRequired}
                onValueChange={value =>
                  setJobPost({ ...jobPost, backgroundCheckRequired: value })
                }
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
            <View
              style={{
                backgroundColor: '#FEF3C7',
                borderRadius: 12,
                padding: 16,
                marginBottom: 32,
                flexDirection: 'row',
                alignItems: 'center',
                borderLeftWidth: 4,
                borderLeftColor: COLORS.orange,
              }}
            >
              <CreditCard
                size={24}
                color={COLORS.orange}
                style={{ marginRight: 12 }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: COLORS.black,
                    marginBottom: 4,
                  }}
                >
                  Payment Required
                </Text>
                <Text
                  style={{ fontSize: 14, color: COLORS.gray, lineHeight: 20 }}
                >
                  A payment of ${paymentAmount} is required to post this job.
                  You'll be prompted to complete payment after posting.
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
