import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import DateTimePicker from '@react-native-community/datetimepicker';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import AppButton from '../../../components/ui/AppButton';
import Loader from '../../../components/ui/Loader';
import { ResumeService, ResumeData } from '../../../services/resume.service';
import { UploadService } from '../../../services/upload.service';
import { COLORS } from '../../../constants/core/colors';
import { showError, showSuccess } from '../../../utils/toast';
import { showConfirmation } from '../../../utils/alertUtils';
import { useAuth } from '../../../contexts/AuthContext';
import { X, Plus, Calendar as CalendarIcon, Image as ImageIcon } from 'lucide-react-native';
import ImageUpload from '../../../components/ui/ImageUpload';
import { resumeScreenStyles } from '../../../constants/styles/resumeScreenStyles';

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
  imageUrl?: string;
  imagePublicId?: string;
}

const ResumeScreen = ({ navigation }: any) => {
  const { user, activeRole, roles } = useAuth();
  const isRecruiter = activeRole === 'recruiter' || roles.includes('recruiter');
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

  // Validation errors
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    skills?: string;
    experience?: { [key: number]: { title?: string; company?: string; startDate?: string } };
    education?: { [key: number]: { degree?: string; institution?: string; graduationYear?: string } };
    certification?: { [key: number]: { name?: string; issuer?: string; date?: string } };
  }>({});

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end' | 'certification' | null>(null);
  const [datePickerIndex, setDatePickerIndex] = useState<number>(-1);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Experience
  const [experience, setExperience] = useState<Experience[]>([]);

  // Education
  const [education, setEducation] = useState<Education[]>([]);

  // Certifications
  const [certifications, setCertifications] = useState<Certification[]>([]);

  // Background Information
  const [backgroundInformation, setBackgroundInformation] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setName(user.name || user.displayName || '');
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadResume();
    }, [isRecruiter])
  );

  const loadResume = async () => {
    try {
      setLoading(true);
      // Recruiters don't have resumes - skip loading
      if (isRecruiter) {
        setLoading(false);
        return;
      }
      
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
      }
    } catch (error: any) {
      // Silently handle 404 - resume not found is expected for new users
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
      // Clear error when skill is added
      if (errors.skills) {
        setErrors({ ...errors, skills: undefined });
      }
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const openDatePicker = (type: 'start' | 'end' | 'certification', index: number) => {
    setDatePickerType(type);
    setDatePickerIndex(index);
    let currentDate = '';
    if (type === 'start') {
      currentDate = experience[index]?.startDate || '';
    } else if (type === 'end') {
      currentDate = experience[index]?.endDate || '';
    } else if (type === 'certification') {
      currentDate = certifications[index]?.date || '';
    }
    
    // Parse current date or use today's date
    if (currentDate) {
      const [year, month] = currentDate.split('-');
      const date = new Date();
      date.setFullYear(parseInt(year) || new Date().getFullYear());
      date.setMonth((parseInt(month) || new Date().getMonth() + 1) - 1);
      date.setDate(1);
      setSelectedDate(date);
    } else {
      // Default to current year and month
      const date = new Date();
      date.setDate(1);
      setSelectedDate(date);
    }
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && date) {
        handleDateConfirm(date);
      } else {
        // User cancelled
        setDatePickerType(null);
        setDatePickerIndex(-1);
      }
    } else {
      // iOS - update selected date as user scrolls
      if (date) {
        setSelectedDate(date);
      }
    }
  };

  const handleDateConfirm = (date?: Date) => {
    const finalDate = date || selectedDate;
    if (datePickerType !== null && datePickerIndex >= 0) {
      // Format as YYYY-MM
      const year = finalDate.getFullYear();
      const month = finalDate.getMonth() + 1;
      const dateStr = `${year}-${String(month).padStart(2, '0')}`;
      
      if (datePickerType === 'start') {
        handleUpdateExperience(datePickerIndex, 'startDate', dateStr);
        // Clear error when date is selected
        if (errors.experience?.[datePickerIndex]?.startDate) {
          const newExpErrors = { ...errors.experience };
          if (newExpErrors[datePickerIndex]) {
            delete newExpErrors[datePickerIndex].startDate;
            if (Object.keys(newExpErrors[datePickerIndex]).length === 0) {
              delete newExpErrors[datePickerIndex];
            }
          }
          setErrors({ ...errors, experience: Object.keys(newExpErrors).length > 0 ? newExpErrors : undefined });
        }
      } else if (datePickerType === 'end') {
        handleUpdateExperience(datePickerIndex, 'endDate', dateStr);
        // Clear error when date is selected
        if (errors.experience?.[datePickerIndex]?.endDate) {
          const newExpErrors = { ...errors.experience };
          if (newExpErrors[datePickerIndex]) {
            delete newExpErrors[datePickerIndex].endDate;
            if (Object.keys(newExpErrors[datePickerIndex]).length === 0) {
              delete newExpErrors[datePickerIndex];
            }
          }
          setErrors({ ...errors, experience: Object.keys(newExpErrors).length > 0 ? newExpErrors : undefined });
        }
      } else if (datePickerType === 'certification') {
        handleUpdateCertification(datePickerIndex, 'date', dateStr);
        // Clear error when date is selected
        if (errors.certification?.[datePickerIndex]?.date) {
          const newCertErrors = { ...errors.certification };
          if (newCertErrors[datePickerIndex]) {
            delete newCertErrors[datePickerIndex].date;
            if (Object.keys(newCertErrors[datePickerIndex]).length === 0) {
              delete newCertErrors[datePickerIndex];
            }
          }
          setErrors({ ...errors, certification: Object.keys(newCertErrors).length > 0 ? newCertErrors : undefined });
        }
      }
      
      setShowDatePicker(false);
      setDatePickerType(null);
      setDatePickerIndex(-1);
    }
  };

  const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    // If already in YYYY-MM format, convert to readable format
    if (dateStr.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = dateStr.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    return dateStr;
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
    showConfirmation(
      'Remove Experience',
      'Are you sure you want to remove this experience?',
      () => setExperience(experience.filter((_, i) => i !== index)),
      undefined,
      'Remove',
      'Cancel'
    );
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
    showConfirmation(
      'Remove Education',
      'Are you sure you want to remove this education?',
      () => setEducation(education.filter((_, i) => i !== index)),
      undefined,
      'Remove',
      'Cancel'
    );
  };

  const handleAddCertification = () => {
    setCertifications([
      ...certifications,
      {
        name: '',
        issuer: '',
        date: '',
        imageUrl: undefined,
        imagePublicId: undefined,
      },
    ]);
  };

  const handleUpdateCertification = (index: number, field: keyof Certification, value: string) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    setCertifications(updated);
  };

  const handleRemoveCertification = (index: number) => {
    showConfirmation(
      'Remove Certification',
      'Are you sure you want to remove this certification?',
      () => setCertifications(certifications.filter((_, i) => i !== index)),
      undefined,
      'Remove',
      'Cancel'
    );
  };


  const handleSave = async () => {
    // Validate all required fields
    const newErrors: {
      name?: string;
      email?: string;
      phone?: string;
      location?: string;
      skills?: string;
      experience?: { [key: number]: { title?: string; company?: string; startDate?: string } };
      education?: { [key: number]: { degree?: string; institution?: string; graduationYear?: string } };
      certification?: { [key: number]: { name?: string; issuer?: string; date?: string } };
    } = {};

    // Personal Information validation
    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (phone.trim().length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits';
    }

    if (!location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (skills.length === 0) {
      newErrors.skills = 'Please add at least one skill';
    }

    // Experience validation - if any experience exists, all fields are required
    if (experience.length > 0) {
      const experienceErrors: { [key: number]: { title?: string; company?: string; startDate?: string } } = {};
      experience.forEach((exp, index) => {
        const expErrors: { title?: string; company?: string; startDate?: string } = {};
        if (!exp.title.trim()) {
          expErrors.title = 'Job title is required';
        }
        if (!exp.company.trim()) {
          expErrors.company = 'Company is required';
        }
        if (!exp.startDate.trim()) {
          expErrors.startDate = 'Start date is required';
        }
        if (Object.keys(expErrors).length > 0) {
          experienceErrors[index] = expErrors;
        }
      });
      if (Object.keys(experienceErrors).length > 0) {
        newErrors.experience = experienceErrors;
      }
    }

    // Education validation - if any education exists, all fields are required
    if (education.length > 0) {
      const educationErrors: { [key: number]: { degree?: string; institution?: string; graduationYear?: string } } = {};
      education.forEach((edu, index) => {
        const eduErrors: { degree?: string; institution?: string; graduationYear?: string } = {};
        if (!edu.degree.trim()) {
          eduErrors.degree = 'Degree is required';
        }
        if (!edu.institution.trim()) {
          eduErrors.institution = 'Institution is required';
        }
        if (!edu.graduationYear) {
          eduErrors.graduationYear = 'Graduation year is required';
        }
        if (Object.keys(eduErrors).length > 0) {
          educationErrors[index] = eduErrors;
        }
      });
      if (Object.keys(educationErrors).length > 0) {
        newErrors.education = educationErrors;
      }
    }

    // Certification validation - if any certification exists, all fields are required
    if (certifications.length > 0) {
      const certificationErrors: { [key: number]: { name?: string; issuer?: string; date?: string } } = {};
      certifications.forEach((cert, index) => {
        const certErrors: { name?: string; issuer?: string; date?: string } = {};
        if (!cert.name.trim()) {
          certErrors.name = 'Certification name is required';
        }
        if (!cert.issuer.trim()) {
          certErrors.issuer = 'Issuer is required';
        }
        if (!cert.date.trim()) {
          certErrors.date = 'Date is required';
        }
        if (Object.keys(certErrors).length > 0) {
          certificationErrors[index] = certErrors;
        }
      });
      if (Object.keys(certificationErrors).length > 0) {
        newErrors.certification = certificationErrors;
      }
    }

    // If there are errors, set them and scroll to first error
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showError('Please fill in all required fields');
      return;
    }

    // Clear any previous errors
    setErrors({});

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
        <ScreenHeader title="My Resume" onBackPress={() => navigation.goBack()} />
        <Loader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="My Resume" onBackPress={() => navigation.goBack()} />
      
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
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Full Name *"
            placeholderTextColor={COLORS.lightGray}
            value={name}
            onChangeText={(text) => {
              setName(text);
              // Clear error when user starts typing
              if (errors.name) {
                setErrors({ ...errors, name: undefined });
              }
            }}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="Email *"
            placeholderTextColor={COLORS.lightGray}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              // Clear error when user starts typing
              if (errors.email) {
                setErrors({ ...errors, email: undefined });
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            placeholder="Phone *"
            placeholderTextColor={COLORS.lightGray}
            value={phone}
            onChangeText={(text) => {
              // Only allow numbers and + character
              const filteredText = text.replace(/[^0-9+]/g, '');
              setPhone(filteredText);
              // Clear error when user starts typing
              if (errors.phone) {
                setErrors({ ...errors, phone: undefined });
              }
            }}
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          
          <TextInput
            style={[styles.input, errors.location && styles.inputError]}
            placeholder="Location *"
            placeholderTextColor={COLORS.lightGray}
            value={location}
            onChangeText={(text) => {
              setLocation(text);
              // Clear error when user starts typing
              if (errors.location) {
                setErrors({ ...errors, location: undefined });
              }
            }}
          />
          {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
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
          
          {errors.skills && <Text style={styles.errorText}>{errors.skills}</Text>}
          
          {skills.length > 0 && (
            <View style={styles.skillsContainer}>
              {skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      handleRemoveSkill(index);
                      // Clear error when user removes a skill (if they add one)
                      if (errors.skills && skills.length > 1) {
                        setErrors({ ...errors, skills: undefined });
                      }
                    }}
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
                style={[styles.input, errors.experience?.[index]?.title && styles.inputError]}
                placeholder="Job Title *"
                placeholderTextColor={COLORS.lightGray}
                value={exp.title}
                onChangeText={(value) => {
                  handleUpdateExperience(index, 'title', value);
                  // Clear error when user starts typing
                  if (errors.experience?.[index]?.title) {
                    const newExpErrors = { ...errors.experience };
                    if (newExpErrors[index]) {
                      delete newExpErrors[index].title;
                      if (Object.keys(newExpErrors[index]).length === 0) {
                        delete newExpErrors[index];
                      }
                    }
                    setErrors({ ...errors, experience: Object.keys(newExpErrors).length > 0 ? newExpErrors : undefined });
                  }
                }}
              />
              {errors.experience?.[index]?.title && <Text style={styles.errorText}>{errors.experience[index].title}</Text>}
              
              <TextInput
                style={[styles.input, errors.experience?.[index]?.company && styles.inputError]}
                placeholder="Company *"
                placeholderTextColor={COLORS.lightGray}
                value={exp.company}
                onChangeText={(value) => {
                  handleUpdateExperience(index, 'company', value);
                  // Clear error when user starts typing
                  if (errors.experience?.[index]?.company) {
                    const newExpErrors = { ...errors.experience };
                    if (newExpErrors[index]) {
                      delete newExpErrors[index].company;
                      if (Object.keys(newExpErrors[index]).length === 0) {
                        delete newExpErrors[index];
                      }
                    }
                    setErrors({ ...errors, experience: Object.keys(newExpErrors).length > 0 ? newExpErrors : undefined });
                  }
                }}
              />
              {errors.experience?.[index]?.company && <Text style={styles.errorText}>{errors.experience[index].company}</Text>}
              
              <View style={styles.rowInputs}>
                <TouchableOpacity
                  style={[styles.input, styles.halfInput, styles.dateInput, errors.experience?.[index]?.startDate && styles.inputError]}
                  onPress={() => openDatePicker('start', index)}
                  activeOpacity={0.7}
                >
                  <Text style={exp.startDate ? styles.dateInputText : styles.dateInputPlaceholder}>
                    {exp.startDate ? formatDateDisplay(exp.startDate) : 'Start Date *'}
                  </Text>
                  <CalendarIcon size={20} color={COLORS.gray} />
                </TouchableOpacity>
                
                {!exp.current && (
                  <TouchableOpacity
                    style={[styles.input, styles.halfInput, styles.dateInput]}
                    onPress={() => openDatePicker('end', index)}
                    activeOpacity={0.7}
                  >
                    <Text style={exp.endDate ? styles.dateInputText : styles.dateInputPlaceholder}>
                      {exp.endDate ? formatDateDisplay(exp.endDate) : 'End Date'}
                    </Text>
                    <CalendarIcon size={20} color={COLORS.gray} />
                  </TouchableOpacity>
                )}
              </View>
              {errors.experience?.[index]?.startDate && <Text style={styles.errorText}>{errors.experience[index].startDate}</Text>}
              
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
                style={[styles.input, errors.education?.[index]?.degree && styles.inputError]}
                placeholder="Degree *"
                placeholderTextColor={COLORS.lightGray}
                value={edu.degree}
                onChangeText={(value) => {
                  handleUpdateEducation(index, 'degree', value);
                  // Clear error when user starts typing
                  if (errors.education?.[index]?.degree) {
                    const newEduErrors = { ...errors.education };
                    if (newEduErrors[index]) {
                      delete newEduErrors[index].degree;
                      if (Object.keys(newEduErrors[index]).length === 0) {
                        delete newEduErrors[index];
                      }
                    }
                    setErrors({ ...errors, education: Object.keys(newEduErrors).length > 0 ? newEduErrors : undefined });
                  }
                }}
              />
              {errors.education?.[index]?.degree && <Text style={styles.errorText}>{errors.education[index].degree}</Text>}
              
              <TextInput
                style={[styles.input, errors.education?.[index]?.institution && styles.inputError]}
                placeholder="Institution *"
                placeholderTextColor={COLORS.lightGray}
                value={edu.institution}
                onChangeText={(value) => {
                  handleUpdateEducation(index, 'institution', value);
                  // Clear error when user starts typing
                  if (errors.education?.[index]?.institution) {
                    const newEduErrors = { ...errors.education };
                    if (newEduErrors[index]) {
                      delete newEduErrors[index].institution;
                      if (Object.keys(newEduErrors[index]).length === 0) {
                        delete newEduErrors[index];
                      }
                    }
                    setErrors({ ...errors, education: Object.keys(newEduErrors).length > 0 ? newEduErrors : undefined });
                  }
                }}
              />
              {errors.education?.[index]?.institution && <Text style={styles.errorText}>{errors.education[index].institution}</Text>}
              
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput, errors.education?.[index]?.graduationYear && styles.inputError]}
                  placeholder="Graduation Year *"
                  placeholderTextColor={COLORS.lightGray}
                  value={edu.graduationYear?.toString()}
                  onChangeText={(value) => {
                    handleUpdateEducation(index, 'graduationYear', value ? parseInt(value) : undefined);
                    // Clear error when user starts typing
                    if (errors.education?.[index]?.graduationYear) {
                      const newEduErrors = { ...errors.education };
                      if (newEduErrors[index]) {
                        delete newEduErrors[index].graduationYear;
                        if (Object.keys(newEduErrors[index]).length === 0) {
                          delete newEduErrors[index];
                        }
                      }
                      setErrors({ ...errors, education: Object.keys(newEduErrors).length > 0 ? newEduErrors : undefined });
                    }
                  }}
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
              {errors.education?.[index]?.graduationYear && <Text style={styles.errorText}>{errors.education[index].graduationYear}</Text>}
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
                style={[styles.input, errors.certification?.[index]?.name && styles.inputError]}
                placeholder="Certification Name *"
                placeholderTextColor={COLORS.lightGray}
                value={cert.name}
                onChangeText={(value) => {
                  handleUpdateCertification(index, 'name', value);
                  // Clear error when user starts typing
                  if (errors.certification?.[index]?.name) {
                    const newCertErrors = { ...errors.certification };
                    if (newCertErrors[index]) {
                      delete newCertErrors[index].name;
                      if (Object.keys(newCertErrors[index]).length === 0) {
                        delete newCertErrors[index];
                      }
                    }
                    setErrors({ ...errors, certification: Object.keys(newCertErrors).length > 0 ? newCertErrors : undefined });
                  }
                }}
              />
              {errors.certification?.[index]?.name && <Text style={styles.errorText}>{errors.certification[index].name}</Text>}
              
              <TextInput
                style={[styles.input, errors.certification?.[index]?.issuer && styles.inputError]}
                placeholder="Issuer *"
                placeholderTextColor={COLORS.lightGray}
                value={cert.issuer}
                onChangeText={(value) => {
                  handleUpdateCertification(index, 'issuer', value);
                  // Clear error when user starts typing
                  if (errors.certification?.[index]?.issuer) {
                    const newCertErrors = { ...errors.certification };
                    if (newCertErrors[index]) {
                      delete newCertErrors[index].issuer;
                      if (Object.keys(newCertErrors[index]).length === 0) {
                        delete newCertErrors[index];
                      }
                    }
                    setErrors({ ...errors, certification: Object.keys(newCertErrors).length > 0 ? newCertErrors : undefined });
                  }
                }}
              />
              {errors.certification?.[index]?.issuer && <Text style={styles.errorText}>{errors.certification[index].issuer}</Text>}
              
              <TouchableOpacity
                style={[styles.input, styles.dateInput, errors.certification?.[index]?.date && styles.inputError]}
                onPress={() => openDatePicker('certification', index)}
                activeOpacity={0.7}
              >
                <Text style={cert.date ? styles.dateInputText : styles.dateInputPlaceholder}>
                  {cert.date ? formatDateDisplay(cert.date) : 'Date *'}
                </Text>
                <CalendarIcon size={20} color={COLORS.gray} />
              </TouchableOpacity>
              {errors.certification?.[index]?.date && <Text style={styles.errorText}>{errors.certification[index].date}</Text>}
              
              {/* Certificate Image Upload */}
              <View style={styles.certificateImageSection}>
                <Text style={styles.certificateImageLabel}>Certificate Image (Optional)</Text>
                <ImageUpload
                  currentImageUrl={cert.imageUrl}
                  currentPublicId={cert.imagePublicId}
                  onImageUploaded={(imageUrl, publicId) => {
                    const updated = [...certifications];
                    updated[index] = { ...updated[index], imageUrl, imagePublicId: publicId };
                    setCertifications(updated);
                    showSuccess('Certificate image uploaded successfully');
                  }}
                  onImageDeleted={() => {
                    const updated = [...certifications];
                    updated[index] = { ...updated[index], imageUrl: undefined, imagePublicId: undefined };
                    setCertifications(updated);
                  }}
                  placeholder="Upload certificate image"
                  style={styles.certificateImageUpload}
                  uploadType="user"
                  showDeleteButton={!!cert.imageUrl}
                />
              </View>
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

        {/* Save Button */}
        <AppButton
          title={saving ? 'Saving...' : 'Save Resume'}
          onPress={handleSave}
          disabled={saving}
          loading={saving}
          style={styles.saveButton}
        />
      </KeyboardAwareScrollView>

      {/* Date Picker */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setShowDatePicker(false);
            setDatePickerType(null);
            setDatePickerIndex(-1);
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalOverlay}
            onPress={() => {
              setShowDatePicker(false);
              setDatePickerType(null);
              setDatePickerIndex(-1);
            }}
          >
            <View 
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => {
                    setShowDatePicker(false);
                    setDatePickerType(null);
                    setDatePickerIndex(-1);
                  }}
                  style={styles.modalCancelButton}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  Select {datePickerType === 'start' ? 'Start' : datePickerType === 'end' ? 'End' : 'Certification'} Date
                </Text>
                <TouchableOpacity
                  onPress={() => handleDateConfirm()}
                  style={styles.modalDoneButton}
                >
                  <Text style={styles.modalDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  style={styles.datePicker}
                  textColor={COLORS.black}
                  minimumDate={datePickerType === 'end' && datePickerIndex >= 0 && experience[datePickerIndex]?.startDate
                    ? (() => {
                        const [year, month] = experience[datePickerIndex].startDate.split('-');
                        return new Date(parseInt(year), parseInt(month) - 1, 1);
                      })()
                    : undefined}
                  maximumDate={new Date()}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={datePickerType === 'end' && datePickerIndex >= 0 && experience[datePickerIndex]?.startDate
            ? (() => {
                const [year, month] = experience[datePickerIndex].startDate.split('-');
                return new Date(parseInt(year), parseInt(month) - 1, 1);
              })()
            : undefined}
          maximumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
};

const styles = resumeScreenStyles;

export default ResumeScreen;
