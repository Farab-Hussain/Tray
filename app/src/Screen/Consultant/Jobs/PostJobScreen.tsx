import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import AppButton from '../../../components/ui/AppButton';
import { JobService } from '../../../services/job.service';
import { COLORS } from '../../../constants/core/colors';
import { showError, showSuccess } from '../../../utils/toast';
import { X, Plus } from 'lucide-react-native';

const PostJobScreen = ({ navigation }: any) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState<'full-time' | 'part-time' | 'contract' | 'internship'>('full-time');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
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

  const handlePostJob = async () => {
    if (!title.trim() || !description.trim() || !company.trim() || !location.trim()) {
      showError('Please fill in all required fields');
      return;
    }

    if (requiredSkills.length === 0) {
      showError('Please add at least one required skill');
      return;
    }

    try {
      setPosting(true);
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
          currency: 'USD',
        };
      }

      if (experienceRequired) {
        jobData.experienceRequired = parseInt(experienceRequired);
      }

      if (educationRequired.trim()) {
        jobData.educationRequired = educationRequired.trim();
      }

      await JobService.createJob(jobData);
      showSuccess('Job posted successfully');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error posting job:', error);
      showError(error.message || 'Failed to post job');
    } finally {
      setPosting(false);
    }
  };

  const jobTypes = ['full-time', 'part-time', 'contract', 'internship'];

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Post a Job" navigation={navigation} />
      
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid
        extraScrollHeight={100}
      >
        <Text style={styles.label}>Job Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Software Engineer"
          placeholderTextColor={COLORS.lightGray}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Company Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Tech Company Inc."
          placeholderTextColor={COLORS.lightGray}
          value={company}
          onChangeText={setCompany}
        />

        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., New York, NY or Remote"
          placeholderTextColor={COLORS.lightGray}
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.label}>Job Type *</Text>
        <View style={styles.jobTypeContainer}>
          {jobTypes.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setJobType(type as any)}
              style={[styles.jobTypeButton, jobType === type && styles.jobTypeButtonActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.jobTypeText, jobType === type && styles.jobTypeTextActive]}>
                {type.replace('-', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Job Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the role, responsibilities, and requirements..."
          placeholderTextColor={COLORS.lightGray}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Required Skills *</Text>
        <View style={styles.addSkillContainer}>
          <TextInput
            style={styles.addSkillInput}
            placeholder="Add a skill"
            placeholderTextColor={COLORS.lightGray}
            value={newSkill}
            onChangeText={setNewSkill}
            onSubmitEditing={handleAddSkill}
          />
          <TouchableOpacity
            onPress={handleAddSkill}
            style={styles.addButton}
            activeOpacity={0.7}
          >
            <Plus size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        
        {requiredSkills.length > 0 && (
          <View style={styles.skillsContainer}>
            {requiredSkills.map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveSkill(index)}
                  style={styles.removeSkillButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.rowContainer}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Min Salary (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 50000"
              placeholderTextColor={COLORS.lightGray}
              value={minSalary}
              onChangeText={setMinSalary}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Max Salary (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 80000"
              placeholderTextColor={COLORS.lightGray}
              value={maxSalary}
              onChangeText={setMaxSalary}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.label}>Years of Experience (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 3"
          placeholderTextColor={COLORS.lightGray}
          value={experienceRequired}
          onChangeText={setExperienceRequired}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Education Required (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Bachelor's Degree"
          placeholderTextColor={COLORS.lightGray}
          value={educationRequired}
          onChangeText={setEducationRequired}
        />

        <AppButton
          title={posting ? 'Posting...' : 'Post Job'}
          onPress={handlePostJob}
          disabled={posting}
          loading={posting}
          style={styles.submitButton}
        />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
    backgroundColor: COLORS.white,
    color: COLORS.black,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  jobTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 10,
  },
  jobTypeButton: {
    backgroundColor: COLORS.lightBackground,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  jobTypeButtonActive: {
    backgroundColor: COLORS.green,
  },
  jobTypeText: {
    color: COLORS.black,
    fontWeight: '500',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  jobTypeTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  addSkillContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  addSkillInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 14,
    marginRight: 8,
    fontSize: 15,
    backgroundColor: COLORS.white,
    color: COLORS.black,
  },
  addButton: {
    backgroundColor: COLORS.green,
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  skillTag: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  removeSkillButton: {
    padding: 2,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  submitButton: {
    marginTop: 8,
  },
});

export default PostJobScreen;
