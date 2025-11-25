import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import {
  createConsultantProfile,
  getConsultantProfile,
  updateConsultantProfile,
  ConsultantProfile,
  ConsultantProfileInput,
} from '../../../services/consultantFlow.service';
import { consultantProfileFlowStyles } from '../../../constants/styles/consultantProfileFlowStyles';
import { StepIndicator } from '../../../components/consultant/StepIndicator';
import { StatusBadge } from '../../../components/consultant/StatusComponents';
import { FormInput, TextArea, CategorySelector, SpecialtyManager } from '../../../components/consultant/FormComponents';
import ImageUpload from '../../../components/ui/ImageUpload';
import { consultantFlowStyles } from '../../../constants/styles/consultantFlowStyles';
import { showSuccess, showError, handleApiError } from '../../../utils/toast';
import { UserService } from '../../../services/user.service';

const CONSULTANT_CATEGORIES = [
  'Career Consulting',
  'Business Consulting',
  'Financial Consulting',
  'Marketing Consulting',
  'Legal Consulting',
  'Technical Consulting',
  'Other',
];

const FORM_STEPS = [
  { id: 'personal', title: 'Personal' },
  { id: 'professional', title: 'Professional' },
  { id: 'image', title: 'Photo' },
  { id: 'review', title: 'Review' },
];

