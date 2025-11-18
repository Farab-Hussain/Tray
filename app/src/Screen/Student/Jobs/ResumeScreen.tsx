import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import AppButton from '../../../components/ui/AppButton';
import Loader from '../../../components/ui/Loader';
import { ResumeService, ResumeData } from '../../../services/resume.service';
import { UploadService } from '../../../services/upload.service';
import { COLORS } from '../../../constants/core/colors';
import { showError, showSuccess } from '../../../utils/toast';
import { useAuth } from '../../../contexts/AuthContext';
import { launchImageLibrary, MediaType } from 'react-native-image-picker';
import { X, Plus } from 'lucide-react-native';

interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

interface Education {
  degree: string;
  institution: string;
  graduationYear?: number;
  gpa?: number;
}

interface Certification {
  name: string;
  issuer: string;
  date: string;
}

const ResumeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Personal Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  // Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  // Experience
  const [experience, setExperience] = useState<Experience[]>([]);

  // Education
  const [education, setEducation] = useState<Education[]>([]);

  // Certifications
  const [certifications, setCertifications] = useState<Certification[]>([]);

  // Background & Resume File
  const [backgroundInformation, setBackgroundInformation] = useState('');
  const [resumeFileUrl, setResumeFileUrl] = useState<string | null>(null);
  const [resumeFilePublicId, setResumeFilePublicId] = useState<string | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setName(user.name || user.displayName || '');
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadResume();
    }, [])
  );

  const loadResume = async () => {
    try {
      setLoading(true);
      const response = await ResumeService.getMyResume();
      if (response.resume) {
        const resume = response.resume;
        setName(resume.personalInfo?.name || '');
        setEmail(resume.personalInfo?.email || '');
        setPhone(resume.personalInfo?.phone || '');
        setLocation(resume.personalInfo?.location || '');
        setSkills(resume.skills || []);
        setExperience(resume.experience || []);
        setEducation(resume.education || []);
        setCertifications(resume.certifications || []);
        setBackgroundInformation(resume.backgroundInformation || '');
        setResumeFileUrl(resume.resumeFileUrl || null);
        setResumeFilePublicId(resume.resumeFilePublicId || null);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error loading resume:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleAddExperience = () => {
    setExperience([
      ...experience,
      {
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
      },
    ]);
  };

  const handleUpdateExperience = (index: number, field: keyof Experience, value: any) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    setExperience(updated);
  };

  const handleRemoveExperience = (index: number) => {
    Alert.alert('Remove Experience', 'Are you sure you want to remove this experience?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setExperience(experience.filter((_, i) => i !== index)),
      },
    ]);
  };

  const handleAddEducation = () => {
    setEducation([
      ...education,
      {
        degree: '',
        institution: '',
        graduationYear: undefined,
        gpa: undefined,
      },
    ]);
  };

  const handleUpdateEducation = (index: number, field: keyof Education, value: any) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  const handleRemoveEducation = (index: number) => {
    Alert.alert('Remove Education', 'Are you sure you want to remove this education?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setEducation(education.filter((_, i) => i !== index)),
      },
    ]);
  };

  const handleAddCertification = () => {
    setCertifications([
      ...certifications,
      {
        name: '',
        issuer: '',
        date: '',
      },
    ]);
  };

  const handleUpdateCertification = (index: number, field: keyof Certification, value: string) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    setCertifications(updated);
  };

  const handleRemoveCertification = (index: number) => {
    Alert.alert('Remove Certification', 'Are you sure you want to remove this certification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setCertifications(certifications.filter((_, i) => i !== index)),
      },
    ]);
  };

  const handleUploadResume = async () => {
    try {
      setUploadingResume(true);
      const options: any = {
        mediaType: 'mixed' as MediaType,
        allowsEditing: false,
        quality: 1,
      };

      launchImageLibrary(options, async (response) => {
        if (response.didCancel || response.errorCode) {
          setUploadingResume(false);
          return;
        }

        const asset = response.assets?.[0];
        if (!asset) {
          setUploadingResume(false);
          return;
        }

        try {
          const uploadResponse = await UploadService.uploadFile(asset, 'resume');
          setResumeFileUrl(uploadResponse.imageUrl || uploadResponse.url);
          setResumeFilePublicId(uploadResponse.publicId);
          showSuccess('Resume uploaded successfully');
        } catch (error: any) {
          console.error('Error uploading resume:', error);
          showError(error.message || 'Failed to upload resume');
        } finally {
          setUploadingResume(false);
        }
      });
    } catch (error: any) {
      console.error('Error selecting resume:', error);
      showError(error.message || 'Failed to select resume');
      setUploadingResume(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      showError('Name and email are required');
      return;
    }

    if (skills.length === 0) {
      showError('Please add at least one skill');
      return;
    }

    try {
      setSaving(true);
      const resumeData: ResumeData = {
        personalInfo: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          location: location.trim() || undefined,
          profileImage: user?.photoURL || undefined,
        },
        skills,
        experience,
        education,
        certifications: certifications.length > 0 ? certifications : undefined,
        backgroundInformation: backgroundInformation.trim() || undefined,
        resumeFileUrl: resumeFileUrl || undefined,
        resumeFilePublicId: resumeFilePublicId || undefined,
      };

      await ResumeService.createOrUpdateResume(resumeData);
      showSuccess('Resume saved successfully');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error saving resume:', error);
      showError(error.message || 'Failed to save resume');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="My Resume" navigation={navigation} />
        <Loader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="My Resume" navigation={navigation} />
      
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid
        extraScrollHeight={100}
      >
        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            placeholderTextColor={COLORS.lightGray}
            value={name}
            onChangeText={setName}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Email *"
            placeholderTextColor={COLORS.lightGray}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Phone"
            placeholderTextColor={COLORS.lightGray}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Location"
            placeholderTextColor={COLORS.lightGray}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills *</Text>
          
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
          
          {skills.length > 0 && (
            <View style={styles.skillsContainer}>
              {skills.map((skill, index) => (
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
        </View>

        {/* Experience */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Experience</Text>
            <TouchableOpacity onPress={handleAddExperience} style={styles.addSectionButton} activeOpacity={0.7}>
              <Plus size={18} color={COLORS.green} />
              <Text style={styles.addSectionText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          {experience.map((exp, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemCardHeader}>
                <Text style={styles.itemCardTitle}>Experience #{index + 1}</Text>
                <TouchableOpacity onPress={() => handleRemoveExperience(index)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Job Title"
                placeholderTextColor={COLORS.lightGray}
                value={exp.title}
                onChangeText={(value) => handleUpdateExperience(index, 'title', value)}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Company"
                placeholderTextColor={COLORS.lightGray}
                value={exp.company}
                onChangeText={(value) => handleUpdateExperience(index, 'company', value)}
              />
              
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Start Date (YYYY-MM)"
                  placeholderTextColor={COLORS.lightGray}
                  value={exp.startDate}
                  onChangeText={(value) => handleUpdateExperience(index, 'startDate', value)}
                />
                
                {!exp.current && (
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="End Date (YYYY-MM)"
                    placeholderTextColor={COLORS.lightGray}
                    value={exp.endDate}
                    onChangeText={(value) => handleUpdateExperience(index, 'endDate', value)}
                  />
                )}
              </View>
              
              <TouchableOpacity
                onPress={() => handleUpdateExperience(index, 'current', !exp.current)}
                style={styles.checkboxContainer}
              >
                <View style={[styles.checkbox, exp.current && styles.checkboxChecked]}>
                  {exp.current && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Current Job</Text>
              </TouchableOpacity>
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                placeholderTextColor={COLORS.lightGray}
                value={exp.description}
                onChangeText={(value) => handleUpdateExperience(index, 'description', value)}
                multiline
              />
            </View>
          ))}
        </View>

        {/* Education */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Education</Text>
            <TouchableOpacity onPress={handleAddEducation} style={styles.addSectionButton} activeOpacity={0.7}>
              <Plus size={18} color={COLORS.green} />
              <Text style={styles.addSectionText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          {education.map((edu, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemCardHeader}>
                <Text style={styles.itemCardTitle}>Education #{index + 1}</Text>
                <TouchableOpacity onPress={() => handleRemoveEducation(index)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Degree"
                placeholderTextColor={COLORS.lightGray}
                value={edu.degree}
                onChangeText={(value) => handleUpdateEducation(index, 'degree', value)}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Institution"
                placeholderTextColor={COLORS.lightGray}
                value={edu.institution}
                onChangeText={(value) => handleUpdateEducation(index, 'institution', value)}
              />
              
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Graduation Year"
                  placeholderTextColor={COLORS.lightGray}
                  value={edu.graduationYear?.toString()}
                  onChangeText={(value) => handleUpdateEducation(index, 'graduationYear', value ? parseInt(value) : undefined)}
                  keyboardType="numeric"
                />
                
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="GPA (optional)"
                  placeholderTextColor={COLORS.lightGray}
                  value={edu.gpa?.toString()}
                  onChangeText={(value) => handleUpdateEducation(index, 'gpa', value ? parseFloat(value) : undefined)}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          ))}
        </View>

        {/* Certifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <TouchableOpacity onPress={handleAddCertification} style={styles.addSectionButton} activeOpacity={0.7}>
              <Plus size={18} color={COLORS.green} />
              <Text style={styles.addSectionText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          {certifications.map((cert, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemCardHeader}>
                <Text style={styles.itemCardTitle}>Certification #{index + 1}</Text>
                <TouchableOpacity onPress={() => handleRemoveCertification(index)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Certification Name"
                placeholderTextColor={COLORS.lightGray}
                value={cert.name}
                onChangeText={(value) => handleUpdateCertification(index, 'name', value)}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Issuer"
                placeholderTextColor={COLORS.lightGray}
                value={cert.issuer}
                onChangeText={(value) => handleUpdateCertification(index, 'issuer', value)}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Date (YYYY-MM)"
                placeholderTextColor={COLORS.lightGray}
                value={cert.date}
                onChangeText={(value) => handleUpdateCertification(index, 'date', value)}
              />
            </View>
          ))}
        </View>

        {/* Background Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Background Information</Text>
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us about yourself, your background, and what makes you unique..."
            placeholderTextColor={COLORS.lightGray}
            value={backgroundInformation}
            onChangeText={setBackgroundInformation}
            multiline
          />
        </View>

        {/* Resume File Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resume File (PDF/DOC)</Text>
          
          <TouchableOpacity
            onPress={handleUploadResume}
            disabled={uploadingResume}
            style={[styles.uploadButton, uploadingResume && styles.uploadButtonDisabled]}
            activeOpacity={0.7}
          >
            {uploadingResume ? (
              <ActivityIndicator color={COLORS.green} />
            ) : (
              <>
                <Text style={styles.uploadButtonText}>
                  {resumeFileUrl ? '✓ Resume Uploaded' : '+ Upload Resume File'}
                </Text>
                <Text style={styles.uploadButtonSubtext}>
                  {resumeFileUrl ? 'Tap to change' : 'PDF or DOC file'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <AppButton
          title={saving ? 'Saving...' : 'Save Resume'}
          onPress={handleSave}
          disabled={saving}
          loading={saving}
          style={styles.saveButton}
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
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: COLORS.white,
    color: COLORS.black,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
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
  addSectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addSectionText: {
    color: COLORS.green,
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 15,
  },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.lightBackground,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  removeText: {
    color: COLORS.red,
    fontWeight: '600',
    fontSize: 14,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '500',
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: COLORS.green,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontSize: 16,
    color: COLORS.green,
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadButtonSubtext: {
    fontSize: 12,
    color: COLORS.gray,
  },
  saveButton: {
    marginTop: 8,
  },
});

export default ResumeScreen;
