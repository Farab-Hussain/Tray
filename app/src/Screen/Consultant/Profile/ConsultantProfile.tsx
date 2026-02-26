import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
  Switch,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { COLORS } from '../../../constants/core/colors';
import { useAuth } from '../../../contexts/AuthContext';
import { UserService } from '../../../services/user.service';
import { getConsultantProfile, updateConsultantProfile } from '../../../services/consultantFlow.service';
import UploadService from '../../../services/upload.service';
import { User, Lock, Mail, Edit2, CheckCircle, Award, Briefcase, BookOpen, Star, TrendingUp, Activity, BarChart3, DollarSign, ShieldCheck, Upload, X } from 'lucide-react-native';
import { studentProfileStyles } from '../../../constants/styles/studentProfileStyles';
import Loader from '../../../components/ui/Loader';
import { useRefresh } from '../../../hooks/useRefresh';
import ImageUpload from '../../../components/ui/ImageUpload';
import { showSuccess, showError } from '../../../utils/toast';

const ConsultantProfile = ({ navigation }: any) => {
  const { user } = useAuth();
  const [backendProfile, setBackendProfile] = useState<any>(null);
  const [consultantProfile, setConsultantProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageCacheKey] = useState(0);

  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Specialty and qualification management
  const [specialtyModalVisible, setSpecialtyModalVisible] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [qualificationModalVisible, setQualificationModalVisible] = useState(false);
  const [newQualification, setNewQualification] = useState('');
  const [newQualificationImage, setNewQualificationImage] = useState<string | null>(null);
  const [newQualificationImagePublicId, setNewQualificationImagePublicId] = useState<string | null>(null);
  const [certificateViewerVisible, setCertificateViewerVisible] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null);
  const [picsProof, setPicsProof] = useState<any>(null);
  const [picsUploading, setPicsUploading] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch user profile
      const profileResponse = await UserService.getUserProfile();
      setBackendProfile(profileResponse);

      // Fetch consultant profile for fallback image
      try {
        const consultantResponse = await getConsultantProfile(user.uid);
        setConsultantProfile(consultantResponse);
      } catch (error: any) {
        // Consultant profile not found is okay
        if (error?.response?.status !== 404) {
                    if (__DEV__) {
            console.log('Error fetching consultant profile:', error)
          };
        }
        setConsultantProfile(null);
      }
    } catch (error: any) {
            if (__DEV__) {
        console.error('Error fetching profile data:', error)
      };
      // Set fallback profile from Firebase
      setBackendProfile({
        name: user.displayName || null,
        email: user.email || null,
        profileImage: user.photoURL || null,
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const { refreshing, handleRefresh } = useRefresh(fetchProfileData);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData])
  );

  // Edit functions
  const openEditModal = (field: string, currentValue: string, title: string) => {
    setEditField(field);
    setEditValue(currentValue);
    setEditTitle(title);
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditField('');
    setEditValue('');
    setEditTitle('');
  };

  const handleUpdateField = async () => {
    if (!user?.uid || !consultantProfile) return;

    setIsUpdating(true);
    try {
      const updatedProfile = { ...consultantProfile };
      
      // Update the specific field
      if (editField.includes('personalInfo.')) {
        const fieldPath = editField.replace('personalInfo.', '');
        updatedProfile.personalInfo[fieldPath] = editValue;
      } else if (editField.includes('professionalInfo.')) {
        const fieldPath = editField.replace('professionalInfo.', '');
        const numericFields = ['maxCaseload', 'placementRate', 'retentionRate', 'revenueGenerated', 'clientSatisfactionRating'];
        if (numericFields.includes(fieldPath)) {
          const numVal = Number(editValue);

          // Prevent saving non-numeric values (e.g., "10a") while keeping UX consistent
          if (editValue === '' || Number.isNaN(numVal)) {
            showError('Please enter a valid number');
            setIsUpdating(false);
            return;
          }

          updatedProfile.professionalInfo[fieldPath] = numVal;
        } else if (fieldPath === 'picsInformedCertified') {
          updatedProfile.professionalInfo[fieldPath] = editValue === 'true' || editValue === true;
        } else {
          updatedProfile.professionalInfo[fieldPath] = editValue;
        }
      }

      await updateConsultantProfile(user.uid, updatedProfile);
      setConsultantProfile(updatedProfile);
      showSuccess('Profile updated successfully!');
      closeEditModal();
    } catch (error: any) {
      showError('Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddSpecialty = async () => {
    if (!newSpecialty.trim() || !user?.uid || !consultantProfile) return;

    try {
      const updatedProfile = { ...consultantProfile };
      if (!updatedProfile.professionalInfo.specialties) {
        updatedProfile.professionalInfo.specialties = [];
      }
      updatedProfile.professionalInfo.specialties.push(newSpecialty.trim());

      await updateConsultantProfile(user.uid, updatedProfile);
      setConsultantProfile(updatedProfile);
      setNewSpecialty('');
      setSpecialtyModalVisible(false);
      showSuccess('Specialty added successfully!');
    } catch (error: any) {
      showError('Failed to add specialty');
      console.error('Error adding specialty:', error);
    }
  };

  const handleDeleteSpecialty = (index: number) => {
    Alert.alert(
      'Delete Specialty',
      'Are you sure you want to delete this specialty?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.uid || !consultantProfile) return;

            try {
              const updatedProfile = { ...consultantProfile };
              updatedProfile.professionalInfo.specialties = updatedProfile.professionalInfo.specialties.filter(
                (_: any, i: number) => i !== index
              );

              await updateConsultantProfile(user.uid, updatedProfile);
              setConsultantProfile(updatedProfile);
              showSuccess('Specialty deleted successfully!');
            } catch (error: any) {
              showError('Failed to delete specialty');
              console.error('Error deleting specialty:', error);
            }
          },
        },
      ]
    );
  };

  const handleAddQualification = async () => {
    if (!newQualification.trim() || !newQualificationImage || !user?.uid || !consultantProfile) {
      if (!newQualificationImage) {
        showError('Certificate image is required');
        return;
      }
      return;
    }

    try {
      const updatedProfile = { ...consultantProfile };
      if (!updatedProfile.personalInfo.qualifications) {
        updatedProfile.personalInfo.qualifications = [];
      }
      
      const qualificationObj = {
        name: newQualification.trim(),
        imageUrl: newQualificationImage,
        imagePublicId: newQualificationImagePublicId || undefined,
      };
      
      updatedProfile.personalInfo.qualifications.push(qualificationObj);

      await updateConsultantProfile(user.uid, updatedProfile);
      setConsultantProfile(updatedProfile);
      setNewQualification('');
      setNewQualificationImage(null);
      setNewQualificationImagePublicId(null);
      setQualificationModalVisible(false);
      showSuccess('Certification added successfully!');
    } catch (error: any) {
      showError('Failed to add certification');
      console.error('Error adding certification:', error);
    }
  };

  const handleDeleteQualification = (index: number) => {
    Alert.alert(
      'Delete Certification',
      'Are you sure you want to delete this certification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.uid || !consultantProfile) return;

            try {
              const updatedProfile = { ...consultantProfile };
              updatedProfile.personalInfo.qualifications = updatedProfile.personalInfo.qualifications.filter(
                (_: any, i: number) => i !== index
              );

              await updateConsultantProfile(user.uid, updatedProfile);
              setConsultantProfile(updatedProfile);
              showSuccess('Certification deleted successfully!');
            } catch (error: any) {
              showError('Failed to delete certification');
              console.error('Error deleting certification:', error);
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Profile" onBackPress={() => navigation.goBack()} />
        <Loader message="Loading profile..." />
      </SafeAreaView>
    );
  }

  // Priority: backendProfile > consultantProfile > user
  const profileImage = backendProfile?.profileImage || user?.photoURL || consultantProfile?.personalInfo?.profileImage;
  const displayName = backendProfile?.name || consultantProfile?.personalInfo?.fullName || user?.displayName || 'No name set';
  const email = backendProfile?.email || consultantProfile?.personalInfo?.email || user?.email || 'No email';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Profile" onBackPress={() => navigation.goBack()} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Profile Image Section */}
        <View style={styles.profileImageSection}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image
                source={{ uri: `${profileImage}?t=${imageCacheKey}` }}
                style={styles.profileImage}
                key={`${profileImage}-${imageCacheKey}`}
              />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <User size={60} color={COLORS.gray} />
              </View>
            )}
          </View>

          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* Profile Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.sectionContent}>
            {/* Name */}
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => navigation.navigate('ChangeUsername')}
              activeOpacity={0.7}
            >
              <View style={styles.infoItemLeft}>
                <View style={styles.iconContainer}>
                  <User size={20} color={COLORS.green} />
                </View>
                <View style={styles.infoItemText}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{displayName}</Text>
                </View>
              </View>
              <Edit2 size={18} color={COLORS.gray} />
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Email */}
            <View style={styles.infoItem}>
              <View style={styles.infoItemLeft}>
                <View style={styles.iconContainer}>
                  <Mail size={20} color={COLORS.green} />
                </View>
                <View style={styles.infoItemText}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{email}</Text>
                </View>
              </View>
              <CheckCircle size={18} color={COLORS.green} />
            </View>

            <View style={styles.separator} />

            {/* Professional Bio */}
            {consultantProfile?.personalInfo?.bio && (
              <>
                <TouchableOpacity
                  style={styles.infoItem}
                  onPress={() => openEditModal('personalInfo.bio', consultantProfile.personalInfo.bio, 'Professional Bio')}
                  activeOpacity={0.7}
                >
                  <View style={styles.infoItemLeft}>
                    <View style={styles.iconContainer}>
                      <BookOpen size={20} color={COLORS.green} />
                    </View>
                    <View style={styles.infoItemText}>
                      <Text style={styles.infoLabel}>Professional Bio</Text>
                      <Text style={styles.infoValue} numberOfLines={3}>
                        {consultantProfile.personalInfo.bio}
                      </Text>
                    </View>
                  </View>
                  <Edit2 size={18} color={COLORS.gray} />
                </TouchableOpacity>
                <View style={styles.separator} />
              </>
            )}

            {/* Years of Experience */}
            {consultantProfile?.personalInfo?.experience !== undefined && (
              <>
                <TouchableOpacity
                  style={styles.infoItem}
                  onPress={() => openEditModal('personalInfo.experience', String(consultantProfile.personalInfo.experience), 'Years of Experience')}
                  activeOpacity={0.7}
                >
                  <View style={styles.infoItemLeft}>
                    <View style={styles.iconContainer}>
                      <Star size={20} color={COLORS.green} />
                    </View>
                    <View style={styles.infoItemText}>
                      <Text style={styles.infoLabel}>Experience</Text>
                      <Text style={styles.infoValue}>
                        {consultantProfile.personalInfo.experience} years
                      </Text>
                    </View>
                  </View>
                  <Edit2 size={18} color={COLORS.gray} />
                </TouchableOpacity>
                <View style={styles.separator} />
              </>
            )}
          </View>
        </View>

        {/* Professional Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Information</Text>
          
          <View style={styles.sectionContent}>
            {/* Category */}
            {consultantProfile?.professionalInfo?.category && (
              <>
                <TouchableOpacity
                  style={styles.infoItem}
                  onPress={() => openEditModal('professionalInfo.category', consultantProfile.professionalInfo.category, 'Category')}
                  activeOpacity={0.7}
                >
                  <View style={styles.infoItemLeft}>
                    <View style={styles.iconContainer}>
                      <Briefcase size={20} color={COLORS.green} />
                    </View>
                    <View style={styles.infoItemText}>
                      <Text style={styles.infoLabel}>Category</Text>
                      <Text style={styles.infoValue}>
                        {consultantProfile.professionalInfo.category}
                      </Text>
                    </View>
                  </View>
                  <Edit2 size={18} color={COLORS.gray} />
                </TouchableOpacity>
                <View style={styles.separator} />
              </>
            )}

            {/* Professional Title */}
            {consultantProfile?.professionalInfo?.title && (
              <>
                <TouchableOpacity
                  style={styles.infoItem}
                  onPress={() => openEditModal('professionalInfo.title', consultantProfile.professionalInfo.title, 'Professional Title')}
                  activeOpacity={0.7}
                >
                  <View style={styles.infoItemLeft}>
                    <View style={styles.iconContainer}>
                      <Award size={20} color={COLORS.green} />
                    </View>
                    <View style={styles.infoItemText}>
                      <Text style={styles.infoLabel}>Professional Title</Text>
                      <Text style={styles.infoValue}>
                        {consultantProfile.professionalInfo.title}
                      </Text>
                    </View>
                  </View>
                  <Edit2 size={18} color={COLORS.gray} />
                </TouchableOpacity>
                <View style={styles.separator} />
              </>
            )}

            {/* Specialties */}
            {consultantProfile?.professionalInfo?.specialties && 
             consultantProfile.professionalInfo.specialties.length > 0 && (
              <View style={styles.infoItem}>
                <View style={styles.infoItemLeft}>
                  <View style={styles.iconContainer}>
                    <Star size={20} color={COLORS.green} />
                  </View>
                  <View style={styles.infoItemText}>
                    <Text style={styles.infoLabel}>Specialties</Text>
                    <View style={styles.specialtiesContainer}>
                      {consultantProfile.professionalInfo.specialties.map((specialty: string, index: number) => (
                        <View key={index} style={styles.specialtyTag}>
                          <Text style={styles.specialtyText}>{specialty}</Text>
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteSpecialty(index)}
                          >
                            <X size={12} color={COLORS.white} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => setSpecialtyModalVisible(true)}
                    >
                      <Text style={styles.addButtonText}>+ Add Specialty</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Capacity & Metrics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Capacity & Metrics</Text>

          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => openEditModal('professionalInfo.maxCaseload', String(consultantProfile?.professionalInfo?.maxCaseload || ''), 'Max Caseload')}
            activeOpacity={0.7}
          >
            <View style={styles.infoItemLeft}>
              <View style={styles.iconContainer}>
                <Activity size={20} color={COLORS.green} />
              </View>
              <View style={styles.infoItemText}>
                <Text style={styles.infoLabel}>Max Caseload</Text>
                <Text style={styles.infoValue}>
                  {consultantProfile?.professionalInfo?.maxCaseload ?? 'Not set'}
                </Text>
              </View>
            </View>
            <Edit2 size={18} color={COLORS.gray} />
          </TouchableOpacity>
          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => openEditModal('professionalInfo.placementRate', String(consultantProfile?.professionalInfo?.placementRate || ''), 'Placement Rate (%)')}
            activeOpacity={0.7}
          >
            <View style={styles.infoItemLeft}>
              <View style={styles.iconContainer}>
                <TrendingUp size={20} color={COLORS.green} />
              </View>
              <View style={styles.infoItemText}>
                <Text style={styles.infoLabel}>Placement Rate</Text>
                <Text style={styles.infoValue}>
                  {consultantProfile?.professionalInfo?.placementRate != null
                    ? `${consultantProfile.professionalInfo.placementRate}%`
                    : 'Not set'}
                </Text>
              </View>
            </View>
            <Edit2 size={18} color={COLORS.gray} />
          </TouchableOpacity>
          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => openEditModal('professionalInfo.retentionRate', String(consultantProfile?.professionalInfo?.retentionRate || ''), 'Retention Rate (%)')}
            activeOpacity={0.7}
          >
            <View style={styles.infoItemLeft}>
              <View style={styles.iconContainer}>
                <BarChart3 size={20} color={COLORS.green} />
              </View>
              <View style={styles.infoItemText}>
                <Text style={styles.infoLabel}>Retention Rate</Text>
                <Text style={styles.infoValue}>
                  {consultantProfile?.professionalInfo?.retentionRate != null
                    ? `${consultantProfile.professionalInfo.retentionRate}%`
                    : 'Not set'}
                </Text>
              </View>
            </View>
            <Edit2 size={18} color={COLORS.gray} />
          </TouchableOpacity>
          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => openEditModal('professionalInfo.revenueGenerated', String(consultantProfile?.professionalInfo?.revenueGenerated || ''), 'Revenue Generated')}
            activeOpacity={0.7}
          >
            <View style={styles.infoItemLeft}>
              <View style={styles.iconContainer}>
                <DollarSign size={20} color={COLORS.green} />
              </View>
              <View style={styles.infoItemText}>
                <Text style={styles.infoLabel}>Revenue Generated</Text>
                <Text style={styles.infoValue}>
                  {consultantProfile?.professionalInfo?.revenueGenerated != null
                    ? `$${consultantProfile.professionalInfo.revenueGenerated}`
                    : 'Not set'}
                </Text>
              </View>
            </View>
            <Edit2 size={18} color={COLORS.gray} />
          </TouchableOpacity>
          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => openEditModal('professionalInfo.clientSatisfactionRating', String(consultantProfile?.professionalInfo?.clientSatisfactionRating || ''), 'Client Satisfaction Rating')}
            activeOpacity={0.7}
          >
            <View style={styles.infoItemLeft}>
              <View style={styles.iconContainer}>
                <Star size={20} color={COLORS.orange} />
              </View>
              <View style={styles.infoItemText}>
                <Text style={styles.infoLabel}>Client Satisfaction Rating</Text>
                <Text style={styles.infoValue}>
                  {consultantProfile?.professionalInfo?.clientSatisfactionRating != null
                    ? `${consultantProfile.professionalInfo.clientSatisfactionRating}%`
                    : 'Not set'}
                </Text>
              </View>
            </View>
            <Edit2 size={18} color={COLORS.gray} />
          </TouchableOpacity>
          <View style={styles.separator} />

          <View style={[styles.picsCard]}>
            <View style={styles.picsHeaderRow}>
              <View style={styles.picsTitleRow}>
                <View style={styles.iconContainer}>
                  <ShieldCheck size={20} color={COLORS.green} />
                </View>
                <View>
                  <Text style={styles.infoLabel}>PICS Assessment</Text>
                  <Text style={{ color: COLORS.gray, fontSize: 12 }}>Upload proof and toggle on when completed.</Text>
                </View>
              </View>
              <Switch
                value={consultantProfile?.professionalInfo?.picsInformedCertified || false}
                onValueChange={async (val) => {
                  const updatedProfile = { ...consultantProfile };
                  updatedProfile.professionalInfo = updatedProfile.professionalInfo || {};
                  updatedProfile.professionalInfo.picsInformedCertified = val;
                  if (!val) {
                    updatedProfile.professionalInfo.picsCertificationProof = undefined;
                    setPicsProof(null);
                  }
                  await updateConsultantProfile(user?.uid, updatedProfile);
                  setConsultantProfile(updatedProfile);
                }}
              />
            </View>

            <View style={styles.picsUploadRow}>
              <Text style={{ color: COLORS.gray, flex: 1, marginRight: 10 }}>Certificate or screenshot for PICS.</Text>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    if (!consultantProfile?.professionalInfo?.picsInformedCertified) {
                      showError('Toggle PICS on before uploading proof');
                      return;
                    }
                    setPicsUploading(true);
                    const picker = require('react-native-document-picker');
                    const res = await picker.pick({
                      type: [picker.types.images, picker.types.pdf, picker.types.doc, picker.types.docx],
                    });
                    const file = res?.[0] || res;
                    if (!file) return;

                    const uploadRes = await UploadService.uploadFile(file, 'pics-proof');
                    const proof = {
                      fileUrl: uploadRes?.fileUrl || uploadRes?.imageUrl || uploadRes?.url,
                      publicId: uploadRes?.publicId,
                      fileName: uploadRes?.fileName || file?.name || 'document',
                      mimeType: file?.type,
                      uploadedAt: new Date().toISOString(),
                    };
                    const updatedProfile = { ...consultantProfile };
                    updatedProfile.professionalInfo = updatedProfile.professionalInfo || {};
                    updatedProfile.professionalInfo.picsCertificationProof = proof;
                    updatedProfile.professionalInfo.picsInformedCertified = true;
                    await updateConsultantProfile(user?.uid, updatedProfile);
                    setConsultantProfile(updatedProfile);
                    setPicsProof(proof);
                    showSuccess('Proof uploaded');
                  } catch (err: any) {
                    if (err?.message?.includes('cancel')) return;
                    showError(err?.message || 'Failed to upload proof');
                  } finally {
                    setPicsUploading(false);
                  }
                }}
                style={[
                  styles.uploadButton,
                  {
                    backgroundColor: consultantProfile?.professionalInfo?.picsInformedCertified
                      ? COLORS.blue
                      : COLORS.lightGray,
                    opacity: picsUploading ? 0.6 : 1,
                  },
                ]}
                disabled={picsUploading}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Upload size={16} color={COLORS.white} />
                  <Text style={{ color: COLORS.white, fontWeight: '600' }}>
                    {picsUploading ? 'Uploading...' : 'Upload Proof'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {consultantProfile?.professionalInfo?.picsCertificationProof ? (
              <View style={[studentProfileStyles.quickInfo, { marginTop: 10, alignSelf: 'stretch' }]}>
                <ShieldCheck size={16} color={COLORS.green} />
                <Text style={studentProfileStyles.quickInfoText}>{consultantProfile.professionalInfo.picsCertificationProof.fileName}</Text>
                <TouchableOpacity
                  onPress={async () => {
                    const updatedProfile = { ...consultantProfile };
                    updatedProfile.professionalInfo.picsCertificationProof = undefined;
                    await updateConsultantProfile(user?.uid, updatedProfile);
                    setConsultantProfile(updatedProfile);
                    setPicsProof(null);
                  }}
                >
                  <X size={16} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>

        {/* Qualifications/Certifications Section */}
        {consultantProfile?.personalInfo?.qualifications && 
         consultantProfile.personalInfo.qualifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            
            <View style={styles.sectionContent}>
              <View style={styles.infoItem}>
                <View style={styles.infoItemLeft}>
                  <View style={styles.iconContainer}>
                    <Award size={20} color={COLORS.green} />
                  </View>
                  <View style={styles.infoItemText}>
                    <Text style={styles.infoLabel}>Certifications</Text>
                    <View style={styles.qualificationsContainer}>
                      {consultantProfile.personalInfo.qualifications.map((qualification: any, index: number) => (
                        <View key={index} style={styles.qualificationItem}>
                          <TouchableOpacity
                            style={styles.qualificationContent}
                            onPress={() => {
                              // If certificate has an image, show it in a modal or viewer
                              if (qualification?.imageUrl) {
                                setSelectedCertificate(qualification);
                                setCertificateViewerVisible(true);
                              }
                            }}
                          >
                            {qualification?.imageUrl ? (
                              <Image
                                source={{ uri: qualification.imageUrl }}
                                style={styles.qualificationImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.qualificationImagePlaceholder}>
                                <Award size={24} color={COLORS.green} />
                              </View>
                            )}
                            <Text style={styles.qualificationText}>
                              {typeof qualification === 'string' ? qualification : qualification.name}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteQualification(index)}
                          >
                            <X size={12} color={COLORS.white} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => setQualificationModalVisible(true)}
                    >
                      <Text style={styles.addButtonText}>+ Add Certification</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => navigation.navigate('ChangePassword')}
              activeOpacity={0.7}
            >
              <View style={styles.infoItemLeft}>
                <View style={styles.iconContainer}>
                  <Lock size={20} color={COLORS.green} />
                </View>
                <View style={styles.infoItemText}>
                  <Text style={styles.infoLabel}>Change Password</Text>
                  <Text style={styles.infoSubtext}>Update your account password</Text>
                </View>
              </View>
              <Edit2 size={18} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Edit Field Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit {editTitle}</Text>
              <TouchableOpacity onPress={closeEditModal}>
                <X size={20} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={`Enter ${editTitle.toLowerCase()}`}
              multiline={editTitle === 'Professional Bio'}
              numberOfLines={editTitle === 'Professional Bio' ? 4 : 1}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeEditModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateField}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Specialty Modal */}
      <Modal
        visible={specialtyModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSpecialtyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Specialty</Text>
              <TouchableOpacity onPress={() => setSpecialtyModalVisible(false)}>
                <X size={20} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.modalInput}
              value={newSpecialty}
              onChangeText={setNewSpecialty}
              placeholder="Enter specialty name"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setSpecialtyModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddSpecialty}
                disabled={!newSpecialty.trim()}
              >
                <Text style={styles.saveButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Qualification Modal */}
      <Modal
        visible={qualificationModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setQualificationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Certification</Text>
              <TouchableOpacity onPress={() => setQualificationModalVisible(false)}>
                <X size={20} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.modalInput}
              value={newQualification}
              onChangeText={setNewQualification}
              placeholder="Enter certification name"
            />
            
            <Text style={styles.imageLabel}>Certificate Image *</Text>
            <ImageUpload
              currentImageUrl={newQualificationImage}
              currentPublicId={newQualificationImagePublicId}
              onImageUploaded={(imageUrl: string, publicId: string) => {
                setNewQualificationImage(imageUrl);
                setNewQualificationImagePublicId(publicId);
              }}
              onImageDeleted={() => {
                setNewQualificationImage(null);
                setNewQualificationImagePublicId(null);
              }}
              placeholder="Upload certificate image"
              style={styles.imageUpload}
              uploadType="consultant"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setQualificationModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddQualification}
                disabled={!newQualification.trim() || !newQualificationImage}
              >
                <Text style={styles.saveButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Certificate Viewer Modal */}
      <Modal
        visible={certificateViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCertificateViewerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.certificateViewerContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Certificate</Text>
              <TouchableOpacity onPress={() => setCertificateViewerVisible(false)}>
                <X size={20} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            
            {selectedCertificate?.imageUrl && (
              <View style={styles.certificateImageContainer}>
                <Image
                  source={{ uri: selectedCertificate.imageUrl }}
                  style={styles.certificateFullImage}
                  resizeMode="contain"
                />
                <Text style={styles.certificateNameText}>
                  {typeof selectedCertificate === 'string' ? selectedCertificate : selectedCertificate.name}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  ...studentProfileStyles,
  picsCard: {
    width: '100%',
    borderRadius: 12,
    padding: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#EDF1F4',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  picsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  picsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  picsUploadRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  uploadButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
});

export default ConsultantProfile;
