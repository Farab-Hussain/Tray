import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import DateTimePicker from '@react-native-community/datetimepicker';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import AppButton from '../../../components/ui/AppButton';
import Loader from '../../../components/ui/Loader';
import { ResumeService, ResumeData } from '../../../services/resume.service';
import { COLORS } from '../../../constants/core/colors';
import { showError, showSuccess } from '../../../utils/toast';
import { showConfirmation } from '../../../utils/alertUtils';
import { useAuth } from '../../../contexts/AuthContext';
import {
  X,
  Plus,
  Calendar as CalendarIcon,
  Download,
  Upload,
  FileText,
  Trash2,
} from 'lucide-react-native';
import ImageUpload from '../../../components/ui/ImageUpload';
import { resumeScreenStyles } from '../../../constants/styles/resumeScreenStyles';
import { generateAndShareResumePDF } from '../../../utils/resumeExport';
// Import DocumentPicker with error handling
let DocumentPicker: any = null;
try {
  DocumentPicker = require('react-native-document-picker');
} catch (e) {
  if (__DEV__) {
    logger.warn('react-native-document-picker not available:', e);
  }
}
import UploadService from '../../../services/upload.service';
import { Linking } from 'react-native';
import { AIProvider, AIService } from '../../../services/ai.service';

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
  const [exporting, setExporting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiValidating, setAiValidating] = useState(false);
  const [aiScoring, setAiScoring] = useState(false);
  const [aiAnalyzingProfile, setAiAnalyzingProfile] = useState(false);
  const [resumeScoreResult, setResumeScoreResult] = useState<{
    overall_score?: number;
    sections?: { summary?: number; experience?: number; skills?: number };
    strengths?: string[];
    improvements?: string[];
    ats_friendly?: boolean;
  } | null>(null);
  const [profileInsightsResult, setProfileInsightsResult] = useState<{
    missing_critical_fields?: string[];
    suggested_certifications?: string[];
    suggested_skill_tags?: string[];
    suggested_industries?: string[];
    profile_strengths?: string[];
    next_actions?: string[];
  } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Uploaded resume file state
  const [resumeFileUrl, setResumeFileUrl] = useState<string | undefined>(
    undefined,
  );
  const [resumeFilePublicId, setResumeFilePublicId] = useState<
    string | undefined
  >(undefined);
  const [resumeFileName, setResumeFileName] = useState<string | undefined>(
    undefined,
  );

  // Track initial state to detect changes
  const initialDataRef = useRef<{
    name: string;
    email: string;
    phone: string;
    location: string;
    skills: string[];
    experience: Experience[];
    education: Education[];
    certifications: Certification[];
    backgroundInformation: string;
  } | null>(null);

  // Flag to prevent double alerts when navigating programmatically
  const isNavigatingAwayRef = useRef(false);

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
    experience?: {
      [key: number]: {
        title?: string;
        company?: string;
        startDate?: string;
        endDate?: string;
      };
    };
    education?: {
      [key: number]: {
        degree?: string;
        institution?: string;
        graduationYear?: string;
      };
    };
    certification?: {
      [key: number]: { name?: string; issuer?: string; date?: string };
    };
  }>({});

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<
    'start' | 'end' | 'certification' | null
  >(null);
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
      // Firebase User type has displayName, not name
      setName(user.displayName || '');
    }
  }, [user]);

  const loadResume = useCallback(async () => {
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

        // Handle uploaded resume file
        if (resume.resumeFileUrl) {
          setResumeFileUrl(resume.resumeFileUrl);
          setResumeFilePublicId(resume.resumeFilePublicId);
          // Extract filename from URL and create user-friendly name
          const urlParts = resume.resumeFileUrl.split('/');
          const urlFileName = urlParts[urlParts.length - 1] || '';

          // Try to extract original filename or create a user-friendly one
          let displayName = 'resume.pdf';
          if (urlFileName) {
            // Check if URL contains a readable filename (has extension)
            const fileNameMatch = urlFileName.match(
              /([^/]+\.(pdf|doc|docx))$/i,
            );
            if (fileNameMatch) {
              displayName = fileNameMatch[1];
            } else {
              // Use user's name if available, otherwise generic name
              const userName =
                resume.personalInfo?.name || user?.displayName || 'Resume';
              const fileExtension = urlFileName.includes('.doc')
                ? '.doc'
                : urlFileName.includes('.docx')
                ? '.docx'
                : '.pdf';
              displayName = `${userName.replace(
                /\s+/g,
                '_',
              )}_Resume${fileExtension}`;
            }
          }
          setResumeFileName(displayName);
        }

        const loadedName = resume.personalInfo?.name || '';
        const loadedEmail = resume.personalInfo?.email || '';
        const loadedPhone = resume.personalInfo?.phone || '';
        const loadedLocation = resume.personalInfo?.location || '';
        const loadedSkills = resume.skills || [];
        const loadedExperience = resume.experience || [];
        const loadedEducation = resume.education || [];
        const loadedCertifications = resume.certifications || [];
        const loadedBackground = resume.backgroundInformation || '';

        setName(loadedName);
        setEmail(loadedEmail);
        setPhone(loadedPhone);
        setLocation(loadedLocation);
        setSkills(loadedSkills);
        setExperience(loadedExperience);
        setEducation(loadedEducation);
        setCertifications(loadedCertifications);
        setBackgroundInformation(loadedBackground);

        // Store initial state for change detection
        initialDataRef.current = {
          name: loadedName,
          email: loadedEmail,
          phone: loadedPhone,
          location: loadedLocation,
          skills: [...loadedSkills],
          experience: JSON.parse(JSON.stringify(loadedExperience)), // Deep copy
          education: JSON.parse(JSON.stringify(loadedEducation)), // Deep copy
          certifications: JSON.parse(JSON.stringify(loadedCertifications)), // Deep copy
          backgroundInformation: loadedBackground,
        };
      } else {
        // New resume - initialize with current user data
        // Firebase User type has displayName, not name
        const initialName = user?.displayName || '';
        const initialEmail = user?.email || '';
        initialDataRef.current = {
          name: initialName,
          email: initialEmail,
          phone: '',
          location: '',
          skills: [],
          experience: [],
          education: [],
          certifications: [],
          backgroundInformation: '',
        };
      }
    } catch (error: any) {
      // Silently handle 404 - resume not found is expected for new users
      if (error.response?.status !== 404) {
        if (__DEV__) {
          console.error('Error loading resume:', error);
        }
      }
      // Initialize with current user data if no resume found
      // Firebase User type has displayName, not name
      const initialName = user?.displayName || '';
      const initialEmail = user?.email || '';
      initialDataRef.current = {
        name: initialName,
        email: initialEmail,
        phone: '',
        location: '',
        skills: [],
        experience: [],
        education: [],
        certifications: [],
        backgroundInformation: '',
      };
    } finally {
      setLoading(false);
    }
  }, [isRecruiter, user]);

  useFocusEffect(
    useCallback(() => {
      loadResume();
    }, [loadResume]),
  );

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

  const openDatePicker = (
    type: 'start' | 'end' | 'certification',
    index: number,
  ) => {
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
      date.setFullYear(parseInt(year, 10) || new Date().getFullYear());
      date.setMonth((parseInt(month, 10) || new Date().getMonth() + 1) - 1);
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
        // Normalize date to first of month
        const normalizedDate = new Date(date.getFullYear(), date.getMonth(), 1);
        handleDateConfirm(normalizedDate);
      } else {
        // User cancelled
        setDatePickerType(null);
        setDatePickerIndex(-1);
      }
    } else {
      // iOS - update selected date as user scrolls
      if (date) {
        // Normalize date to first of month for consistency
        const normalizedDate = new Date(date.getFullYear(), date.getMonth(), 1);
        setSelectedDate(normalizedDate);
      }
    }
  };

  const handleDateConfirm = (date?: Date) => {
    const finalDate = date || selectedDate;
    // Always set day to 1 since we only store month and year
    const normalizedDate = new Date(
      finalDate.getFullYear(),
      finalDate.getMonth(),
      1,
    );

    if (datePickerType !== null && datePickerIndex >= 0) {
      // Format as YYYY-MM
      const year = normalizedDate.getFullYear();
      const month = normalizedDate.getMonth() + 1;
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
          setErrors({
            ...errors,
            experience:
              Object.keys(newExpErrors).length > 0 ? newExpErrors : undefined,
          });
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
          setErrors({
            ...errors,
            experience:
              Object.keys(newExpErrors).length > 0 ? newExpErrors : undefined,
          });
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
          setErrors({
            ...errors,
            certification:
              Object.keys(newCertErrors).length > 0 ? newCertErrors : undefined,
          });
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
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
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

  const handleUpdateExperience = (
    index: number,
    field: keyof Experience,
    value: any,
  ) => {
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
      'Cancel',
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

  const handleUpdateEducation = (
    index: number,
    field: keyof Education,
    value: any,
  ) => {
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
      'Cancel',
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

  const handleUpdateCertification = (
    index: number,
    field: keyof Certification,
    value: string,
  ) => {
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
      'Cancel',
    );
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (!initialDataRef.current) return false;

    const initial = initialDataRef.current;

    // Compare all fields
    if (name.trim() !== initial.name.trim()) return true;
    if (email.trim() !== initial.email.trim()) return true;
    if (phone.trim() !== initial.phone.trim()) return true;
    if (location.trim() !== initial.location.trim()) return true;
    if (backgroundInformation.trim() !== initial.backgroundInformation.trim())
      return true;

    // Compare skills arrays
    if (skills.length !== initial.skills.length) return true;
    const skillsMatch =
      skills.every(
        (skill, index) =>
          skill.trim().toLowerCase() ===
          initial.skills[index]?.trim().toLowerCase(),
      ) &&
      initial.skills.every(
        (skill, index) =>
          skill.trim().toLowerCase() === skills[index]?.trim().toLowerCase(),
      );
    if (!skillsMatch) return true;

    // Compare experience arrays (deep comparison)
    if (experience.length !== initial.experience.length) return true;
    const experienceStr = JSON.stringify(experience);
    const initialExperienceStr = JSON.stringify(initial.experience);
    if (experienceStr !== initialExperienceStr) return true;

    // Compare education arrays (deep comparison)
    if (education.length !== initial.education.length) return true;
    const educationStr = JSON.stringify(education);
    const initialEducationStr = JSON.stringify(initial.education);
    if (educationStr !== initialEducationStr) return true;

    // Compare certifications arrays (deep comparison)
    if (certifications.length !== initial.certifications.length) return true;
    const certificationsStr = JSON.stringify(certifications);
    const initialCertificationsStr = JSON.stringify(initial.certifications);
    if (certificationsStr !== initialCertificationsStr) return true;

    return false;
  }, [
    name,
    email,
    phone,
    location,
    skills,
    experience,
    education,
    certifications,
    backgroundInformation,
  ]);

  const handleSave = useCallback(async () => {
    // Validate: Either uploaded resume file OR in-app resume is required (not both)
    const hasUploadedResume = !!resumeFileUrl;
    const hasInAppResume =
      name.trim() &&
      email.trim() &&
      phone.trim() &&
      location.trim() &&
      skills.length > 0;

    // Prevent saving if both resume types exist
    if (hasUploadedResume && hasInAppResume) {
      showError(
        'Please choose only one resume option: either upload a file OR create an in-app resume. Delete one to continue.',
      );
      return;
    }

    if (!hasUploadedResume && !hasInAppResume) {
      showError(
        'Please either upload a resume file or create an in-app resume',
      );
      return;
    }

    // Validate all required fields
    const newErrors: {
      name?: string;
      email?: string;
      phone?: string;
      location?: string;
      skills?: string;
      experience?: {
        [key: number]: { title?: string; company?: string; startDate?: string };
      };
      education?: {
        [key: number]: {
          degree?: string;
          institution?: string;
          graduationYear?: string;
        };
      };
      certification?: {
        [key: number]: { name?: string; issuer?: string; date?: string };
      };
    } = {};

    // If user has uploaded resume file, only validate skills
    if (hasUploadedResume) {
      // Skills are required even when resume file is uploaded
      if (skills.length === 0) {
        newErrors.skills = 'Please add at least one skill';
      }
    } else {
      // Personal Information validation (only if no uploaded resume)
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
    }

    // Experience validation - if any experience exists, all fields are required (only if no uploaded resume)
    if (!hasUploadedResume && experience.length > 0) {
      const experienceErrors: {
        [key: number]: { title?: string; company?: string; startDate?: string };
      } = {};
      experience.forEach((exp, index) => {
        const expErrors: {
          title?: string;
          company?: string;
          startDate?: string;
        } = {};
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

    // Education validation - if any education exists, all fields are required (only if no uploaded resume)
    if (!hasUploadedResume && education.length > 0) {
      const educationErrors: {
        [key: number]: {
          degree?: string;
          institution?: string;
          graduationYear?: string;
        };
      } = {};
      education.forEach((edu, index) => {
        const eduErrors: {
          degree?: string;
          institution?: string;
          graduationYear?: string;
        } = {};
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

    // Certification validation - if any certification exists, all fields are required (only if no uploaded resume)
    if (!hasUploadedResume && certifications.length > 0) {
      const certificationErrors: {
        [key: number]: { name?: string; issuer?: string; date?: string };
      } = {};
      certifications.forEach((cert, index) => {
        const certErrors: { name?: string; issuer?: string; date?: string } =
          {};
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
          name: name.trim() || user?.displayName || '',
          email: email.trim() || user?.email || '',
          phone: phone.trim() || undefined,
          location: location.trim() || undefined,
          profileImage: user?.photoURL || undefined,
        },
        skills: skills, // Always include skills, whether uploaded resume or in-app resume
        experience: hasUploadedResume ? [] : experience,
        education: hasUploadedResume ? [] : education,
        certifications: hasUploadedResume
          ? undefined
          : certifications.length > 0
          ? certifications
          : undefined,
        backgroundInformation: hasUploadedResume
          ? undefined
          : backgroundInformation.trim() || undefined,
        resumeFileUrl: resumeFileUrl || undefined,
        resumeFilePublicId: resumeFilePublicId || undefined,
      };

      await ResumeService.createOrUpdateResume(resumeData);
      showSuccess('Resume saved successfully');

      // Update initial state after successful save
      initialDataRef.current = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        skills: [...skills],
        experience: JSON.parse(JSON.stringify(experience)),
        education: JSON.parse(JSON.stringify(education)),
        certifications: JSON.parse(JSON.stringify(certifications)),
        backgroundInformation: backgroundInformation.trim(),
      };

      // Reload resume to get updated data
      loadResume();

      // Set flag to prevent beforeRemove listener from showing alert
      isNavigatingAwayRef.current = true;
      // Check if we can go back before calling goBack
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        // If no screen to go back to, navigate to a default screen
        navigation.navigate('MainTabs' as never);
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error saving resume:', error);
      }
      showError(error.message || 'Failed to save resume');
    } finally {
      setSaving(false);
    }
  }, [
    name,
    email,
    phone,
    location,
    skills,
    experience,
    education,
    certifications,
    backgroundInformation,
    user,
    navigation,
    resumeFileUrl,
    resumeFilePublicId,
    loadResume,
  ]);

  // Handle resume file upload
  const handleUploadResumeFile = useCallback(async () => {
    try {
      setUploadingFile(true);

      // Check if DocumentPicker is available
      if (!DocumentPicker || !DocumentPicker.pick) {
        showError(
          'Document picker is not available. Please rebuild the app to enable file upload.',
        );
        return;
      }

      // Pick document
      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.doc,
          DocumentPicker.types.docx,
        ],
        copyTo: 'cachesDirectory',
      });

      if (result && result.length > 0) {
        const file = result[0];

        if (__DEV__) {
          logger.debug('Selected file:', file);
        }

        // Upload file
        const uploadResult = await UploadService.uploadFile(
          {
            uri: file.uri,
            type: file.type || 'application/pdf',
            name: file.name || 'resume.pdf',
            fileName: file.name || 'resume.pdf',
          },
          'resume',
        );

        // Check if user has in-app resume data
        const hasInAppResumeData =
          name.trim() ||
          email.trim() ||
          phone.trim() ||
          location.trim() ||
          skills.length > 0 ||
          experience.length > 0 ||
          education.length > 0 ||
          certifications.length > 0 ||
          backgroundInformation.trim();

        if (hasInAppResumeData) {
          // Show confirmation before clearing in-app resume
          showConfirmation(
            'Switch to Uploaded Resume?',
            'You have an in-app resume. Uploading a file will replace it. Do you want to continue?',
            () => {
              // Set uploaded file state
              setResumeFileUrl(uploadResult.imageUrl);
              setResumeFilePublicId(uploadResult.publicId);
              // Use original filename or create user-friendly name
              const displayFileName =
                file.name ||
                (name.trim()
                  ? `${name.trim().replace(/\s+/g, '_')}_Resume.pdf`
                  : 'resume.pdf');
              setResumeFileName(displayFileName);

              // Clear in-app resume data when uploading file (but keep skills empty for user to add)
              setName('');
              setEmail('');
              setPhone('');
              setLocation('');
              setSkills([]); // Reset skills - user will add them after upload
              setExperience([]);
              setEducation([]);
              setCertifications([]);
              setBackgroundInformation('');

              showSuccess(
                'Resume file uploaded successfully. Your in-app resume has been replaced.',
              );
            },
            () => {
              // User cancelled - don't upload
              showError('Upload cancelled');
            },
            'Replace',
            'Cancel',
          );
        } else {
          // No in-app resume data, proceed with upload
          setResumeFileUrl(uploadResult.imageUrl);
          setResumeFilePublicId(uploadResult.publicId);
          // Use original filename or create user-friendly name
          const displayFileName =
            file.name ||
            (name.trim()
              ? `${name.trim().replace(/\s+/g, '_')}_Resume.pdf`
              : 'resume.pdf');
          setResumeFileName(displayFileName);

          showSuccess('Resume file uploaded successfully');
        }
      }
    } catch (error: any) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled, do nothing
        return;
      }
      if (__DEV__) {
        logger.error('Error uploading resume file:', error);
      }
      showError(error.message || 'Failed to upload resume file');
    } finally {
      setUploadingFile(false);
    }
  }, [
    name,
    email,
    phone,
    location,
    skills,
    experience,
    education,
    certifications,
    backgroundInformation,
  ]);

  // Handle resume file deletion
  const handleDeleteResumeFile = useCallback(() => {
    showConfirmation(
      'Delete Resume File',
      'Are you sure you want to delete the uploaded resume file? You can create an in-app resume instead.',
      () => {
        setResumeFileUrl(undefined);
        setResumeFilePublicId(undefined);
        setResumeFileName(undefined);
        showSuccess(
          'Resume file deleted. You can now create an in-app resume.',
        );
      },
      undefined,
      'Delete',
      'Cancel',
    );
  }, []);

  // Handle viewing uploaded resume
  const handleViewResumeFile = useCallback(async () => {
    if (resumeFileUrl) {
      try {
        const canOpen = await Linking.canOpenURL(resumeFileUrl);
        if (canOpen) {
          await Linking.openURL(resumeFileUrl);
        } else {
          showError('Cannot open resume file');
        }
      } catch (error: any) {
        if (__DEV__) {
          logger.error('Error opening resume file:', error);
        }
        showError('Failed to open resume file');
      }
    }
  }, [resumeFileUrl]);

  // Export resume as PDF
  const handleExportATS = async () => {
    try {
      setExporting(true);

      // Validate that required fields are filled
      if (!name.trim() || !email.trim()) {
        showError(
          'Please fill in at least your name and email before exporting',
        );
        return;
      }

      // Prepare resume data for export
      const resumeData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        skills: skills.filter(skill => skill.trim()),
        experience: experience.filter(
          exp => exp.title && exp.company && exp.startDate,
        ),
        education: education.filter(edu => edu.degree && edu.institution),
        certifications: certifications.filter(
          cert => cert.name && cert.issuer && cert.date,
        ),
        backgroundInformation: backgroundInformation.trim() || undefined,
      };

      // Generate and share PDF resume
      await generateAndShareResumePDF(resumeData);
      showSuccess('Resume exported successfully');
    } catch (error: any) {
      if (__DEV__) {
        logger.error('Error exporting resume:', error);
      }
      // Don't show error if user cancelled
      if (
        !error.message?.includes('cancel') &&
        !error.message?.includes('dismiss')
      ) {
        showError(error.message || 'Failed to export resume');
      }
    } finally {
      setExporting(false);
    }
  };

  const getEstimatedYearsExperience = useCallback(() => {
    if (!experience.length) return 1;

    const totalMonths = experience.reduce((acc, exp) => {
      if (!exp.startDate) return acc;

      const [startYear, startMonth] = exp.startDate.split('-').map(Number);
      if (!startYear || !startMonth) return acc;

      const start = new Date(startYear, startMonth - 1, 1);
      const end =
        exp.current || !exp.endDate
          ? new Date()
          : (() => {
              const [endYear, endMonth] = exp.endDate!.split('-').map(Number);
              if (!endYear || !endMonth) return new Date();
              return new Date(endYear, endMonth - 1, 1);
            })();

      const months = Math.max(
        0,
        (end.getFullYear() - start.getFullYear()) * 12 +
          (end.getMonth() - start.getMonth()),
      );
      return acc + months;
    }, 0);

    return Math.max(1, Math.round(totalMonths / 12));
  }, [experience]);

  const handleGenerateBackground = useCallback(
    async (provider: AIProvider) => {
      if (skills.length === 0) {
        showError('Add at least one skill before generating AI summary');
        return;
      }

      try {
        setAiGenerating(true);
        const result = await AIService.generateResumeSummary({
          provider,
          job_title: experience[0]?.title?.trim() || 'Professional',
          years_experience: getEstimatedYearsExperience(),
          skills: skills.filter(skill => skill.trim()),
          industry: 'technology',
          tone: 'professional',
        });

        const summary = result?.summary?.trim();
        if (!summary) {
          showError('AI summary was empty. Try again.');
          return;
        }

        setBackgroundInformation(summary);
        showSuccess('AI summary generated');
      } catch (error: any) {
        if (__DEV__) {
          console.error('Failed to generate AI summary:', error);
        }
        showError(
          error?.response?.data?.detail ||
            error?.message ||
            'Failed to generate AI summary',
        );
      } finally {
        setAiGenerating(false);
      }
    },
    [experience, getEstimatedYearsExperience, skills],
  );

  const openAIGeneratePicker = useCallback(() => {
    Alert.alert(
      'Choose AI Provider',
      'Select which model provider to use for summary generation.',
      [
        { text: 'OpenAI', onPress: () => handleGenerateBackground('openai') },
        { text: 'Claude', onPress: () => handleGenerateBackground('claude') },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }, [handleGenerateBackground]);

  const handleValidateBackground = useCallback(
    async (provider: AIProvider) => {
      if (!backgroundInformation.trim()) {
        showError('Add background information before validating');
        return;
      }

      try {
        setAiValidating(true);
        const result = await AIService.validateResumeField({
          provider,
          field_name: 'background_information',
          field_value: backgroundInformation.trim(),
          context: experience[0]?.title?.trim() || undefined,
        });

        const score = result?.score ?? 'N/A';
        const issues = Array.isArray(result?.issues) ? result.issues : [];
        const suggestion = result?.suggestion?.trim?.() || '';

        const message = [
          `Score: ${score}/10`,
          issues.length ? `Issues: ${issues.join(', ')}` : 'Issues: None',
        ].join('\n');

        if (suggestion) {
          Alert.alert(
            'AI Validation Result',
            `${message}\n\nApply suggestion?`,
            [
              { text: 'Keep Current', style: 'cancel' },
              {
                text: 'Apply Suggestion',
                onPress: () => {
                  setBackgroundInformation(suggestion);
                  showSuccess('Applied AI suggestion');
                },
              },
            ],
          );
        } else {
          Alert.alert('AI Validation Result', message);
        }
      } catch (error: any) {
        if (__DEV__) {
          console.error('Failed to validate background info:', error);
        }
        if (error?.response?.status === 429) {
          showError(
            'OpenAI quota exceeded. Add billing/credits or switch provider to Claude.',
          );
        } else {
          showError(
            error?.response?.data?.detail ||
              error?.message ||
              'Failed to validate',
          );
        }
      } finally {
        setAiValidating(false);
      }
    },
    [backgroundInformation, experience],
  );

  const openAIValidatePicker = useCallback(() => {
    Alert.alert('Choose AI Provider', 'Select provider for validation.', [
      { text: 'OpenAI', onPress: () => handleValidateBackground('openai') },
      { text: 'Claude', onPress: () => handleValidateBackground('claude') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [handleValidateBackground]);

  const buildResumeTextForScoring = useCallback(() => {
    const sections: string[] = [];

    sections.push(
      `Name: ${name.trim() || 'N/A'}`,
      `Email: ${email.trim() || 'N/A'}`,
      `Phone: ${phone.trim() || 'N/A'}`,
      `Location: ${location.trim() || 'N/A'}`,
    );

    if (backgroundInformation.trim()) {
      sections.push(`Summary:\n${backgroundInformation.trim()}`);
    }

    if (skills.length > 0) {
      sections.push(`Skills:\n${skills.join(', ')}`);
    }

    if (experience.length > 0) {
      const expText = experience
        .map(
          exp =>
            `${exp.title || 'N/A'} at ${exp.company || 'N/A'} (${
              exp.startDate || 'N/A'
            } - ${exp.current ? 'Present' : exp.endDate || 'N/A'})${
              exp.description ? `: ${exp.description}` : ''
            }`,
        )
        .join('\n');
      sections.push(`Experience:\n${expText}`);
    }

    if (education.length > 0) {
      const eduText = education
        .map(
          edu =>
            `${edu.degree || 'N/A'} - ${edu.institution || 'N/A'}${
              edu.graduationYear ? ` (${edu.graduationYear})` : ''
            }`,
        )
        .join('\n');
      sections.push(`Education:\n${eduText}`);
    }

    return sections.join('\n\n');
  }, [
    name,
    email,
    phone,
    location,
    backgroundInformation,
    skills,
    experience,
    education,
  ]);

  const normalizeUnique = useCallback((items: string[]) => {
    return Array.from(
      new Set(
        items
          .map(item => item?.trim())
          .filter(Boolean)
          .map(item => item as string),
      ),
    );
  }, []);

  const buildProfileInsightsPayload = useCallback(() => {
    const expLines = experience
      .map(
        exp =>
          `${exp.title || 'N/A'} at ${exp.company || 'N/A'} (${exp.startDate || 'N/A'} - ${
            exp.current ? 'Present' : exp.endDate || 'N/A'
          })`,
      )
      .filter(Boolean);
    const eduLines = education
      .map(
        edu =>
          `${edu.degree || 'N/A'} - ${edu.institution || 'N/A'}${
            edu.graduationYear ? ` (${edu.graduationYear})` : ''
          }`,
      )
      .filter(Boolean);
    const certNames = certifications
      .map(cert => cert?.name?.trim())
      .filter(Boolean) as string[];

    return {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      location: location.trim(),
      skills: skills.filter(skill => skill.trim()),
      certifications: certNames,
      experience: expLines,
      education: eduLines,
      target_role: experience[0]?.title?.trim() || undefined,
      resume_text: buildResumeTextForScoring(),
    };
  }, [
    buildResumeTextForScoring,
    certifications,
    education,
    email,
    experience,
    location,
    name,
    phone,
    skills,
  ]);

  const handleAnalyzeProfileInsights = useCallback(
    async (provider: AIProvider) => {
      try {
        setAiAnalyzingProfile(true);
        const result = await AIService.profileInsights({
          provider,
          ...buildProfileInsightsPayload(),
        });

        setProfileInsightsResult(result || null);

        const suggestedSkills = Array.isArray(result?.suggested_skill_tags)
          ? normalizeUnique(result.suggested_skill_tags)
          : [];
        const missingFields = Array.isArray(result?.missing_critical_fields)
          ? result.missing_critical_fields
          : [];
        const industries = Array.isArray(result?.suggested_industries)
          ? result.suggested_industries
          : [];

        const summaryLines = [
          missingFields.length
            ? `Missing: ${missingFields.join(', ')}`
            : 'Missing: none',
          suggestedSkills.length
            ? `Skill tags: ${suggestedSkills.slice(0, 5).join(', ')}`
            : 'Skill tags: none',
          industries.length
            ? `Industries: ${industries.slice(0, 4).join(', ')}`
            : 'Industries: none',
        ];

        if (suggestedSkills.length > 0) {
          Alert.alert('Profile AI Insights', summaryLines.join('\n\n'), [
            { text: 'Close', style: 'cancel' },
            {
              text: 'Apply Skill Tags',
              onPress: () => {
                setSkills(prev => normalizeUnique([...prev, ...suggestedSkills]));
                showSuccess('Suggested AI skill tags added');
              },
            },
          ]);
        } else {
          Alert.alert('Profile AI Insights', summaryLines.join('\n\n'));
        }
      } catch (error: any) {
        if (__DEV__) {
          console.error('Failed to analyze profile insights:', error);
        }
        showError(
          error?.response?.data?.detail ||
            error?.message ||
            'Failed to analyze profile insights',
        );
      } finally {
        setAiAnalyzingProfile(false);
      }
    },
    [buildProfileInsightsPayload, normalizeUnique],
  );

  const openAIProfileInsightsPicker = useCallback(() => {
    Alert.alert(
      'Choose AI Provider',
      'Select provider for profile insights.',
      [
        {
          text: 'OpenAI',
          onPress: () => handleAnalyzeProfileInsights('openai'),
        },
        {
          text: 'Claude',
          onPress: () => handleAnalyzeProfileInsights('claude'),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }, [handleAnalyzeProfileInsights]);

  const handleScoreResume = useCallback(
    async (provider: AIProvider) => {
      const resumeText = buildResumeTextForScoring();
      if (!resumeText.trim()) {
        showError('Please add resume details before scoring');
        return;
      }

      try {
        setAiScoring(true);
        const result = await AIService.scoreResume({
          provider,
          resume_text: resumeText,
          target_job: experience[0]?.title?.trim() || undefined,
        });
        setResumeScoreResult(result || null);
        showSuccess('Resume scored successfully');
      } catch (error: any) {
        if (__DEV__) {
          console.error('Failed to score resume:', error);
        }
        if (error?.response?.status === 429) {
          showError(
            'OpenAI quota exceeded. Add billing/credits or switch provider to Claude.',
          );
        } else {
          showError(
            error?.response?.data?.detail ||
              error?.message ||
              'Failed to score resume',
          );
        }
      } finally {
        setAiScoring(false);
      }
    },
    [buildResumeTextForScoring, experience],
  );

  const openAIScorePicker = useCallback(() => {
    Alert.alert('Choose AI Provider', 'Select provider for ATS scoring.', [
      { text: 'OpenAI', onPress: () => handleScoreResume('openai') },
      { text: 'Claude', onPress: () => handleScoreResume('claude') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [handleScoreResume]);

  // Handle back button with unsaved changes check
  const handleBackPress = useCallback(() => {
    if (hasUnsavedChanges()) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. What would you like to do?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              // Set flag to prevent beforeRemove listener from showing alert
              isNavigatingAwayRef.current = true;
              // Reset to initial state
              if (initialDataRef.current) {
                setName(initialDataRef.current.name);
                setEmail(initialDataRef.current.email);
                setPhone(initialDataRef.current.phone);
                setLocation(initialDataRef.current.location);
                setSkills([...initialDataRef.current.skills]);
                setExperience(
                  JSON.parse(JSON.stringify(initialDataRef.current.experience)),
                );
                setEducation(
                  JSON.parse(JSON.stringify(initialDataRef.current.education)),
                );
                setCertifications(
                  JSON.parse(
                    JSON.stringify(initialDataRef.current.certifications),
                  ),
                );
                setBackgroundInformation(
                  initialDataRef.current.backgroundInformation,
                );
              }
              // Check if we can go back before calling goBack
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                // If no screen to go back to, navigate to a default screen
                navigation.navigate('MainTabs' as never);
              }
            },
          },
          {
            text: 'Save',
            onPress: async () => {
              // Set flag to prevent beforeRemove listener from showing alert
              isNavigatingAwayRef.current = true;
              await handleSave();
            },
          },
        ],
      );
      return true; // Prevent default back action
    }
    isNavigatingAwayRef.current = true;
    // Check if we can go back before calling goBack
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // If no screen to go back to, navigate to a default screen
      navigation.navigate('MainTabs' as never);
    }
  }, [hasUnsavedChanges, navigation, handleSave]);

  // Set up navigation listener to intercept back button
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      // If we're already handling navigation (from handleBackPress), allow it
      if (isNavigatingAwayRef.current) {
        isNavigatingAwayRef.current = false; // Reset flag
        return;
      }

      if (!hasUnsavedChanges()) {
        // No unsaved changes, allow default behavior
        return;
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      // Show alert
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. What would you like to do?',
        [
          {
            text: "Don't Leave",
            style: 'cancel',
            onPress: () => {},
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              // Reset to initial state and navigate back
              if (initialDataRef.current) {
                setName(initialDataRef.current.name);
                setEmail(initialDataRef.current.email);
                setPhone(initialDataRef.current.phone);
                setLocation(initialDataRef.current.location);
                setSkills([...initialDataRef.current.skills]);
                setExperience(
                  JSON.parse(JSON.stringify(initialDataRef.current.experience)),
                );
                setEducation(
                  JSON.parse(JSON.stringify(initialDataRef.current.education)),
                );
                setCertifications(
                  JSON.parse(
                    JSON.stringify(initialDataRef.current.certifications),
                  ),
                );
                setBackgroundInformation(
                  initialDataRef.current.backgroundInformation,
                );
              }
              navigation.dispatch(e.data.action);
            },
          },
          {
            text: 'Save',
            onPress: async () => {
              // Save first, then navigate back
              try {
                await handleSave();
                // After save, navigate back
                navigation.dispatch(e.data.action);
              } catch (error) {
                // If save fails, don't navigate back
                if (__DEV__) {
                  logger.error('Save failed, staying on screen:', error);
                }
              }
            },
          },
        ],
      );
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges, handleSave]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="My Resume" onBackPress={handleBackPress} />
        <Loader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="My Resume" onBackPress={handleBackPress} />

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid
        extraScrollHeight={100}
      >
        {/* Resume Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resume</Text>
          <Text style={styles.sectionSubtitle}>
            Choose one option: Upload a pre-built resume file OR create an
            in-app resume
          </Text>

          {resumeFileUrl ? (
            <View style={styles.uploadedFileContainer}>
              <View style={styles.uploadedFileInfo}>
                <FileText size={24} color={COLORS.blue} />
                <View style={styles.uploadedFileDetails}>
                  <Text style={styles.uploadedFileName} numberOfLines={1}>
                    {(() => {
                      const fileName = resumeFileName || 'resume.pdf';
                      // Truncate very long filenames for better display
                      if (fileName.length > 40) {
                        const extension = fileName.substring(
                          fileName.lastIndexOf('.'),
                        );
                        const nameWithoutExt = fileName.substring(
                          0,
                          fileName.lastIndexOf('.'),
                        );
                        return `${nameWithoutExt.substring(
                          0,
                          35,
                        )}...${extension}`;
                      }
                      return fileName;
                    })()}
                  </Text>
                  <Text style={styles.uploadedFileStatus}>
                    Resume file uploaded
                  </Text>
                </View>
              </View>
              <View style={styles.uploadedFileActions}>
                <TouchableOpacity
                  onPress={handleViewResumeFile}
                  style={styles.viewFileButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewFileButtonText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDeleteResumeFile}
                  style={styles.deleteFileButton}
                  activeOpacity={0.7}
                >
                  <Trash2 size={18} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {!DocumentPicker && (
                <View style={styles.warningContainer}>
                  <Text style={styles.warningText}>
                    File upload requires rebuilding the app. Please rebuild the
                    iOS app to enable this feature.
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={handleUploadResumeFile}
                disabled={uploadingFile || !DocumentPicker}
                style={[
                  styles.uploadButton,
                  (uploadingFile || !DocumentPicker) &&
                    styles.uploadButtonDisabled,
                ]}
                activeOpacity={0.7}
              >
                <Upload size={20} color={COLORS.white} />
                <Text style={styles.uploadButtonText}>
                  {uploadingFile
                    ? 'Uploading...'
                    : 'Upload Resume File (PDF/DOCX)'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Skills Section - Show when resume file is uploaded (required) - Before OR divider */}
          {resumeFileUrl && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Skills *</Text>
              <Text style={styles.sectionSubtitle}>
                Add your skills to help recruiters find you (Required)
              </Text>

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

              {errors.skills && (
                <Text style={styles.errorText}>{errors.skills}</Text>
              )}

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
          )}

          {resumeFileUrl && (
            <>
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
              </View>
              <TouchableOpacity
                onPress={() => {
                  showConfirmation(
                    'Switch to In-App Resume?',
                    'Deleting the uploaded file will allow you to create an in-app resume. Do you want to continue?',
                    () => {
                      setResumeFileUrl(undefined);
                      setResumeFilePublicId(undefined);
                      setResumeFileName(undefined);
                      showSuccess('You can now create an in-app resume');
                    },
                    undefined,
                    'Switch',
                    'Cancel',
                  );
                }}
                style={styles.switchToInAppButton}
                activeOpacity={0.7}
              >
                <Text style={styles.switchToInAppButtonText}>
                  Create In-App Resume Instead
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* In-App Resume Builder - Always show */}
        {!resumeFileUrl && (
          <>
            {/* Personal Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>

              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Full Name *"
                placeholderTextColor={COLORS.lightGray}
                value={name}
                onChangeText={text => {
                  setName(text);
                  // Clear error when user starts typing
                  if (errors.name) {
                    setErrors({ ...errors, name: undefined });
                  }
                }}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}

              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Email *"
                placeholderTextColor={COLORS.lightGray}
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  // Clear error when user starts typing
                  if (errors.email) {
                    setErrors({ ...errors, email: undefined });
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}

              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                placeholder="Phone *"
                placeholderTextColor={COLORS.lightGray}
                value={phone}
                onChangeText={text => {
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
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}

              <TextInput
                style={[styles.input, errors.location && styles.inputError]}
                placeholder="Location *"
                placeholderTextColor={COLORS.lightGray}
                value={location}
                onChangeText={text => {
                  setLocation(text);
                  // Clear error when user starts typing
                  if (errors.location) {
                    setErrors({ ...errors, location: undefined });
                  }
                }}
              />
              {errors.location && (
                <Text style={styles.errorText}>{errors.location}</Text>
              )}
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

              {errors.skills && (
                <Text style={styles.errorText}>{errors.skills}</Text>
              )}

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
                <TouchableOpacity
                  onPress={handleAddExperience}
                  style={styles.addSectionButton}
                  activeOpacity={0.7}
                >
                  <Plus size={18} color={COLORS.green} />
                  <Text style={styles.addSectionText}>Add</Text>
                </TouchableOpacity>
              </View>

              {experience.map((exp, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemCardHeader}>
                    <Text style={styles.itemCardTitle}>
                      Experience #{index + 1}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveExperience(index)}
                    >
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={[
                      styles.input,
                      errors.experience?.[index]?.title && styles.inputError,
                    ]}
                    placeholder="Job Title *"
                    placeholderTextColor={COLORS.lightGray}
                    value={exp.title}
                    onChangeText={value => {
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
                        setErrors({
                          ...errors,
                          experience:
                            Object.keys(newExpErrors).length > 0
                              ? newExpErrors
                              : undefined,
                        });
                      }
                    }}
                  />
                  {errors.experience?.[index]?.title && (
                    <Text style={styles.errorText}>
                      {errors.experience[index].title}
                    </Text>
                  )}

                  <TextInput
                    style={[
                      styles.input,
                      errors.experience?.[index]?.company && styles.inputError,
                    ]}
                    placeholder="Company *"
                    placeholderTextColor={COLORS.lightGray}
                    value={exp.company}
                    onChangeText={value => {
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
                        setErrors({
                          ...errors,
                          experience:
                            Object.keys(newExpErrors).length > 0
                              ? newExpErrors
                              : undefined,
                        });
                      }
                    }}
                  />
                  {errors.experience?.[index]?.company && (
                    <Text style={styles.errorText}>
                      {errors.experience[index].company}
                    </Text>
                  )}

                  <View style={styles.rowInputs}>
                    <TouchableOpacity
                      style={[
                        styles.input,
                        styles.halfInput,
                        styles.dateInput,
                        errors.experience?.[index]?.startDate &&
                          styles.inputError,
                      ]}
                      onPress={() => openDatePicker('start', index)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={
                          exp.startDate
                            ? styles.dateInputText
                            : styles.dateInputPlaceholder
                        }
                      >
                        {exp.startDate
                          ? formatDateDisplay(exp.startDate)
                          : 'Start Date *'}
                      </Text>
                      <CalendarIcon size={20} color={COLORS.gray} />
                    </TouchableOpacity>

                    {!exp.current && (
                      <TouchableOpacity
                        style={[
                          styles.input,
                          styles.halfInput,
                          styles.dateInput,
                        ]}
                        onPress={() => openDatePicker('end', index)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={
                            exp.endDate
                              ? styles.dateInputText
                              : styles.dateInputPlaceholder
                          }
                        >
                          {exp.endDate
                            ? formatDateDisplay(exp.endDate)
                            : 'End Date'}
                        </Text>
                        <CalendarIcon size={20} color={COLORS.gray} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {errors.experience?.[index]?.startDate && (
                    <Text style={styles.errorText}>
                      {errors.experience[index].startDate}
                    </Text>
                  )}

                  <TouchableOpacity
                    onPress={() =>
                      handleUpdateExperience(index, 'current', !exp.current)
                    }
                    style={styles.checkboxContainer}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        exp.current && styles.checkboxChecked,
                      ]}
                    >
                      {exp.current && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>Current Job</Text>
                  </TouchableOpacity>

                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Description (optional)"
                    placeholderTextColor={COLORS.lightGray}
                    value={exp.description}
                    onChangeText={value =>
                      handleUpdateExperience(index, 'description', value)
                    }
                    multiline
                  />
                </View>
              ))}
            </View>

            {/* Education */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Education</Text>
                <TouchableOpacity
                  onPress={handleAddEducation}
                  style={styles.addSectionButton}
                  activeOpacity={0.7}
                >
                  <Plus size={18} color={COLORS.green} />
                  <Text style={styles.addSectionText}>Add</Text>
                </TouchableOpacity>
              </View>

              {education.map((edu, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemCardHeader}>
                    <Text style={styles.itemCardTitle}>
                      Education #{index + 1}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveEducation(index)}
                    >
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={[
                      styles.input,
                      errors.education?.[index]?.degree && styles.inputError,
                    ]}
                    placeholder="Degree *"
                    placeholderTextColor={COLORS.lightGray}
                    value={edu.degree}
                    onChangeText={value => {
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
                        setErrors({
                          ...errors,
                          education:
                            Object.keys(newEduErrors).length > 0
                              ? newEduErrors
                              : undefined,
                        });
                      }
                    }}
                  />
                  {errors.education?.[index]?.degree && (
                    <Text style={styles.errorText}>
                      {errors.education[index].degree}
                    </Text>
                  )}

                  <TextInput
                    style={[
                      styles.input,
                      errors.education?.[index]?.institution &&
                        styles.inputError,
                    ]}
                    placeholder="Institution *"
                    placeholderTextColor={COLORS.lightGray}
                    value={edu.institution}
                    onChangeText={value => {
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
                        setErrors({
                          ...errors,
                          education:
                            Object.keys(newEduErrors).length > 0
                              ? newEduErrors
                              : undefined,
                        });
                      }
                    }}
                  />
                  {errors.education?.[index]?.institution && (
                    <Text style={styles.errorText}>
                      {errors.education[index].institution}
                    </Text>
                  )}

                  <View style={styles.rowInputs}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.halfInput,
                        errors.education?.[index]?.graduationYear &&
                          styles.inputError,
                      ]}
                      placeholder="Graduation Year *"
                      placeholderTextColor={COLORS.lightGray}
                      value={edu.graduationYear?.toString()}
                      onChangeText={value => {
                        handleUpdateEducation(
                          index,
                          'graduationYear',
                          value ? parseInt(value, 10) : undefined,
                        );
                        // Clear error when user starts typing
                        if (errors.education?.[index]?.graduationYear) {
                          const newEduErrors = { ...errors.education };
                          if (newEduErrors[index]) {
                            delete newEduErrors[index].graduationYear;
                            if (Object.keys(newEduErrors[index]).length === 0) {
                              delete newEduErrors[index];
                            }
                          }
                          setErrors({
                            ...errors,
                            education:
                              Object.keys(newEduErrors).length > 0
                                ? newEduErrors
                                : undefined,
                          });
                        }
                      }}
                      keyboardType="numeric"
                    />

                    <TextInput
                      style={[styles.input, styles.halfInput]}
                      placeholder="GPA (optional)"
                      placeholderTextColor={COLORS.lightGray}
                      value={edu.gpa?.toString() || ''}
                      onChangeText={value => {
                        // Convert GPA to number, ensuring it's always a number or undefined
                        const numValue = value.trim()
                          ? parseFloat(value)
                          : undefined;
                        handleUpdateEducation(
                          index,
                          'gpa',
                          isNaN(numValue as number) ? undefined : numValue,
                        );
                      }}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  {errors.education?.[index]?.graduationYear && (
                    <Text style={styles.errorText}>
                      {errors.education[index].graduationYear}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* Certifications */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Certifications</Text>
                <TouchableOpacity
                  onPress={handleAddCertification}
                  style={styles.addSectionButton}
                  activeOpacity={0.7}
                >
                  <Plus size={18} color={COLORS.green} />
                  <Text style={styles.addSectionText}>Add</Text>
                </TouchableOpacity>
              </View>

              {certifications.map((cert, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemCardHeader}>
                    <Text style={styles.itemCardTitle}>
                      Certification #{index + 1}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveCertification(index)}
                    >
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={[
                      styles.input,
                      errors.certification?.[index]?.name && styles.inputError,
                    ]}
                    placeholder="Certification Name *"
                    placeholderTextColor={COLORS.lightGray}
                    value={cert.name}
                    onChangeText={value => {
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
                        setErrors({
                          ...errors,
                          certification:
                            Object.keys(newCertErrors).length > 0
                              ? newCertErrors
                              : undefined,
                        });
                      }
                    }}
                  />
                  {errors.certification?.[index]?.name && (
                    <Text style={styles.errorText}>
                      {errors.certification[index].name}
                    </Text>
                  )}

                  <TextInput
                    style={[
                      styles.input,
                      errors.certification?.[index]?.issuer &&
                        styles.inputError,
                    ]}
                    placeholder="Issuer *"
                    placeholderTextColor={COLORS.lightGray}
                    value={cert.issuer}
                    onChangeText={value => {
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
                        setErrors({
                          ...errors,
                          certification:
                            Object.keys(newCertErrors).length > 0
                              ? newCertErrors
                              : undefined,
                        });
                      }
                    }}
                  />
                  {errors.certification?.[index]?.issuer && (
                    <Text style={styles.errorText}>
                      {errors.certification[index].issuer}
                    </Text>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.input,
                      styles.dateInput,
                      errors.certification?.[index]?.date && styles.inputError,
                    ]}
                    onPress={() => openDatePicker('certification', index)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={
                        cert.date
                          ? styles.dateInputText
                          : styles.dateInputPlaceholder
                      }
                    >
                      {cert.date ? formatDateDisplay(cert.date) : 'Date *'}
                    </Text>
                    <CalendarIcon size={20} color={COLORS.gray} />
                  </TouchableOpacity>
                  {errors.certification?.[index]?.date && (
                    <Text style={styles.errorText}>
                      {errors.certification[index].date}
                    </Text>
                  )}

                  {/* Certificate Image Upload */}
                  <View style={styles.certificateImageSection}>
                    <Text style={styles.certificateImageLabel}>
                      Certificate Image (Optional)
                    </Text>
                    <ImageUpload
                      currentImageUrl={cert.imageUrl}
                      currentPublicId={cert.imagePublicId}
                      onImageUploaded={(imageUrl, publicId) => {
                        const updated = [...certifications];
                        updated[index] = {
                          ...updated[index],
                          imageUrl,
                          imagePublicId: publicId,
                        };
                        setCertifications(updated);
                        showSuccess('Certificate image uploaded successfully');
                      }}
                      onImageDeleted={() => {
                        const updated = [...certifications];
                        updated[index] = {
                          ...updated[index],
                          imageUrl: undefined,
                          imagePublicId: undefined,
                        };
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
              <View style={styles.aiButtonsContainer}>
                <TouchableOpacity
                  onPress={openAIGeneratePicker}
                  disabled={
                    aiGenerating ||
                    aiValidating ||
                    aiScoring ||
                    skills.length === 0
                  }
                  style={[
                    styles.aiGenerateButton,
                    (aiGenerating ||
                      aiValidating ||
                      aiScoring ||
                      skills.length === 0) &&
                      styles.aiGenerateButtonDisabled,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.aiGenerateButtonText}>
                    {aiGenerating ? 'Generating...' : 'Generate with AI'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={openAIValidatePicker}
                  disabled={
                    aiGenerating ||
                    aiValidating ||
                    aiScoring ||
                    !backgroundInformation.trim()
                  }
                  style={[
                    styles.aiValidateButton,
                    (aiGenerating ||
                      aiValidating ||
                      aiScoring ||
                      !backgroundInformation.trim()) &&
                      styles.aiGenerateButtonDisabled,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.aiGenerateButtonText}>
                    {aiValidating ? 'Validating...' : 'Validate with AI'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about yourself, your background, and what makes you unique..."
                placeholderTextColor={COLORS.lightGray}
                value={backgroundInformation}
                onChangeText={setBackgroundInformation}
                multiline
              />
              <TouchableOpacity
                onPress={openAIScorePicker}
                disabled={
                  aiGenerating || aiValidating || aiScoring || aiAnalyzingProfile
                }
                style={[
                  styles.aiScoreButton,
                  (aiGenerating ||
                    aiValidating ||
                    aiScoring ||
                    aiAnalyzingProfile) &&
                    styles.aiGenerateButtonDisabled,
                ]}
                activeOpacity={0.7}
              >
                <Text style={styles.aiGenerateButtonText}>
                  {aiScoring ? 'Scoring...' : 'Score with AI'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={openAIProfileInsightsPicker}
                disabled={
                  aiGenerating || aiValidating || aiScoring || aiAnalyzingProfile
                }
                style={[
                  styles.aiScoreButton,
                  (aiGenerating ||
                    aiValidating ||
                    aiScoring ||
                    aiAnalyzingProfile) &&
                    styles.aiGenerateButtonDisabled,
                ]}
                activeOpacity={0.7}
              >
                <Text style={styles.aiGenerateButtonText}>
                  {aiAnalyzingProfile
                    ? 'Analyzing...'
                    : 'Profile AI Insights'}
                </Text>
              </TouchableOpacity>

              {resumeScoreResult ? (
                <View style={styles.scoreCard}>
                  <Text style={styles.scoreTitle}>
                    ATS Score: {resumeScoreResult.overall_score ?? 'N/A'}/100
                  </Text>
                  <Text style={styles.scoreSubText}>
                    ATS Friendly:{' '}
                    {resumeScoreResult.ats_friendly ? 'Yes' : 'No'}
                  </Text>
                  {resumeScoreResult.sections ? (
                    <Text style={styles.scoreSubText}>
                      Sections - Summary:{' '}
                      {resumeScoreResult.sections.summary ?? 'N/A'}, Experience:{' '}
                      {resumeScoreResult.sections.experience ?? 'N/A'}, Skills:{' '}
                      {resumeScoreResult.sections.skills ?? 'N/A'}
                    </Text>
                  ) : null}
                  {resumeScoreResult.strengths?.length ? (
                    <Text style={styles.scoreSubText}>
                      Strengths: {resumeScoreResult.strengths.join(', ')}
                    </Text>
                  ) : null}
                  {resumeScoreResult.improvements?.length ? (
                    <Text style={styles.scoreSubText}>
                      Improvements: {resumeScoreResult.improvements.join(', ')}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              {profileInsightsResult ? (
                <View style={styles.scoreCard}>
                  <Text style={styles.scoreTitle}>Profile Insights</Text>
                  {profileInsightsResult.missing_critical_fields?.length ? (
                    <Text style={styles.scoreSubText}>
                      Missing: {profileInsightsResult.missing_critical_fields.join(', ')}
                    </Text>
                  ) : null}
                  {profileInsightsResult.suggested_certifications?.length ? (
                    <Text style={styles.scoreSubText}>
                      Certifications: {profileInsightsResult.suggested_certifications.join(', ')}
                    </Text>
                  ) : null}
                  {profileInsightsResult.suggested_industries?.length ? (
                    <Text style={styles.scoreSubText}>
                      Industries: {profileInsightsResult.suggested_industries.join(', ')}
                    </Text>
                  ) : null}
                  {profileInsightsResult.next_actions?.length ? (
                    <Text style={styles.scoreSubText}>
                      Next actions: {profileInsightsResult.next_actions.join(', ')}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>

            {/* Export ATS Format Button */}
            <TouchableOpacity
              onPress={handleExportATS}
              disabled={exporting || !name.trim() || !email.trim()}
              style={[
                styles.exportButton,
                (!name.trim() || !email.trim()) && styles.exportButtonDisabled,
              ]}
              activeOpacity={0.7}
            >
              <Download size={18} color={COLORS.white} />
              <Text style={styles.exportButtonText}>
                {exporting ? 'Exporting...' : 'Export resume'}
              </Text>
            </TouchableOpacity>

            {/* Save Button */}
            <AppButton
              title={saving ? 'Saving...' : 'Save Resume'}
              onPress={handleSave}
              disabled={saving}
              loading={saving}
              style={styles.saveButton}
            />
          </>
        )}

        {/* Save Button for uploaded resume with skills */}
        {resumeFileUrl && (
          <AppButton
            title={saving ? 'Saving...' : 'Save Resume'}
            onPress={handleSave}
            disabled={saving}
            loading={saving}
            style={styles.saveButton}
          />
        )}
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
            <SafeAreaView style={styles.modalContent} edges={['bottom']}>
              <View
                style={styles.modalContentInner}
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
                  <View style={styles.modalTitleContainer}>
                    <Text style={styles.modalTitle}>
                      Select{' '}
                      {datePickerType === 'start'
                        ? 'Start'
                        : datePickerType === 'end'
                        ? 'End'
                        : 'Certification'}{' '}
                      Date
                    </Text>
                    <Text style={styles.modalSubtitle}>(Month & Year)</Text>
                  </View>
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
                    minimumDate={
                      datePickerType === 'end' &&
                      datePickerIndex >= 0 &&
                      experience[datePickerIndex]?.startDate
                        ? (() => {
                            const [year, month] =
                              experience[datePickerIndex].startDate.split('-');
                            return new Date(
                              parseInt(year, 10),
                              parseInt(month, 10) - 1,
                              1,
                            );
                          })()
                        : undefined
                    }
                    maximumDate={new Date()}
                  />
                </View>
              </View>
            </SafeAreaView>
          </TouchableOpacity>
        </Modal>
      )}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={
            datePickerType === 'end' &&
            datePickerIndex >= 0 &&
            experience[datePickerIndex]?.startDate
              ? (() => {
                  const [year, month] =
                    experience[datePickerIndex].startDate.split('-');
                  return new Date(
                    parseInt(year, 10),
                    parseInt(month, 10) - 1,
                    1,
                  );
                })()
              : undefined
          }
          maximumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
};

const styles = resumeScreenStyles;

export default ResumeScreen;
