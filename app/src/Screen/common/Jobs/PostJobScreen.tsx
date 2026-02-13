import React, { useState } from 'react';
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

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setRequiredSkills([...requiredSkills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setRequiredSkills(requiredSkills.filter((_, i) => i !== index));
  };

  // Only allow numbers in salary inputs
  const handleSalaryChange = (value: string, setter: (val: string) => void) => {
    // Remove any non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    setter(numericValue);
  };

  const getSelectedCurrency = () => {
    return getCurrencyByCode(currency) || getCurrencyByCode('USD') || getCurrenciesArray()[0];
  };

  const handlePostJob = async () => {
    if (
      !title.trim() ||
      !description.trim() ||
      !company.trim() ||
      !location.trim()
    ) {
      showError('Please fill in all required fields');
      return;
    }

    if (requiredSkills.length === 0) {
      showError('Please add at least one required skill');
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
          style={postJobScreenStyles.input}
          placeholder="Enter job title"
          placeholderTextColor={COLORS.lightGray}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={postJobScreenStyles.label}>Company Name *</Text>
        <TextInput
          style={postJobScreenStyles.input}
          placeholder="Enter company name"
          placeholderTextColor={COLORS.lightGray}
          value={company}
          onChangeText={setCompany}
        />

        <Text style={postJobScreenStyles.label}>Location *</Text>
        <TextInput
          style={postJobScreenStyles.input}
          placeholder="Enter location"
          placeholderTextColor={COLORS.lightGray}
          value={location}
          onChangeText={setLocation}
        />

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
          style={[postJobScreenStyles.input, postJobScreenStyles.textArea]}
          placeholder="Enter job description"
          placeholderTextColor={COLORS.lightGray}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={postJobScreenStyles.label}>Required Skills *</Text>
        <View style={postJobScreenStyles.addSkillContainer}>
          <TextInput
            style={postJobScreenStyles.addSkillInput}
            placeholder="Enter skill"
            placeholderTextColor={COLORS.lightGray}
            value={newSkill}
            onChangeText={setNewSkill}
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
              ]}
              placeholder="Enter min salary"
              placeholderTextColor={COLORS.lightGray}
              value={minSalary}
              onChangeText={value => handleSalaryChange(value, setMinSalary)}
              keyboardType="numeric"
            />
          </View>
          <View style={postJobScreenStyles.salaryInputWrapper}>
            <Text style={postJobScreenStyles.currencyPrefix}>
              {getSelectedCurrency()?.symbol_native || getSelectedCurrency()?.symbol || '$'}
            </Text>
            <TextInput
              style={[
                postJobScreenStyles.input,
                postJobScreenStyles.salaryInput,
              ]}
              placeholder="Enter max salary"
              placeholderTextColor={COLORS.lightGray}
              value={maxSalary}
              onChangeText={value => handleSalaryChange(value, setMaxSalary)}
              keyboardType="numeric"
            />
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