export default function ConsultantProfileFlow() {
  const navigation = useNavigation();
  const { user, refreshConsultantStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ConsultantProfile | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('0');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [title, setTitle] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImagePublicId, setProfileImagePublicId] = useState<string | null>(null);
  
  // Validation errors state
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  const loadProfile = useCallback(async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      const existingProfile = await getConsultantProfile(user.uid);
      
      setProfile(existingProfile);
      // Populate form with existing data
      setFullName(existingProfile.personalInfo.fullName);
      setEmail(existingProfile.personalInfo.email);
      setBio(existingProfile.personalInfo.bio);
      setExperience(String(existingProfile.personalInfo.experience));
      setCategory(existingProfile.professionalInfo.category);
      setCustomCategory('');
      setTitle(existingProfile.professionalInfo.title || '');
      setSpecialties(existingProfile.professionalInfo.specialties || []);
      setProfileImage(existingProfile.personalInfo?.profileImage || null);
      setProfileImagePublicId(null); // This field doesn't exist in the type
    } catch {
      // Profile doesn't exist, prefill with Firebase user data
      if (user.email) setEmail(user.email);
      if (user.displayName) {
        setFullName(user.displayName);
      } else if (user.email) {
        // Fallback: extract name from email if displayName is not available
        const emailName = user.email.split('@')[0];
        setFullName(emailName);
      }
      
      // Pre-fill profile image from student profile (Firebase photoURL or backend profileImage)
      if (user.photoURL) {
        setProfileImage(user.photoURL);
                if (__DEV__) {
          console.log('Pre-filled profile image from Firebase photoURL:', user.photoURL)
        };
      } else {
        // Try to get from backend user profile
        try {
          const backendProfile = await UserService.getUserProfile();
          if (backendProfile?.profileImage) {
            setProfileImage(backendProfile.profileImage);
                        if (__DEV__) {
              console.log('Pre-filled profile image from backend profile:', backendProfile.profileImage)
            };
          }
        } catch (error) {
                    if (__DEV__) {
            console.log('Could not fetch backend profile for image:', error)
          };
          // Silently fail - image is optional
        }
      }
      
            if (__DEV__) {
        console.log('No existing profile, starting fresh')
      };
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user, loadProfile]);

  const addSpecialty = (specialty: string) => {
    if (specialty.trim() && !specialties.includes(specialty.trim())) {
      setSpecialties([...specialties, specialty.trim()]);
    }
  };

  const removeSpecialty = (item: string) => {
    setSpecialties(specialties.filter(s => s !== item));
  };

  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleStepNavigation = (direction: 'next' | 'previous') => {
    if (direction === 'next') {
      const validation = validateForm(currentStep);
      if (!validation.isValid) {
        setFieldErrors(validation.errors);
        showError('Please fill in all required fields before proceeding');
        return;
      }
      // Clear errors for current step when moving to next
      setFieldErrors({});
    }
    
    if (direction === 'next' && currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (direction === 'previous' && currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Clear field errors when going back to previous step
      setFieldErrors({});
    }
  };

  const validateForm = (step?: number): { isValid: boolean; errors: {[key: string]: string} } => {
    const errors: {[key: string]: string} = {};
    
    // Validate based on current step or all steps
    if (step === undefined || step === 0) {
      // Personal Information validation
      if (!fullName.trim()) {
        errors.fullName = 'Full name is required';
      }
      if (!email.trim()) {
        errors.email = 'Email is required';
      } else if (!email.includes('@') || !email.includes('.')) {
        errors.email = 'Please enter a valid email address';
      }
      if (!bio.trim()) {
        errors.bio = 'Professional bio is required';
      } else if (bio.trim().length < 50) {
        errors.bio = 'Bio must be at least 50 characters';
      }
      if (!experience.trim() || parseInt(experience, 10) < 0) {
        errors.experience = 'Years of experience is required';
      }
    }
    
    if (step === undefined || step === 1) {
      // Professional Information validation
      if (!category) {
        errors.category = 'Please select a category';
      }
      if (category === 'Other' && !customCategory.trim()) {
        errors.customCategory = 'Please enter a custom category';
      }
      if (!title.trim()) {
        errors.title = 'Professional title is required';
      }
    }
    
    if (step === undefined || step === 2) {
      // Profile Image validation (optional but recommended)
      if (!profileImage) {
        errors.profileImage = 'Profile image is recommended for better visibility';
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  const handleSubmit = async () => {
    const validation = validateForm();
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      showError('Please fill in all required fields');
      return;
    }
    
    if (!user?.uid) {
      showError('User not authenticated');
      return;
    }

    setIsSaving(true);
    try {
      // Ensure category is not empty
      const finalCategory = category === 'Other' ? customCategory : category;
      if (!finalCategory || finalCategory.trim() === '') {
        showError('Please select or enter a category');
        setFieldErrors({ category: 'Category is required' });
        setIsSaving(false);
        return;
      }

      const profileData: ConsultantProfileInput = {
        uid: user.uid,
        personalInfo: {
          fullName,
          email,
          bio,
          experience: parseInt(experience, 10) || 0,
          profileImage: profileImage || undefined,
          profileImagePublicId: profileImagePublicId || undefined,
        },
        professionalInfo: {
          category: finalCategory.trim(),
          title: title.trim() || undefined,
          specialties,
        },
      };

            if (__DEV__) {
        console.log('Sending profile data:', JSON.stringify(profileData, null, 2))
      };

      if (profile) {
        await updateConsultantProfile(user.uid, profileData);
        showSuccess('Profile updated successfully!');
        await refreshConsultantStatus();
        navigation.navigate('PendingApproval' as never);
      } else {
        await createConsultantProfile(profileData);
        showSuccess('Profile submitted for verification! You will be notified once approved.');
        await refreshConsultantStatus();
        // Navigate to pending approval screen
        navigation.navigate('PendingApproval' as never);
      }
    } catch (error: any) {
            if (__DEV__) {
        console.error('Error saving profile:', error)
      };
      handleApiError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const getCompletedSteps = () => {
    if (!profile) return [];
    return profile.status === 'approved' ? [0, 1, 2, 3] : [];
  };

  const renderStepContent = () => {
    // Only show validation errors if user has attempted to proceed
    const hasErrors = Object.keys(fieldErrors).length > 0;
    
    switch (currentStep) {
      case 0: // Personal Information
        return (
          <View style={consultantFlowStyles.section}>
            <Text style={consultantFlowStyles.sectionTitle}>Personal Information</Text>
            
            {hasErrors && (
              <View style={consultantProfileFlowStyles.errorContainer}>
                <Text style={consultantProfileFlowStyles.errorTitle}>
                  Required Fields Missing
                </Text>
                <Text style={consultantProfileFlowStyles.errorText}>
                  Please fill in all required fields before proceeding to the next step.
                </Text>
              </View>
            )}
            
            <FormInput
              label="Full Name"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                clearFieldError('fullName');
              }}
              placeholder="John Doe"
              required
              error={fieldErrors.fullName}
            />

            <FormInput
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearFieldError('email');
              }}
              placeholder="john@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              required
              error={fieldErrors.email}
            />

            <TextArea
              label="Professional Bio"
              value={bio}
              onChangeText={(text) => {
                setBio(text);
                clearFieldError('bio');
              }}
              placeholder="Tell us about your experience..."
              required
              minLength={50}
              error={fieldErrors.bio}
            />

            <FormInput
              label="Years of Experience"
              value={experience}
              onChangeText={(text) => {
                setExperience(text);
                clearFieldError('experience');
              }}
              placeholder="5"
              keyboardType="numeric"
              required
              error={fieldErrors.experience}
            />
          </View>
        );

      case 1: // Professional Information
        return (
          <View style={consultantFlowStyles.section}>
            <Text style={consultantFlowStyles.sectionTitle}>Professional Details</Text>
            
            {hasErrors && (
              <View style={consultantProfileFlowStyles.errorContainer}>
                <Text style={consultantProfileFlowStyles.errorTitle}>
                  Required Fields Missing
                </Text>
                <Text style={consultantProfileFlowStyles.errorText}>
                  Please fill in all required fields before proceeding to the next step.
                </Text>
              </View>
            )}
            
            <CategorySelector
              label="Category"
              categories={CONSULTANT_CATEGORIES}
              selectedCategory={category}
              onCategorySelect={(cat) => {
                setCategory(cat);
                clearFieldError('category');
              }}
              customCategory={customCategory}
              onCustomCategoryChange={(text) => {
                setCustomCategory(text);
                clearFieldError('customCategory');
              }}
              required
              useDropdown={true}
              error={fieldErrors.category || fieldErrors.customCategory}
            />

            <FormInput
              label="Professional Title"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                clearFieldError('title');
              }}
              placeholder="Senior Career Consultant"
              required
              error={fieldErrors.title}
            />

            <SpecialtyManager
              label="Specialties"
              specialties={specialties}
              onAddSpecialty={addSpecialty}
              onRemoveSpecialty={removeSpecialty}
            />
          </View>
        );

      case 2: // Profile Image
        return (
          <View style={consultantFlowStyles.section}>
            <Text style={consultantFlowStyles.sectionTitle}>Profile Image</Text>
            
            {hasErrors && (
              <View style={consultantProfileFlowStyles.warningContainer}>
                <Text style={consultantProfileFlowStyles.warningTitle}>
                  Recommended
                </Text>
                <Text style={consultantProfileFlowStyles.warningText}>
                  Adding a profile image helps build trust with potential clients.
                </Text>
              </View>
            )}
            
            <View style={consultantFlowStyles.profileImageContainer}>
              <ImageUpload
                currentImageUrl={profileImage || undefined}
                currentPublicId={profileImagePublicId || undefined}
                uploadType="consultant"
                onImageUploaded={(imageUrl, publicId) => {
                  setProfileImage(imageUrl);
                  setProfileImagePublicId(publicId);
                  clearFieldError('profileImage');
                }}
                onImageDeleted={() => {
                  setProfileImage(null);
                  setProfileImagePublicId(null);
                }}
                placeholder="Upload your professional photo"
              />
            </View>
            
            {fieldErrors.profileImage && (
              <View style={consultantProfileFlowStyles.errorMessageContainer}>
                <Text style={consultantProfileFlowStyles.infoText}>
                  {fieldErrors.profileImage}
                </Text>
              </View>
            )}
          </View>
        );

      case 3: // Review
        return (
          <View style={consultantFlowStyles.section}>
            <Text style={consultantFlowStyles.sectionTitle}>Review Your Profile</Text>
            
            <View style={consultantProfileFlowStyles.reviewSectionContent}>
              <Text style={consultantProfileFlowStyles.reviewSectionTitleLarge}>Personal Information</Text>
              <Text style={consultantProfileFlowStyles.summaryText}>Name: {fullName}</Text>
              <Text style={consultantProfileFlowStyles.summaryText}>Email: {email}</Text>
              <Text style={consultantProfileFlowStyles.summaryText}>Experience: {experience} years</Text>
            </View>

            <View style={consultantProfileFlowStyles.reviewSectionContent}>
              <Text style={consultantProfileFlowStyles.reviewSectionTitleLarge}>Professional Information</Text>
              <Text style={consultantProfileFlowStyles.summaryText}>Category: {category === 'Other' ? customCategory : category}</Text>
              <Text style={consultantProfileFlowStyles.summaryText}>Title: {title || 'Not specified'}</Text>
              {specialties.length > 0 && (
                <Text style={consultantProfileFlowStyles.summaryText}>Specialties: {specialties.join(', ')}</Text>
              )}
            </View>

            <View>
              <Text style={consultantProfileFlowStyles.reviewSectionTitleLarge}>Profile Image</Text>
              <Text style={consultantProfileFlowStyles.summaryText}>
                {profileImage ? 'Image uploaded' : 'No image uploaded'}
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={consultantFlowStyles.container}>
        <View style={consultantFlowStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={consultantFlowStyles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={consultantFlowStyles.container}>
      <View style={consultantProfileFlowStyles.mainContainer}>
        {/* Header */}
        <View style={consultantFlowStyles.header}>
          <TouchableOpacity onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              // Fallback navigation if no previous screen exists
              navigation.navigate('MainTabs' as never);
            }
          }}>
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={consultantFlowStyles.headerTitle}>
            {profile ? 'Edit Profile' : 'Create Profile'}
          </Text>
          <View style={consultantFlowStyles.headerSpacer} />
        </View>

      {/* Step Indicator */}
      <StepIndicator
        steps={FORM_STEPS}
        currentStep={currentStep}
        completedSteps={getCompletedSteps()}
      />

      {/* Status Badge */}
      {profile && (
        <StatusBadge
          status={profile.status as any}
          showIcon={true}
          size="medium"
        />
      )}

      <ScrollView style={consultantProfileFlowStyles.scrollView} showsVerticalScrollIndicator={false}>
        {renderStepContent()}

        {/* Navigation Buttons */}
        <View style={consultantProfileFlowStyles.buttonContainer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[
                consultantFlowStyles.submitButton,
                consultantProfileFlowStyles.buttonInContainer,
                consultantProfileFlowStyles.previousButton,
                consultantProfileFlowStyles.buttonFlex
              ]}
              onPress={() => handleStepNavigation('previous')}
            >
              <Text style={consultantFlowStyles.submitButtonText} numberOfLines={1} adjustsFontSizeToFit={true}>Previous</Text>
            </TouchableOpacity>
          )}
          
          {currentStep < FORM_STEPS.length - 1 ? (
            <TouchableOpacity
              style={[
                consultantFlowStyles.submitButton,
                consultantProfileFlowStyles.buttonInContainer,
                currentStep === 0 ? consultantProfileFlowStyles.buttonFlexFull : consultantProfileFlowStyles.buttonFlex
              ]}
              onPress={() => handleStepNavigation('next')}
            >
              <Text style={consultantFlowStyles.submitButtonText} numberOfLines={1} adjustsFontSizeToFit={true}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                consultantFlowStyles.submitButton,
                consultantProfileFlowStyles.buttonInContainer,
                isSaving && consultantFlowStyles.submitButtonDisabled,
                currentStep === 0 ? consultantProfileFlowStyles.buttonFlexFull : consultantProfileFlowStyles.buttonFlex
              ]}
              onPress={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
              <Text style={consultantFlowStyles.submitButtonText} numberOfLines={1} adjustsFontSizeToFit={true}>
                {profile ? 'Update Profile' : 'Create Profile'}
              </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={consultantFlowStyles.bottomSpacer} />
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

