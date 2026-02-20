import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import AppButton from '../../../components/ui/AppButton';
import { JobService } from '../../../services/job.service';
import { COLORS } from '../../../constants/core/colors';
import { showError, showSuccess } from '../../../utils/toast';
import { Plus, X, ChevronDown } from 'lucide-react-native';
import { postJobScreenStyles } from '../../../constants/styles/postJobScreenStyles';
import { getCurrencyByCode, getCurrenciesArray } from '../../../constants/data/currencies';
import { AIProvider, AIService } from '../../../services/ai.service';

const PostJobScreen = ({ navigation }: any) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState<
    'full-time' | 'part-time' | 'contract' | 'internship'
  >('full-time');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [experienceRequired, setExperienceRequired] = useState('');
  const [educationRequired, setEducationRequired] = useState('');
  const [posting, setPosting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [, setTouched] = useState<{[key: string]: boolean}>({});
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiImproving, setAiImproving] = useState(false);
  const [aiExtractingSkills, setAiExtractingSkills] = useState(false);
  const [aiOptimizing, setAiOptimizing] = useState(false);
  const [optimizerResult, setOptimizerResult] = useState<{
    missing_required_skills?: string[];
    unrealistic_requirements?: string[];
    fair_chance_language?: string[];
    salary_range_suggestion?: {
      min?: number;
      max?: number;
      currency?: string;
      rationale?: string;
    };
    optimization_notes?: string[];
  } | null>(null);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [loadingSkillSuggestions, setLoadingSkillSuggestions] = useState(false);
  const skillDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Validation functions
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'title':
        if (!value || value.trim() === '') return 'Job title is required';
        if (value.trim().length < 3) return 'Job title must be at least 3 characters';
        if (value.trim().length > 200) return 'Job title must be less than 200 characters';
        return '';
      
      case 'description':
        if (!value || value.trim() === '') return 'Job description is required';
        if (value.trim().length < 10) return 'Job description must be at least 10 characters';
        if (value.trim().length > 5000) return 'Job description must be less than 5000 characters';
        return '';
      
      case 'company':
        if (!value || value.trim() === '') return 'Company name is required';
        if (value.trim().length < 1) return 'Company name must be at least 1 character';
        if (value.trim().length > 200) return 'Company name must be less than 200 characters';
        return '';
      
      case 'location':
        if (!value || value.trim() === '') return 'Location is required';
        if (value.trim().length < 1) return 'Location must be at least 1 character';
        if (value.trim().length > 200) return 'Location must be less than 200 characters';
        return '';
      
      case 'requiredSkills':
        if (!value || value.length === 0) return 'At least one required skill is needed';
        return '';
      
      case 'minSalary':
        if (value && (isNaN(value) || parseFloat(value) < 0)) return 'Invalid minimum salary';
        if (minSalary && maxSalary && parseFloat(value) > parseFloat(maxSalary)) {
          return 'Minimum salary cannot be greater than maximum';
        }
        return '';
      
      case 'maxSalary':
        if (value && (isNaN(value) || parseFloat(value) < 0)) return 'Invalid maximum salary';
        if (minSalary && value && parseFloat(minSalary) > parseFloat(value)) {
          return 'Maximum salary must be greater than minimum';
        }
        return '';
      
      default:
        return '';
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Update field value
    switch (field) {
      case 'title': setTitle(value); break;
      case 'description': setDescription(value); break;
      case 'company': setCompany(value); break;
      case 'location': setLocation(value); break;
      case 'minSalary': setMinSalary(value); break;
      case 'maxSalary': setMaxSalary(value); break;
    }
  };

  const handleFieldBlur = (field: string, value: string) => {
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    newErrors.title = validateField('title', title);
    newErrors.description = validateField('description', description);
    newErrors.company = validateField('company', company);
    newErrors.location = validateField('location', location);
    newErrors.requiredSkills = validateField('requiredSkills', requiredSkills);
    newErrors.minSalary = validateField('minSalary', minSalary);
    newErrors.maxSalary = validateField('maxSalary', maxSalary);
    
    setErrors(newErrors);
    
    return Object.values(newErrors).every(error => error === '');
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setRequiredSkills([...requiredSkills, newSkill.trim()]);
      setNewSkill('');
      setSkillSuggestions([]);
    }
  };

  const handleRemoveSkill = (index: number) => {
    setRequiredSkills(requiredSkills.filter((_, i) => i !== index));
  };

  useEffect(() => {
    return () => {
      if (skillDebounceRef.current) clearTimeout(skillDebounceRef.current);
    };
  }, []);

  const openProviderPicker = (
    action: string,
    onSelect: (provider: AIProvider) => void
  ) => {
    Alert.alert(action, 'Choose AI provider', [
      { text: 'OpenAI', onPress: () => onSelect('openai') },
      { text: 'Claude', onPress: () => onSelect('claude') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleGenerateDescription = async (provider: AIProvider) => {
    if (!title.trim()) {
      showError('Add a job title before generating description');
      return;
    }

    try {
      setAiGenerating(true);
      const result = await AIService.generateJobPost({
        provider,
        role_title: title.trim(),
        company_name: company.trim() || 'Your Company',
        location: location.trim() || 'Remote',
        job_type: jobType,
        experience_level:
          !experienceRequired || Number(experienceRequired) <= 1
            ? 'junior'
            : Number(experienceRequired) <= 4
              ? 'mid'
              : 'senior',
        required_skills: requiredSkills.length ? requiredSkills : ['Communication'],
        salary_range:
          minSalary && maxSalary ? `${minSalary}-${maxSalary} ${currency}` : undefined,
        tone: 'professional',
      });

      if (result?.job_post) {
        setDescription(result.job_post);
        showSuccess('Job description generated');
      } else {
        showError('AI returned empty job description');
      }
    } catch (error: any) {
      showError(error?.response?.data?.detail || error?.message || 'Failed to generate description');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleImproveDescription = async (provider: AIProvider, type: string) => {
    if (!description.trim()) {
      showError('Add description before improving with AI');
      return;
    }

    try {
      setAiImproving(true);
      const result = await AIService.improveJobPost({
        provider,
        existing_post: description.trim(),
        improvement_type: type,
      });
      if (result?.improved_post) {
        setDescription(result.improved_post);
        showSuccess('Job description improved');
      } else {
        showError('AI returned empty improved description');
      }
    } catch (error: any) {
      showError(error?.response?.data?.detail || error?.message || 'Failed to improve description');
    } finally {
      setAiImproving(false);
    }
  };

  const openImproveTypePicker = () => {
    Alert.alert('Improve Description', 'Select improvement type', [
      {
        text: 'Clarity',
        onPress: () =>
          openProviderPicker('Choose Provider', provider => handleImproveDescription(provider, 'clarity')),
      },
      {
        text: 'Tone',
        onPress: () =>
          openProviderPicker('Choose Provider', provider => handleImproveDescription(provider, 'tone')),
      },
      {
        text: 'Inclusivity',
        onPress: () =>
          openProviderPicker('Choose Provider', provider => handleImproveDescription(provider, 'inclusivity')),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const parsePossibleJSON = (text: string) => {
    const cleaned = text
      .trim()
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleaned);
  };

  const handleOptimizeJobPost = async (provider: AIProvider) => {
    if (!title.trim() || !description.trim()) {
      showError('Add title and description before running optimizer');
      return;
    }

    try {
      setAiOptimizing(true);
      const result = await AIService.generateGeneric({
        provider,
        json_mode: true,
        max_tokens: 900,
        system_prompt:
          'You are a senior talent acquisition strategist optimizing job posts for hiring outcomes. Return JSON only.',
        user_prompt: `Optimize this job post and return actionable recommendations.
Return JSON exactly in this shape:
{
  "missing_required_skills": ["..."],
  "unrealistic_requirements": ["..."],
  "fair_chance_language": ["..."],
  "salary_range_suggestion": {"min": 0, "max": 0, "currency": "USD", "rationale": "..."},
  "optimization_notes": ["..."]
}

Job:
${JSON.stringify({
  title: title.trim(),
  company: company.trim(),
  location: location.trim(),
  job_type: jobType,
  description: description.trim(),
  required_skills: requiredSkills,
  salary_min: minSalary || null,
  salary_max: maxSalary || null,
  currency,
  experience_required: experienceRequired || null,
  education_required: educationRequired || null,
})}`,
      });

      const parsed = parsePossibleJSON(result?.output || '{}');
      setOptimizerResult(parsed || null);
      showSuccess('AI optimizer insights generated');
    } catch (error: any) {
      if (__DEV__) {
        console.error('Job optimizer failed:', error);
      }
      showError(
        error?.response?.data?.detail ||
          error?.message ||
          'Failed to optimize job post',
      );
    } finally {
      setAiOptimizing(false);
    }
  };

  const handleExtractSkills = async (provider: AIProvider) => {
    if (!description.trim()) {
      showError('Add description before extracting skills');
      return;
    }

    try {
      setAiExtractingSkills(true);
      const result = await AIService.extractJobSkills({
        provider,
        job_description: description.trim(),
      });
      const suggested = Array.isArray(result?.required_skills) ? result.required_skills : [];
      const merged = Array.from(new Set([...requiredSkills, ...suggested].map(s => s.trim()).filter(Boolean)));
      setRequiredSkills(merged);
      showSuccess('Skills extracted from description');
    } catch (error: any) {
      showError(error?.response?.data?.detail || error?.message || 'Failed to extract skills');
    } finally {
      setAiExtractingSkills(false);
    }
  };

  const fetchSkillSuggestions = async (text: string) => {
    const query = text.trim();
    if (query.length < 2) {
      setSkillSuggestions([]);
      return;
    }

    try {
      setLoadingSkillSuggestions(true);
      const result = await AIService.autocomplete({
        field_type: 'skill',
        partial_text: query,
        context: { title: title || 'general' },
        max_suggestions: 4,
      });
      const suggestions = Array.isArray(result?.suggestions) ? result.suggestions : [];
      const filtered = suggestions.filter(
        (s: string) => !requiredSkills.some(existing => existing.toLowerCase() === s.toLowerCase())
      );
      setSkillSuggestions(filtered);
    } catch {
      setSkillSuggestions([]);
    } finally {
      setLoadingSkillSuggestions(false);
    }
  };

  const handleSkillInputChange = (value: string) => {
    setNewSkill(value);
    if (skillDebounceRef.current) clearTimeout(skillDebounceRef.current);
    skillDebounceRef.current = setTimeout(() => {
      fetchSkillSuggestions(value);
    }, 350);
  };

  
  const getSelectedCurrency = () => {
    return getCurrencyByCode(currency) || getCurrencyByCode('USD') || getCurrenciesArray()[0];
  };

  const handlePostJob = async () => {
    // Validate all fields
    if (!validateForm()) {
      showError('Please fix the errors in the form');
      return;
    }

    // Prepare job data outside try-catch to make it accessible in catch block
    const jobData: any = {
      title: title.trim(),
      description: description.trim(),
      company: company.trim(),
      location: location.trim(),
      jobType,
      requiredSkills,
      status: 'active',
    };

    if (minSalary && maxSalary) {
      jobData.salaryRange = {
        min: parseFloat(minSalary),
        max: parseFloat(maxSalary),
        currency: currency,
      };
    }

    if (experienceRequired) {
      jobData.experienceRequired = parseInt(experienceRequired, 10);
    }

    if (educationRequired.trim()) {
      jobData.educationRequired = educationRequired.trim();
    }

    try {
      setPosting(true);

      await JobService.createJob(jobData);
      showSuccess('Job posted successfully');
      navigation.goBack();
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error posting job:', error)
      };
      
      // Handle payment required error
      if (error.response?.status === 402) {
        const paymentData = error.response.data;
        Alert.alert(
          'Payment Required',
          paymentData.message || 'Payment is required to post this job',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Pay Now',
              onPress: () => {
                navigation.navigate('JobPostingPayment', {
                  jobData,
                  returnScreen: 'RecruiterPostJob'
                });
              },
            },
          ]
        );
      } else {
        showError(error.message || 'Failed to post job');
      }
    } finally {
      setPosting(false);
    }
  };

  const jobTypes = ['full-time', 'part-time', 'contract', 'internship'];

  return (
    <SafeAreaView style={postJobScreenStyles.container}>
      <ScreenHeader
        title="Post a Job"
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAwareScrollView
        style={postJobScreenStyles.scrollView}
        contentContainerStyle={postJobScreenStyles.scrollContent}
        enableOnAndroid
        extraScrollHeight={100}
      >
        <Text style={postJobScreenStyles.label}>Job Title *</Text>
        <TextInput
          style={[
            postJobScreenStyles.input,
            errors.title && postJobScreenStyles.inputError
          ]}
          placeholder="Enter job title (minimum 3 characters)"
          placeholderTextColor={COLORS.lightGray}
          value={title}
          onChangeText={(value) => handleFieldChange('title', value)}
          onBlur={() => handleFieldBlur('title', title)}
          maxLength={200}
        />
        <Text style={postJobScreenStyles.characterCount}>
          {title.length}/200 characters
        </Text>
        {errors.title && (
          <Text style={postJobScreenStyles.errorText}>{errors.title}</Text>
        )}

        <Text style={postJobScreenStyles.label}>Company Name *</Text>
        <TextInput
          style={[
            postJobScreenStyles.input,
            errors.company && postJobScreenStyles.inputError
          ]}
          placeholder="Enter company name"
          placeholderTextColor={COLORS.lightGray}
          value={company}
          onChangeText={(value) => handleFieldChange('company', value)}
          onBlur={() => handleFieldBlur('company', company)}
          maxLength={200}
        />
        {errors.company && (
          <Text style={postJobScreenStyles.errorText}>{errors.company}</Text>
        )}

        <Text style={postJobScreenStyles.label}>Location *</Text>
        <TextInput
          style={[
            postJobScreenStyles.input,
            errors.location && postJobScreenStyles.inputError
          ]}
          placeholder="Enter location"
          placeholderTextColor={COLORS.lightGray}
          value={location}
          onChangeText={(value) => handleFieldChange('location', value)}
          onBlur={() => handleFieldBlur('location', location)}
          maxLength={200}
        />
        {errors.location && (
          <Text style={postJobScreenStyles.errorText}>{errors.location}</Text>
        )}

        <Text style={postJobScreenStyles.label}>Job Type *</Text>
        <View style={postJobScreenStyles.jobTypeContainer}>
          {jobTypes.map(type => (
            <TouchableOpacity
              key={type}
              onPress={() => setJobType(type as any)}
              style={[
                postJobScreenStyles.jobTypeButton,
                jobType === type && postJobScreenStyles.jobTypeButtonActive,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  postJobScreenStyles.jobTypeText,
                  jobType === type && postJobScreenStyles.jobTypeTextActive,
                ]}
              >
                {type.replace('-', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={postJobScreenStyles.label}>Job Description *</Text>
        <TextInput
          style={[
            postJobScreenStyles.input, 
            postJobScreenStyles.textArea,
            errors.description && postJobScreenStyles.inputError
          ]}
          placeholder="Enter job description (minimum 10 characters)"
          placeholderTextColor={COLORS.lightGray}
          value={description}
          onChangeText={(value) => handleFieldChange('description', value)}
          onBlur={() => handleFieldBlur('description', description)}
          multiline
          maxLength={5000}
        />
        <View style={{ flexDirection: 'row', marginTop: 8, marginBottom: 8, gap: 8 }}>
          <TouchableOpacity
            onPress={() => openProviderPicker('Generate Description', handleGenerateDescription)}
            disabled={aiGenerating || aiImproving}
            style={{
              backgroundColor: COLORS.blue,
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              opacity: aiGenerating || aiImproving ? 0.7 : 1,
            }}
          >
            <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 13 }}>
              {aiGenerating ? 'Generating...' : 'Generate with AI'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openImproveTypePicker}
            disabled={aiGenerating || aiImproving}
            style={{
              backgroundColor: COLORS.green,
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              opacity: aiGenerating || aiImproving ? 0.7 : 1,
            }}
          >
            <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 13 }}>
              {aiImproving ? 'Improving...' : 'Improve with AI'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              openProviderPicker('Optimize Job Post', handleOptimizeJobPost)
            }
            disabled={aiGenerating || aiImproving || aiOptimizing}
            style={{
              backgroundColor: '#0B6B57',
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              opacity: aiGenerating || aiImproving || aiOptimizing ? 0.7 : 1,
            }}
          >
            <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 13 }}>
              {aiOptimizing ? 'Optimizing...' : 'Optimize with AI'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={postJobScreenStyles.characterCount}>
          {description.length}/5000 characters
        </Text>
        {errors.description && (
          <Text style={postJobScreenStyles.errorText}>{errors.description}</Text>
        )}
        {optimizerResult ? (
          <View
            style={{
              backgroundColor: '#F3F8FF',
              borderColor: '#C9DFFF',
              borderWidth: 1,
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontWeight: '700', color: '#16406F', marginBottom: 8 }}>
              AI Job Post Optimizer
            </Text>
            {optimizerResult.missing_required_skills?.length ? (
              <Text style={{ fontSize: 12, color: COLORS.black, marginBottom: 6 }}>
                Missing skills: {optimizerResult.missing_required_skills.join(', ')}
              </Text>
            ) : null}
            {optimizerResult.unrealistic_requirements?.length ? (
              <Text style={{ fontSize: 12, color: COLORS.black, marginBottom: 6 }}>
                Unrealistic requirements:{' '}
                {optimizerResult.unrealistic_requirements.join(', ')}
              </Text>
            ) : null}
            {optimizerResult.fair_chance_language?.length ? (
              <Text style={{ fontSize: 12, color: COLORS.black, marginBottom: 6 }}>
                Fair-chance language:{' '}
                {optimizerResult.fair_chance_language.join(' ')}
              </Text>
            ) : null}
            {optimizerResult.salary_range_suggestion ? (
              <Text style={{ fontSize: 12, color: COLORS.black, marginBottom: 6 }}>
                Salary suggestion:{' '}
                {optimizerResult.salary_range_suggestion.min ?? 'N/A'} -{' '}
                {optimizerResult.salary_range_suggestion.max ?? 'N/A'}{' '}
                {optimizerResult.salary_range_suggestion.currency || currency}
              </Text>
            ) : null}
            {optimizerResult.optimization_notes?.length ? (
              <Text style={{ fontSize: 12, color: COLORS.black, marginBottom: 10 }}>
                Notes: {optimizerResult.optimization_notes.join(' | ')}
              </Text>
            ) : null}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  const toAdd = Array.isArray(optimizerResult?.missing_required_skills)
                    ? optimizerResult.missing_required_skills
                    : [];
                  const merged = Array.from(
                    new Set([...requiredSkills, ...toAdd].map(s => s.trim()).filter(Boolean)),
                  );
                  setRequiredSkills(merged);
                  showSuccess('Suggested missing skills applied');
                }}
                style={{
                  backgroundColor: COLORS.green,
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                }}
              >
                <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '700' }}>
                  Apply Skills
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const fairChanceLine = Array.isArray(
                    optimizerResult?.fair_chance_language,
                  )
                    ? optimizerResult.fair_chance_language.join(' ')
                    : '';
                  if (!fairChanceLine.trim()) return;
                  if (!description.includes(fairChanceLine)) {
                    setDescription(prev => `${prev.trim()}\n\n${fairChanceLine}`.trim());
                    showSuccess('Fair-chance language appended');
                  }
                }}
                style={{
                  backgroundColor: '#4A6FA5',
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                }}
              >
                <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '700' }}>
                  Apply Fair-Chance
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const suggested = optimizerResult?.salary_range_suggestion;
                  if (!suggested) return;
                  if (suggested.min) setMinSalary(String(suggested.min));
                  if (suggested.max) setMaxSalary(String(suggested.max));
                  if (suggested.currency) setCurrency(suggested.currency);
                  showSuccess('Salary suggestion applied');
                }}
                style={{
                  backgroundColor: '#7D5BA6',
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                }}
              >
                <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '700' }}>
                  Apply Salary
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <Text style={postJobScreenStyles.label}>Required Skills *</Text>
        <View style={postJobScreenStyles.addSkillContainer}>
          <TextInput
            style={postJobScreenStyles.addSkillInput}
            placeholder="Enter skill"
            placeholderTextColor={COLORS.lightGray}
            value={newSkill}
            onChangeText={handleSkillInputChange}
            onSubmitEditing={handleAddSkill}
          />
          <TouchableOpacity
            onPress={handleAddSkill}
            style={postJobScreenStyles.addButton}
            activeOpacity={0.7}
          >
            <Plus size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        {loadingSkillSuggestions ? (
          <Text style={{ color: COLORS.gray, fontSize: 12, marginBottom: 8 }}>
            Getting suggestions...
          </Text>
        ) : null}
        {skillSuggestions.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
            {skillSuggestions.map((suggestion, idx) => (
              <TouchableOpacity
                key={`${suggestion}-${idx}`}
                onPress={() => {
                  setNewSkill(suggestion);
                  setSkillSuggestions([]);
                }}
                style={{
                  backgroundColor: '#E8F5E9',
                  borderRadius: 12,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: '#1B5E20', fontSize: 12, fontWeight: '600' }}>
                  {suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <TouchableOpacity
          onPress={() => openProviderPicker('Extract Skills', handleExtractSkills)}
          disabled={aiExtractingSkills || !description.trim()}
          style={{
            backgroundColor: COLORS.orange,
            borderRadius: 8,
            paddingVertical: 8,
            paddingHorizontal: 12,
            alignSelf: 'flex-start',
            marginBottom: 8,
            opacity: aiExtractingSkills || !description.trim() ? 0.7 : 1,
          }}
        >
          <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 13 }}>
            {aiExtractingSkills ? 'Extracting...' : 'Suggest Skills with AI'}
          </Text>
        </TouchableOpacity>

        {requiredSkills.length > 0 && (
          <View style={postJobScreenStyles.skillsContainer}>
            {requiredSkills.map((skill, index) => (
              <View key={index} style={postJobScreenStyles.skillTag}>
                <Text style={postJobScreenStyles.skillText}>{skill}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveSkill(index)}
                  style={postJobScreenStyles.removeSkillButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {errors.requiredSkills && (
          <Text style={postJobScreenStyles.errorText}>{errors.requiredSkills}</Text>
        )}

        <Text style={postJobScreenStyles.label}>Salary Range (optional)</Text>
        <View style={postJobScreenStyles.salaryRowContainer}>
          <TouchableOpacity
            style={postJobScreenStyles.currencySelectorButton}
            onPress={() => setShowCurrencyPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={postJobScreenStyles.currencySelectorText}>
              {currency}
            </Text>
            <ChevronDown size={18} color={COLORS.gray} />
          </TouchableOpacity>
          <View style={postJobScreenStyles.salaryInputWrapper}>
            <Text style={postJobScreenStyles.currencyPrefix}>
              {getSelectedCurrency()?.symbol_native || getSelectedCurrency()?.symbol || '$'}
            </Text>
            <TextInput
              style={[
                postJobScreenStyles.input,
                postJobScreenStyles.salaryInput,
                errors.minSalary && postJobScreenStyles.inputError
              ]}
              placeholder="Enter min salary"
              placeholderTextColor={COLORS.lightGray}
              value={minSalary}
              onChangeText={(value) => handleFieldChange('minSalary', value)}
              onBlur={() => handleFieldBlur('minSalary', minSalary)}
              keyboardType="numeric"
            />
            {errors.minSalary && (
              <Text style={postJobScreenStyles.errorText}>{errors.minSalary}</Text>
            )}
          </View>
          <View style={postJobScreenStyles.salaryInputWrapper}>
            <Text style={postJobScreenStyles.currencyPrefix}>
              {getSelectedCurrency()?.symbol_native || getSelectedCurrency()?.symbol || '$'}
            </Text>
            <TextInput
              style={[
                postJobScreenStyles.input,
                postJobScreenStyles.salaryInput,
                errors.maxSalary && postJobScreenStyles.inputError
              ]}
              placeholder="Enter max salary"
              placeholderTextColor={COLORS.lightGray}
              value={maxSalary}
              onChangeText={(value) => handleFieldChange('maxSalary', value)}
              onBlur={() => handleFieldBlur('maxSalary', maxSalary)}
              keyboardType="numeric"
            />
            {errors.maxSalary && (
              <Text style={postJobScreenStyles.errorText}>{errors.maxSalary}</Text>
            )}
          </View>
        </View>

        <Text style={postJobScreenStyles.label}>
          Years of Experience (optional)
        </Text>
        <TextInput
          style={postJobScreenStyles.input}
          placeholder="Enter years of experience"
          placeholderTextColor={COLORS.lightGray}
          value={experienceRequired}
          onChangeText={setExperienceRequired}
          keyboardType="numeric"
        />

        <Text style={postJobScreenStyles.label}>
          Education Required (optional)
        </Text>
        <TextInput
          style={postJobScreenStyles.input}
          placeholder="Enter education required"
          placeholderTextColor={COLORS.lightGray}
          value={educationRequired}
          onChangeText={setEducationRequired}
        />

        <AppButton
          title={posting ? 'Posting...' : 'Post Job'}
          onPress={handlePostJob}
          disabled={posting}
          loading={posting}
          style={postJobScreenStyles.submitButton}
        />
      </KeyboardAwareScrollView>

      {/* Currency Picker Modal */}
      <Modal
        visible={showCurrencyPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyPicker(false)}
      >
        <Pressable
          style={postJobScreenStyles.modalOverlay}
          onPress={() => setShowCurrencyPicker(false)}
        >
          <Pressable 
            style={postJobScreenStyles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={postJobScreenStyles.modalHeader}>
              <Text style={postJobScreenStyles.modalTitle}>
                Select Currency
              </Text>
              <TouchableOpacity
                onPress={() => setShowCurrencyPicker(false)}
                activeOpacity={0.7}
              >
                <X size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={postJobScreenStyles.currencyList}
              showsVerticalScrollIndicator={false}
            >
              {getCurrenciesArray().map(curr => (
                <TouchableOpacity
                  key={curr.code}
                  style={[
                    postJobScreenStyles.currencyOption,
                    currency === curr.code &&
                      postJobScreenStyles.currencyOptionActive,
                  ]}
                  onPress={() => {
                    setCurrency(curr.code);
                    setShowCurrencyPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={postJobScreenStyles.currencyOptionLeft}>
                    <Text style={postJobScreenStyles.currencyOptionCode}>
                      {curr.code}
                    </Text>
                    <Text style={postJobScreenStyles.currencyOptionSymbol}>
                      {curr.symbol_native || curr.symbol}
                    </Text>
                    <Text style={postJobScreenStyles.currencyOptionName}>
                      {curr.name}
                    </Text>
                  </View>
                  {currency === curr.code && (
                    <Text style={postJobScreenStyles.currencyCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default PostJobScreen;
