import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Eye, Edit, Trash2 } from 'lucide-react-native';
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
import { COLORS } from '../../../constants/core/colors';
import { showSuccess, showError, handleApiError } from '../../../utils/toast';
import { UserService } from '../../../services/user.service';
import { logger } from '../../../utils/logger';

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
  const [certifications, setCertifications] = useState<Array<{
    name: string;
    imageUrl?: string;
    imagePublicId?: string;
  }>>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImagePublicId, setProfileImagePublicId] = useState<string | null>(null);
  const [newCertification, setNewCertification] = useState('');
  const [newCertificationImage, setNewCertificationImage] = useState<string | null>(null);
  const [newCertificationImagePublicId, setNewCertificationImagePublicId] = useState<string | null>(null);
  
  // Modal state for certificate viewing
  const [selectedCertificate, setSelectedCertificate] = useState<{
    name: string;
    imageUrl?: string;
    imagePublicId?: string;
    index: number;
  } | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
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
      setCertifications((existingProfile.personalInfo as any)?.qualifications?.map((qual: string) => 
        typeof qual === 'string' ? { name: qual } : qual
      ) || []);
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
          logger.debug('Pre-filled profile image from Firebase photoURL:', user.photoURL)
        };
      } else {
        // Try to get from backend user profile
        try {
          const backendProfile = await UserService.getUserProfile();
          if (backendProfile?.profileImage) {
            setProfileImage(backendProfile.profileImage);
                        if (__DEV__) {
              logger.debug('Pre-filled profile image from backend profile:', backendProfile.profileImage)
            };
          }
        } catch (error) {
                    if (__DEV__) {
            logger.debug('Could not fetch backend profile for image:', error)
          };
          // Silently fail - image is optional
        }
      }
      
            if (__DEV__) {
        logger.debug('No existing profile, starting fresh')
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

  const addCertification = () => {
    if (newCertification.trim()) {
      const certificationObj = {
        name: newCertification.trim(),
        imageUrl: newCertificationImage || undefined,
        imagePublicId: newCertificationImagePublicId || undefined,
      };
      setCertifications([...certifications, certificationObj]);
      setNewCertification('');
      setNewCertificationImage(null);
      setNewCertificationImagePublicId(null);
    }
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  // Modal functions
  const openCertificateModal = (certification: any, index: number) => {
    setSelectedCertificate({ ...certification, index });
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setSelectedCertificate(null);
    setIsModalVisible(false);
  };

  const editCertificate = () => {
    if (selectedCertificate) {
      setNewCertification(selectedCertificate.name);
      setNewCertificationImage(selectedCertificate.imageUrl || null);
      setNewCertificationImagePublicId(selectedCertificate.imagePublicId || null);
      removeCertification(selectedCertificate.index);
      closeModal();
    }
  };

  const deleteCertificate = () => {
    if (selectedCertificate) {
      Alert.alert(
        'Delete Certificate',
        'Are you sure you want to delete this certificate?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              removeCertification(selectedCertificate.index);
              closeModal();
            },
          },
        ]
      );
    }
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
          qualifications: certifications.length > 0 ? certifications.map(c => ({ name: c.name, imageUrl: c.imageUrl, imagePublicId: c.imagePublicId })) : undefined,
        } as any,
        professionalInfo: {
          category: finalCategory.trim(),
          title: title.trim() || undefined,
          specialties,
        },
      };

            if (__DEV__) {
        logger.debug('Sending profile data:', JSON.stringify(profileData, null, 2))
      };

      if (profile) {
        await updateConsultantProfile(user.uid, profileData);
        showSuccess('Profile updated successfully!');
        await refreshConsultantStatus();
        navigation.navigate('ConsultantTabs' as never);
      } else {
        await createConsultantProfile(profileData);
        showSuccess('Profile created successfully! You can now access the consultant dashboard.');
        await refreshConsultantStatus();
        // Navigate directly to consultant tabs since profile is auto-approved
        navigation.navigate('ConsultantTabs' as never);
      }
    } catch (error: any) {
            if (__DEV__) {
        logger.error('Error saving profile:', error)
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

            {/* Certifications Section */}
            <View style={consultantFlowStyles.formGroup}>
              <Text style={consultantFlowStyles.label}>Certifications</Text>
              <Text style={consultantFlowStyles.helperText}>
                Add your professional certifications and qualifications
              </Text>
              
              {/* Certification Input */}
              <View style={consultantFlowStyles.inputRow}>
                <View style={consultantFlowStyles.certificationInputContainer}>
                  <FormInput
                    label=""
                    value={newCertification}
                    onChangeText={setNewCertification}
                    placeholder="e.g., PMP Certification"
                  />
                  
                  {/* Certification Image Upload */}
                  <View style={consultantFlowStyles.certificationImageContainer}>
                    <Text style={consultantFlowStyles.helperText}>
                      Certificate Image (Optional)
                    </Text>
                    <ImageUpload
                      currentImageUrl={newCertificationImage || undefined}
                      currentPublicId={newCertificationImagePublicId || undefined}
                      uploadType="consultant"
                      onImageUploaded={(imageUrl, publicId) => {
                        setNewCertificationImage(imageUrl);
                        setNewCertificationImagePublicId(publicId);
                      }}
                      onImageDeleted={() => {
                        setNewCertificationImage(null);
                        setNewCertificationImagePublicId(null);
                      }}
                      placeholder="Upload certificate image"
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    consultantFlowStyles.addButton,
                    consultantFlowStyles.smallButton,
                    !newCertification.trim() && consultantFlowStyles.disabledButton
                  ]}
                  onPress={addCertification}
                  disabled={!newCertification.trim()}
                >
                  <Text style={consultantFlowStyles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Certifications List */}
              {certifications.length > 0 && (
                <View style={consultantFlowStyles.tagsContainer}>
                  {certifications.map((certification, index) => (
                    <View key={index} style={consultantFlowStyles.certificationTag}>
                      {certification.imageUrl && (
                        <Image
                          source={{ uri: certification.imageUrl }}
                          style={consultantFlowStyles.certificationImage}
                        />
                      )}
                      <Text style={consultantFlowStyles.tagText}>{certification.name}</Text>
                      <TouchableOpacity
                        style={consultantFlowStyles.eyeIcon}
                        onPress={() => openCertificateModal(certification, index)}
                      >
                        <Eye size={16} color={COLORS.white} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={consultantFlowStyles.removeTagButton}
                        onPress={() => removeCertification(index)}
                      >
                        <Text style={consultantFlowStyles.removeTagText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
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
              {certifications.length > 0 && (
                <Text style={consultantProfileFlowStyles.summaryText}>Certifications: {certifications.map(c => c.name).join(', ')}</Text>
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

      {/* Certificate Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={consultantFlowStyles.modalOverlay}>
          <View style={consultantFlowStyles.modalContent}>
            {/* Modal Header */}
            <View style={consultantFlowStyles.modalHeader}>
              <Text style={consultantFlowStyles.modalTitle}>Certificate Details</Text>
              <TouchableOpacity onPress={closeModal}>
                <Text style={consultantFlowStyles.modalCloseButton}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Certificate Image */}
            {selectedCertificate?.imageUrl && (
              <View style={consultantFlowStyles.modalImageContainer}>
                <Image
                  source={{ uri: selectedCertificate.imageUrl }}
                  style={consultantFlowStyles.modalImage}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Certificate Title */}
            <Text style={consultantFlowStyles.modalCertificateTitle}>
              {selectedCertificate?.name}
            </Text>

            {/* Action Buttons */}
            <View style={consultantFlowStyles.modalActions}>
              <TouchableOpacity
                style={[consultantFlowStyles.modalButton, consultantFlowStyles.editButton]}
                onPress={editCertificate}
              >
                <Edit size={16} color={COLORS.white} />
                <Text style={consultantFlowStyles.modalButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[consultantFlowStyles.modalButton, consultantFlowStyles.deleteButton]}
                onPress={deleteCertificate}
              >
                <Trash2 size={16} color={COLORS.white} />
                <Text style={consultantFlowStyles.modalButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

