import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  UIManager,
  Linking,
} from 'react-native';
import Video from 'react-native-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';
import { useAuth } from '../../../contexts/AuthContext';
import { courseService, CourseInput, Course } from '../../../services/course.service';
import ImageUpload from '../../../components/ui/ImageUpload';
import UploadService from '../../../services/upload.service';
import { launchImageLibrary, MediaType } from 'react-native-image-picker';
import { logger } from '../../../utils/logger';

interface FormData {
  title: string;
  description: string;
  previewVideoUrl: string;
  thumbnailUrl: string;
  thumbnailPublicId: string;
  category: string;
  level: string;
  language: string;
  price: string;
  isFree: boolean;
  durationMinutes: string;
  timeCommitment: string;
  objectivesText: string;
  prerequisitesText: string;
  targetAudienceText: string;
  certificateAvailable: boolean;
  accessType: 'weekly' | 'monthly' | 'yearly' | 'lifetime';
  accessDuration: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  price?: string;
  category?: string;
  level?: string;
  courseVideos?: string;
  accessDuration?: string;
  durationMinutes?: string;
  objectivesText?: string;
}

interface CourseVideoItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  thumbnailPublicId: string;
  videoUrl: string;
  videoPublicId: string;
  videoFileName: string;
  isUploadingVideo: boolean;
}

interface CourseVideoErrors {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
}

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Course title and description' },
  { id: 2, title: 'Content', description: 'Add course materials' },
  { id: 3, title: 'Pricing', description: 'Set course price and access' },
  { id: 4, title: 'Review', description: 'Review and publish' },
];

const CATEGORIES = [
  'Technology',
  'Business',
  'Design',
  'Marketing',
  'Photography',
  'Music',
  'Health & Fitness',
  'Education',
  'Lifestyle',
  'Other',
];

const LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'All Levels',
];

const ACCESS_TYPES = [
  { id: 'weekly', label: 'Weekly', requiresDuration: true },
  { id: 'monthly', label: 'Monthly', requiresDuration: true },
  { id: 'yearly', label: 'Yearly', requiresDuration: true },
  { id: 'lifetime', label: 'Lifetime', requiresDuration: false },
];

interface CourseCreationRouteParams {
  mode?: 'create' | 'edit';
  courseId?: string;
}

export default function CourseCreationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params as CourseCreationRouteParams | undefined) || {};
  const isEditMode = params.mode === 'edit' && !!params.courseId;
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [videoErrors, setVideoErrors] = useState<Record<string, CourseVideoErrors>>({});
  const [courseVideos, setCourseVideos] = useState<CourseVideoItem[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    previewVideoUrl: '',
    thumbnailUrl: '',
    thumbnailPublicId: '',
    category: '',
    level: 'beginner',
    language: 'en',
    price: '',
    isFree: false,
    durationMinutes: '',
    timeCommitment: '',
    objectivesText: '',
    prerequisitesText: '',
    targetAudienceText: '',
    certificateAvailable: false,
    accessType: 'lifetime',
    accessDuration: '',
  });
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCourseTitle, setCreatedCourseTitle] = useState('');
  const [successVerb, setSuccessVerb] = useState<'created' | 'updated'>('created');
  const [isPrefilling, setIsPrefilling] = useState(false);
  const [isUploadingIntroVideo, setIsUploadingIntroVideo] = useState(false);
  const [introVideoFileName, setIntroVideoFileName] = useState('');
  const videoRef = useRef<any>(null);
  const nativeVideoAvailable = useMemo(
    () => !!UIManager.getViewManagerConfig?.('RCTVideo'),
    [],
  );
  useEffect(() => {
    const prefillForEdit = async () => {
      if (!isEditMode || !params.courseId) return;
      try {
        setIsPrefilling(true);
        const course: Course = await courseService.getCourseById(params.courseId);
        const listToText = (items?: string[]) => (items || []).join('\n');
        const normalizeLevel = (value?: string) => {
          const normalized = (value || '').trim().toLowerCase();
          if (normalized === 'beginner') return 'Beginner';
          if (normalized === 'intermediate') return 'Intermediate';
          if (normalized === 'advanced') return 'Advanced';
          return 'Beginner';
        };
        const normalizeLanguage = (value?: string) => {
          const raw = (value || '').trim();
          if (!raw) return 'en';
          if (raw.toLowerCase() === 'english') return 'en';
          return raw;
        };
        const fallbackDescription = course.shortDescription || course.description || '';

        setFormData(prev => ({
          ...prev,
          title: course.title || '',
          description: course.description || '',
          previewVideoUrl: course.previewVideoUrl || '',
          thumbnailUrl: course.thumbnailUrl || '',
          category: course.category || '',
          level: normalizeLevel(course.level),
          language: normalizeLanguage(course.language),
          price: String(course.price ?? ''),
          isFree: !!course.isFree,
          durationMinutes: String(course.duration ?? ''),
          timeCommitment: course.timeCommitment || '',
          objectivesText: listToText(course.objectives),
          prerequisitesText: listToText(course.prerequisites),
          targetAudienceText: listToText(course.targetAudience),
          certificateAvailable: !!course.certificateAvailable,
        }));
        setIntroVideoFileName(course.previewVideoUrl ? 'Uploaded intro video' : '');

        const existingVideos = (course.videos || [])
          .filter(video => !!video.videoUrl)
          .map((video, index) => ({
            id: video.id || `video-${index + 1}`,
            title: video.title || `Lesson ${index + 1}`,
            description: video.description || fallbackDescription,
            thumbnailUrl: video.thumbnailUrl || course.thumbnailUrl || '',
            thumbnailPublicId: '',
            videoUrl: video.videoUrl || '',
            videoPublicId: '',
            videoFileName: video.title || `Lesson ${index + 1}`,
            isUploadingVideo: false,
          }));

        if (existingVideos.length > 0) {
          setCourseVideos(existingVideos);
        } else if (course.previewVideoUrl) {
          setCourseVideos([
            {
              id: `video-${Date.now()}`,
              title: 'Lesson 1',
              description: fallbackDescription,
              thumbnailUrl: course.thumbnailUrl || '',
              thumbnailPublicId: '',
              videoUrl: course.previewVideoUrl,
              videoPublicId: '',
              videoFileName: 'Lesson 1',
              isUploadingVideo: false,
            },
          ]);
        } else if ((course.lessonsCount || 0) > 0) {
          const generated = Array.from({ length: course.lessonsCount }, (_, index) => ({
            id: `video-placeholder-${index + 1}`,
            title: `Lesson ${index + 1}`,
            description: fallbackDescription,
            thumbnailUrl: course.thumbnailUrl || '',
            thumbnailPublicId: '',
            videoUrl: '',
            videoPublicId: '',
            videoFileName: `Lesson ${index + 1}`,
            isUploadingVideo: false,
          }));
          setCourseVideos(generated);
        }
      } catch (error) {
        logger.error('Error loading course for edit:', error);
        Alert.alert('Issue', 'Failed to load course details for editing.');
      } finally {
        setIsPrefilling(false);
      }
    };

    prefillForEdit();
  }, [isEditMode, params.courseId]);

  const updateFormData = (key: keyof FormData, value: string | boolean) => {
    setErrors(prev => {
      const next = { ...prev };
      if (key in next) {
        delete next[key as keyof FormErrors];
      }
      if (key === 'isFree' && value === true) {
        delete next.price;
      }
      return next;
    });
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const openVideoPreview = (url?: string) => {
    if (!url) {
      Alert.alert('Preview unavailable', 'No video URL found for preview.');
      return;
    }
    if (!nativeVideoAvailable) {
      Alert.alert(
        'Preview unavailable in app',
        'Native video module is not linked in this build. Open preview in browser instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open in Browser',
            onPress: () => {
              Linking.openURL(url).catch(() => {
                Alert.alert('Issue', 'Unable to open video URL.');
              });
            },
          },
        ],
      );
      return;
    }
    setCurrentVideoUrl(url);
    setIsVideoPlaying(false);
    setShowVideoPlayer(true);
  };

  const addVideoItem = () => {
    const id = `video-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setCourseVideos(prev => [
      ...prev,
      {
        id,
        title: '',
        description: '',
        thumbnailUrl: '',
        thumbnailPublicId: '',
        videoUrl: '',
        videoPublicId: '',
        videoFileName: '',
        isUploadingVideo: false,
      },
    ]);
  };

  const removeVideoItem = (id: string) => {
    setCourseVideos(prev => prev.filter(video => video.id !== id));
    setVideoErrors(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateVideoItem = (id: string, key: keyof CourseVideoItem, value: string | boolean) => {
    setCourseVideos(prev =>
      prev.map(video => (video.id === id ? { ...video, [key]: value } : video)),
    );
    setVideoErrors(prev => {
      const entry = prev[id];
      if (!entry) return prev;
      const nextEntry = { ...entry };
      if (key === 'title') delete nextEntry.title;
      if (key === 'description') delete nextEntry.description;
      if (key === 'thumbnailUrl') delete nextEntry.thumbnailUrl;
      if (key === 'videoUrl') delete nextEntry.videoUrl;
      return { ...prev, [id]: nextEntry };
    });
  };

  const handleUploadVideo = async (videoId: string) => {
    try {
      const response = await new Promise<any>((resolve) => {
        launchImageLibrary(
          {
            mediaType: 'video' as MediaType,
            selectionLimit: 1,
            quality: 0.8 as any,
          },
          resolve,
        );
      });

      if (response?.didCancel) return;
      if (response?.errorMessage) {
        Alert.alert('Upload Issue', response.issueMessage);
        return;
      }

      const asset = response?.assets?.[0];
      if (!asset?.uri) {
        Alert.alert('Upload Issue', 'No video selected.');
        return;
      }

      updateVideoItem(videoId, 'isUploadingVideo', true);

      const file = {
        uri: asset.uri,
        type: asset.type || 'video/mp4',
        name: asset.fileName || 'course-video.mp4',
        size: asset.fileSize,
      };

      // Show file size info to user
      const fileSizeMB = Math.round((asset.fileSize || 0) / (1024 * 1024));
      logger.debug(`📤 [CourseCreation] Uploading video: ${fileSizeMB}MB`);

      const result = await UploadService.uploadServiceVideo(file);
      const videoUrl = result.videoUrl || '';
      if (!videoUrl) {
        throw new Error('Video uploaded but no URL returned.');
      }

      updateVideoItem(videoId, 'videoUrl', videoUrl);
      updateVideoItem(videoId, 'videoPublicId', result.publicId || '');
      updateVideoItem(videoId, 'videoFileName', asset.fileName || 'Uploaded video');
      
      // Show success message with file size
      Alert.alert(
        'Upload Complete', 
        `Video uploaded successfully (${fileSizeMB}MB)`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      logger.error('❌ [CourseCreation] Video upload error:', error);
      Alert.alert('Upload Issue', issue?.message || 'Failed to upload video.');
    } finally {
      updateVideoItem(videoId, 'isUploadingVideo', false);
    }
  };

  const handleRemoveVideo = (videoId: string) => {
    Alert.alert(
      'Remove Video',
      'Are you sure you want to remove this video? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            updateVideoItem(videoId, 'videoUrl', '');
            updateVideoItem(videoId, 'videoPublicId', '');
            updateVideoItem(videoId, 'videoFileName', '');
            // Clear any video-related errors
            setVideoErrors(prev => ({
              ...prev,
              [videoId]: {
                ...prev[videoId],
                videoUrl: undefined
              }
            }));
          },
        },
      ]
    );
  };

  const handleUploadIntroVideo = async () => {
    try {
      const response = await new Promise<any>((resolve) => {
        launchImageLibrary(
          {
            mediaType: 'video' as MediaType,
            selectionLimit: 1,
            quality: 0.8 as any,
          },
          resolve,
        );
      });

      if (response?.didCancel) return;
      if (response?.errorMessage) {
        Alert.alert('Upload Issue', response.issueMessage);
        return;
      }

      const asset = response?.assets?.[0];
      if (!asset?.uri) {
        Alert.alert('Upload Issue', 'No video selected.');
        return;
      }

      setIsUploadingIntroVideo(true);

      const file = {
        uri: asset.uri,
        type: asset.type || 'video/mp4',
        name: asset.fileName || 'intro-video.mp4',
        size: asset.fileSize,
      };

      const result = await UploadService.uploadServiceVideo(file);
      const videoUrl = result.videoUrl || '';
      if (!videoUrl) {
        throw new Error('Video uploaded but no URL returned.');
      }

      updateFormData('previewVideoUrl', videoUrl);
      setIntroVideoFileName(asset.fileName || 'Uploaded intro video');
      Alert.alert('Upload Complete', 'Intro video uploaded successfully.');
    } catch (error: any) {
      logger.error('❌ [CourseCreation] Intro video upload error:', error);
      Alert.alert('Upload Issue', issue?.message || 'Failed to upload intro video.');
    } finally {
      setIsUploadingIntroVideo(false);
    }
  };

  const handleRemoveIntroVideo = () => {
    updateFormData('previewVideoUrl', '');
    setIntroVideoFileName('');
  };

  const getValidationErrors = (step: number): FormErrors => {
    const nextErrors: FormErrors = {};
    const nextVideoErrors: Record<string, CourseVideoErrors> = {};

    if (step === 1 || step === 4) {
      if (!formData.thumbnailUrl.trim()) {
        nextErrors.thumbnailUrl = 'Course thumbnail is required.';
      }
      if (!formData.title.trim()) {
        nextErrors.title = 'Course title is required.';
      } else if (formData.title.trim().length < 5) {
        nextErrors.title = 'Course title must be at least 5 characters.';
      }
      if (!formData.description.trim()) {
        nextErrors.description = 'Course description is required.';
      } else if (formData.description.trim().length < 20) {
        nextErrors.description = 'Description must be at least 20 characters.';
      }
    }

    if (step === 2 || step === 4) {
      if (!formData.category.trim()) {
        nextErrors.category = 'Please select a category.';
      }
      if (!LEVELS.includes(formData.level)) {
        nextErrors.level = 'Please select a valid level.';
      }

      if (courseVideos.length === 0) {
        nextErrors.courseVideos = 'Add at least one course video.';
      } else {
        courseVideos.forEach(video => {
          const entry: CourseVideoErrors = {};
          if (!video.title.trim()) {
            entry.title = 'Video title is required.';
          }
          if (!video.description.trim()) {
            entry.description = 'Video description is required.';
          } else if (video.description.trim().length < 10) {
            entry.description = 'Video description must be at least 10 characters.';
          }
          if (!video.thumbnailUrl.trim()) {
            entry.thumbnailUrl = 'Video thumbnail is required.';
          }
          if (!video.videoUrl.trim()) {
            entry.videoUrl = 'Video upload is required.';
          }

          if (Object.keys(entry).length > 0) {
            nextVideoErrors[video.id] = entry;
          }
        });

        if (Object.keys(nextVideoErrors).length > 0) {
          nextErrors.courseVideos = 'Complete all required fields for each video.';
        }
      }
    }

    if (step === 3 || step === 4) {
      if (!formData.isFree) {
        if (!formData.price.trim()) {
          nextErrors.price = 'Price is required for paid courses.';
        } else {
          const numericPrice = Number(formData.price);
          if (Number.isNaN(numericPrice)) {
            nextErrors.price = 'Price must be a valid number.';
          } else if (numericPrice <= 0) {
            nextErrors.price = 'Price must be greater than 0.';
          }
        }
      }

      if (!formData.durationMinutes.trim()) {
        nextErrors.durationMinutes = 'Duration is required.';
      } else {
        const numericDuration = Number(formData.durationMinutes);
        if (Number.isNaN(numericDuration) || numericDuration <= 0) {
          nextErrors.durationMinutes = 'Duration must be a valid number greater than 0.';
        }
      }

      const objectives = formData.objectivesText
        .split(/\n|,/)
        .map(item => item.trim())
        .filter(Boolean);
      if (objectives.length === 0) {
        nextErrors.objectivesText = 'At least one learning objective is required.';
      }
      
      // Validate access duration for non-lifetime access types
      if (formData.accessType !== 'lifetime') {
        if (!formData.accessDuration.trim()) {
          nextErrors.accessDuration = `Access duration is required for ${formData.accessType} access.`;
        } else {
          const numericDuration = Number(formData.accessDuration);
          if (Number.isNaN(numericDuration) || numericDuration <= 0) {
            nextErrors.accessDuration = 'Access duration must be a valid number greater than 0.';
          }
        }
      }
    }

    setVideoErrors(nextVideoErrors);
    return nextErrors;
  };

  const validateCurrentStep = (): boolean => {
    const nextErrors = getValidationErrors(currentStep);
    setErrors(prev => {
      const updated = { ...prev };
      const stepFields: (keyof FormErrors)[] =
        currentStep === 1
          ? ['thumbnailUrl', 'title', 'description']
          : currentStep === 2
            ? ['category', 'level', 'courseVideos']
          : currentStep === 3
              ? ['price', 'accessDuration', 'durationMinutes', 'objectivesText']
              : ['thumbnailUrl', 'title', 'description', 'price', 'category', 'level', 'courseVideos', 'accessDuration', 'durationMinutes', 'objectivesText'];

      stepFields.forEach(field => {
        delete updated[field];
      });

      return { ...updated, ...nextErrors };
    });
    return Object.keys(nextErrors).length === 0;
  };

  const validateAllSteps = (): boolean => {
    const nextErrors = getValidationErrors(4);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      Alert.alert('Validation Issue', 'Please fill in all required fields');
      return;
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      createCourse();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const createCourse = async () => {
    if (!validateAllSteps()) {
      return;
    }

    setIsLoading(true);
    try {
      const parseList = (text: string): string[] =>
        text
          .split(/\n|,/)
          .map(item => item.trim())
          .filter(Boolean);

      const parsedDuration = Number(formData.durationMinutes || '0');
      const mappedVideos = courseVideos
        .filter(video => !!video.videoUrl?.trim())
        .map((video, index) => ({
          id: video.id || `video-${index + 1}`,
          title: video.title?.trim() || `Video ${index + 1}`,
          description: video.description?.trim() || '',
          thumbnailUrl: video.thumbnailUrl || '',
          videoUrl: video.videoUrl,
        }));
      const normalizedLevel = (formData.level || '').trim().toLowerCase();
      const levelForApi =
        normalizedLevel === 'intermediate' || normalizedLevel === 'advanced'
          ? normalizedLevel
          : 'beginner';

      const courseData: CourseInput = {
        title: formData.title,
        description: formData.description,
        shortDescription: formData.description.substring(0, 150),
        category: formData.category,
        level: levelForApi as 'beginner' | 'intermediate' | 'advanced',
        language: formData.language || 'en',
        price: formData.isFree ? 0 : parseFloat(formData.price) || 0,
        currency: 'USD',
        isFree: formData.isFree,
        thumbnailUrl: formData.thumbnailUrl || '',
        previewVideoUrl: formData.previewVideoUrl.trim() || mappedVideos[0]?.videoUrl || '',
        duration: parsedDuration,
        durationText: `${parsedDuration} minutes`,
        lessonsCount: mappedVideos.length,
        objectives: parseList(formData.objectivesText),
        prerequisites: parseList(formData.prerequisitesText),
        targetAudience: parseList(formData.targetAudienceText),
        videos: mappedVideos,
        tags: [],
        difficultyScore: levelForApi === 'beginner' ? 1 : levelForApi === 'intermediate' ? 2 : 3,
        timeCommitment: formData.timeCommitment.trim() || 'Self-paced',
        certificateAvailable: formData.certificateAvailable,
        slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        instructorId: user?.uid || '',
        instructorName: user?.displayName || user?.email || 'Instructor',
      };

      const course = isEditMode && params.courseId
        ? await courseService.updateCourse(params.courseId, courseData)
        : await courseService.createCourse(courseData);
      setSuccessVerb(isEditMode ? 'updated' : 'created');
      
      // Set the course title for the success message
      setCreatedCourseTitle(course.title || formData.title);
      
      // Show custom success modal instead of native alert
      setShowSuccessModal(true);
    } catch (error) {
      logger.error(isEditMode ? 'Error updating course:' : 'Error creating course:', error);
      Alert.alert('Issue', isEditMode ? 'Failed to update course. Please try again.' : 'Failed to create course. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={{ gap: 20 }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 8 }}>
                Course Thumbnail
              </Text>
              <ImageUpload
                currentImageUrl={formData.thumbnailUrl}
                currentPublicId={formData.thumbnailPublicId}
                uploadType="service"
                placeholder="Tap to upload course thumbnail"
                onImageUploaded={(imageUrl, publicId) => {
                  updateFormData('thumbnailUrl', imageUrl);
                  updateFormData('thumbnailPublicId', publicId);
                }}
                onImageDeleted={() => {
                  updateFormData('thumbnailUrl', '');
                  updateFormData('thumbnailPublicId', '');
                }}
              />
              {errors.thumbnailUrl && (
                <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }}>
                  {errors.thumbnailUrl}
                </Text>
              )}
            </View>
      <View>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 8 }}>
          Course Title *
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: errors.title ? '#DC2626' : COLORS.gray,
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            color: COLORS.black,
          }}
          placeholder="Enter course title"
          value={formData.title}
          onChangeText={(text) => updateFormData('title', text)}
        />
        {errors.title && (
          <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }}>
            {errors.title}
          </Text>
        )}
      </View>

      <View>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 8 }}>
          Course Description *
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: errors.description ? '#DC2626' : COLORS.gray,
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            color: COLORS.black,
            height: 100,
            textAlignVertical: 'top',
          }}
          placeholder="Describe what students will learn"
          value={formData.description}
          onChangeText={(text) => updateFormData('description', text)}
          multiline
        />
        {errors.description && (
          <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }}>
            {errors.description}
          </Text>
        )}
      </View>

      <View>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 8 }}>
          Intro Video (Optional)
        </Text>
        {formData.previewVideoUrl ? (
          <View style={{ marginTop: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.gray, marginBottom: 6 }}>
              Video Preview
            </Text>

            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: COLORS.gray,
                borderRadius: 8,
                overflow: 'hidden',
                backgroundColor: '#000',
                position: 'relative',
              }}
              onPress={() => openVideoPreview(formData.previewVideoUrl)}
            >
              <View
                style={{
                  width: '100%',
                  height: 200,
                  backgroundColor: '#000',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: '700' }}>▶</Text>
              </View>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: 'row',
                gap: 8,
                marginTop: 8,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 10,
                  backgroundColor: COLORS.blue,
                  borderRadius: 6,
                }}
                onPress={handleUploadIntroVideo}
                disabled={isUploadingIntroVideo}
              >
                {isUploadingIntroVideo ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '500' }}>
                    Replace Video
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 10,
                  backgroundColor: '#DC2626',
                  borderRadius: 6,
                }}
                onPress={handleRemoveIntroVideo}
                disabled={isUploadingIntroVideo}
              >
                <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '500' }}>
                  Remove Video
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 10, color: COLORS.gray, marginTop: 4 }}>
              {introVideoFileName || 'Intro video uploaded'}
            </Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: COLORS.gray,
                borderRadius: 8,
                padding: 12,
                backgroundColor: COLORS.white,
                marginBottom: 6,
              }}
              onPress={handleUploadIntroVideo}
              disabled={isUploadingIntroVideo}
            >
              {isUploadingIntroVideo ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={COLORS.green} />
                  <Text style={{ marginLeft: 8, color: COLORS.gray }}>Uploading intro video...</Text>
                </View>
              ) : (
                <Text style={{ color: COLORS.black }}>Tap to upload intro video</Text>
              )}
            </TouchableOpacity>
            <Text style={{ marginTop: 4, fontSize: 12, color: COLORS.gray }}>
              If not uploaded, first lesson video is used as intro preview.
            </Text>
          </>
        )}
      </View>

    </View>
  );
  
  const renderStep2 = () => (
    <View style={{ gap: 20 }}>
      <View>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 8 }}>
          Category *
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: formData.category === category ? COLORS.green : COLORS.gray,
                backgroundColor: formData.category === category ? COLORS.green + '20' : COLORS.white,
                marginBottom: 8,
                marginRight: 8,
              }}
              onPress={() => updateFormData('category', category)}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: formData.category === category ? COLORS.green : COLORS.black,
              }}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.category && (
          <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }}>
            {errors.category}
          </Text>
        )}
      </View>

      <View>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 8 }}>
          Difficulty Level
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: formData.level === level ? COLORS.green : COLORS.gray,
                backgroundColor: formData.level === level ? COLORS.green + '20' : COLORS.white,
                marginBottom: 8,
                marginRight: 8,
              }}
              onPress={() => updateFormData('level', level)}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: formData.level === level ? COLORS.green : COLORS.black,
                textTransform: 'capitalize',
              }}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.level && (
          <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }}>
            {errors.level}
          </Text>
        )}
      </View>

      <View style={{ marginTop: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black }}>
            Course Videos *
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.green,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
            }}
            onPress={addVideoItem}
          >
            <Text style={{ color: COLORS.white, fontWeight: '600' }}>+ Add Video</Text>
          </TouchableOpacity>
        </View>

        {errors.courseVideos && (
          <Text style={{ color: '#DC2626', fontSize: 12, marginBottom: 10 }}>
            {errors.courseVideos}
          </Text>
        )}

        {courseVideos.map((video, index) => (
          <View
            key={video.id}
            style={{
              borderWidth: 1,
              borderColor: COLORS.lightGray,
              borderRadius: 12,
              padding: 14,
              marginBottom: 12,
              backgroundColor: '#FAFBFD',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.black }}>
                Video {index + 1}
              </Text>
              <TouchableOpacity onPress={() => removeVideoItem(video.id)}>
                <Text style={{ color: '#DC2626', fontWeight: '600' }}>Remove</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 6 }}>
              Video Title *
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: videoErrors[video.id]?.title ? '#DC2626' : COLORS.gray,
                borderRadius: 8,
                padding: 10,
                fontSize: 14,
                color: COLORS.black,
                marginBottom: 6,
              }}
              placeholder="Enter video title"
              value={video.title}
              onChangeText={(text) => updateVideoItem(video.id, 'title', text)}
            />
            {videoErrors[video.id]?.title && (
              <Text style={{ color: '#DC2626', fontSize: 12, marginBottom: 8 }}>
                {videoErrors[video.id]?.title}
              </Text>
            )}

            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 6 }}>
              Video Description *
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: videoErrors[video.id]?.description ? '#DC2626' : COLORS.gray,
                borderRadius: 8,
                padding: 10,
                fontSize: 14,
                color: COLORS.black,
                height: 80,
                textAlignVertical: 'top',
                marginBottom: 6,
              }}
              placeholder="Describe this video lesson"
              value={video.description}
              onChangeText={(text) => updateVideoItem(video.id, 'description', text)}
              multiline
            />
            {videoErrors[video.id]?.description && (
              <Text style={{ color: '#DC2626', fontSize: 12, marginBottom: 8 }}>
                {videoErrors[video.id]?.description}
              </Text>
            )}

            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 6 }}>
              Video Thumbnail *
            </Text>
            <ImageUpload
              currentImageUrl={video.thumbnailUrl}
              currentPublicId={video.thumbnailPublicId}
              uploadType="service"
              placeholder="Tap to upload video thumbnail"
              onImageUploaded={(imageUrl, publicId) => {
                updateVideoItem(video.id, 'thumbnailUrl', imageUrl);
                updateVideoItem(video.id, 'thumbnailPublicId', publicId);
              }}
              onImageDeleted={() => {
                updateVideoItem(video.id, 'thumbnailUrl', '');
                updateVideoItem(video.id, 'thumbnailPublicId', '');
              }}
            />
            {videoErrors[video.id]?.thumbnailUrl && (
              <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 6, marginBottom: 8 }}>
                {videoErrors[video.id]?.thumbnailUrl}
              </Text>
            )}

            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 6 }}>
              Video File *
            </Text>
            
            {/* Video Preview Section */}
            {video.videoUrl && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.gray, marginBottom: 6 }}>
                  Video Preview
                </Text>
                
                {/* Video Thumbnail with Play Button */}
                <TouchableOpacity
                  style={{
                    borderWidth: 1,
                    borderColor: COLORS.gray,
                    borderRadius: 8,
                    overflow: 'hidden',
                    backgroundColor: '#F5F5F5',
                    position: 'relative'
                  }}
                  onPress={() => {
                    openVideoPreview(video.videoUrl);
                  }}
                >
                  <Image
                    source={{ uri: video.videoUrl }}
                    style={{
                      width: '100%',
                      height: 200,
                      backgroundColor: '#000'
                    }}
                    resizeMode="cover"
                  />
                  
                  {/* Play button overlay */}
                  <View style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: [{ translateX: -20 }, { translateY: -20 }],
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    borderRadius: 20,
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: 'bold' }}>
                      ▶
                    </Text>
                  </View>
                </TouchableOpacity>
                
                {/* Video Actions */}
                <View style={{
                  flexDirection: 'row',
                  gap: 8,
                  marginTop: 8
                }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 10,
                      backgroundColor: COLORS.blue,
                      borderRadius: 6
                    }}
                    onPress={() => handleUploadVideo(video.id)}
                    disabled={video.isUploadingVideo}
                  >
                    <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '500' }}>
                      Replace Video
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 10,
                      backgroundColor: '#DC2626',
                      borderRadius: 6
                    }}
                    onPress={() => handleRemoveVideo(video.id)}
                    disabled={video.isUploadingVideo}
                  >
                    <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '500' }}>
                      Remove Video
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={{ fontSize: 10, color: COLORS.gray, marginTop: 4 }}>
                  Current file: {video.videoFileName || 'video'}
                </Text>
              </View>
            )}
            
            {/* Upload Button (shown when no video exists) */}
            {!video.videoUrl && (
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: videoErrors[video.id]?.videoUrl ? '#DC2626' : COLORS.gray,
                  borderRadius: 8,
                  padding: 12,
                  backgroundColor: COLORS.white,
                  marginBottom: 6,
                }}
                onPress={() => handleUploadVideo(video.id)}
                disabled={video.isUploadingVideo}
              >
                {video.isUploadingVideo ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={COLORS.green} />
                    <Text style={{ marginLeft: 8, color: COLORS.gray }}>Uploading video...</Text>
                  </View>
                ) : (
                  <Text style={{ color: COLORS.black }}>
                    Tap to upload video
                  </Text>
                )}
              </TouchableOpacity>
            )}
            
            {videoErrors[video.id]?.videoUrl && (
              <Text style={{ color: '#DC2626', fontSize: 12 }}>
                {videoErrors[video.id]?.videoUrl}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
  const renderStep3 = () => (
    <View style={{ gap: 20 }}>
      <View>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 8 }}>
          Pricing Type
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              padding: 16,
              borderRadius: 8,
              borderWidth: 2,
              backgroundColor: formData.isFree ? COLORS.green + '20' : 'transparent',
              borderColor: formData.isFree ? COLORS.green : COLORS.gray,
            }}
            onPress={() => updateFormData('isFree', true)}
          >
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: formData.isFree ? COLORS.green : COLORS.black,
              textAlign: 'center',
            }}>
              Free Course
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              flex: 1,
              padding: 16,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: !formData.isFree ? COLORS.green : COLORS.gray,
              backgroundColor: !formData.isFree ? COLORS.green + '20' : 'transparent',
            }}
            onPress={() => updateFormData('isFree', false)}
          >
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: !formData.isFree ? COLORS.green : COLORS.black,
              textAlign: 'center',
            }}>
              Paid Course
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {!formData.isFree && (
        <View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 8 }}>
            Price (USD) *
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: errors.price ? '#DC2626' : COLORS.gray,
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              color: COLORS.black,
            }}
            placeholder="0.00"
            value={formData.price}
            onChangeText={(text) => updateFormData('price', text)}
            keyboardType="numeric"
          />
          {errors.price && (
            <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }}>
              {errors.price}
            </Text>
          )}
        </View>
      )}

      {/* Course Access Limits */}
      <View>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 8 }}>
          Course Access Limit *
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ACCESS_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 25,
                borderWidth: 2,
                marginBottom: 8,
                backgroundColor: formData.accessType === type.id ? COLORS.blue : 'transparent',
                borderColor: formData.accessType === type.id ? COLORS.blue : COLORS.gray,
              }}
              onPress={() => updateFormData('accessType', type.id)}
            >
              <Text style={{
                fontSize: 15,
                fontWeight: '600',
                color: formData.accessType === type.id ? COLORS.white : COLORS.black,
              }}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Duration Input for Weekly/Monthly/Yearly */}
      {formData.accessType !== 'lifetime' && (
        <View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 8 }}>
            {formData.accessType === 'weekly' ? 'Number of Weeks' : 
              formData.accessType === 'monthly' ? 'Number of Months' : 
              'Number of Years'} *
          </Text>
          <TextInput
            style={{
              borderWidth: 2,
              borderColor: errors.accessDuration ? '#DC2626' : COLORS.blue,
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              color: COLORS.black,
              backgroundColor: COLORS.white,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
            placeholder={`Enter number of ${formData.accessType === 'weekly' ? 'weeks' : 
              formData.accessType === 'monthly' ? 'months' : 'years'}`}
            placeholderTextColor={COLORS.gray}
            value={formData.accessDuration}
            onChangeText={(text) => updateFormData('accessDuration', text)}
            keyboardType="numeric"
          />
          {errors.accessDuration && (
            <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }}>
              {errors.accessDuration}
            </Text>
          )}
        </View>
      )}

      <View>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 8 }}>
          Total Duration (minutes) *
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: errors.durationMinutes ? '#DC2626' : COLORS.gray,
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            color: COLORS.black,
          }}
          placeholder="e.g. 120"
          value={formData.durationMinutes}
          onChangeText={(text) => updateFormData('durationMinutes', text)}
          keyboardType="numeric"
        />
        {errors.durationMinutes && (
          <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }}>
            {errors.durationMinutes}
          </Text>
        )}
      </View>

      <View>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 8 }}>
          Learning Objectives * (comma or new line separated)
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: errors.objectivesText ? '#DC2626' : COLORS.gray,
            borderRadius: 8,
            padding: 12,
            fontSize: 14,
            color: COLORS.black,
            minHeight: 90,
            textAlignVertical: 'top',
          }}
          placeholder="Example: Build React Native apps, Deploy to production"
          value={formData.objectivesText}
          onChangeText={(text) => updateFormData('objectivesText', text)}
          multiline
        />
        {errors.objectivesText && (
          <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }}>
            {errors.objectivesText}
          </Text>
        )}
      </View>

      <View>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 8 }}>
          Prerequisites (optional)
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: COLORS.gray,
            borderRadius: 8,
            padding: 12,
            fontSize: 14,
            color: COLORS.black,
            minHeight: 70,
            textAlignVertical: 'top',
          }}
          placeholder="Example: Basic JavaScript"
          value={formData.prerequisitesText}
          onChangeText={(text) => updateFormData('prerequisitesText', text)}
          multiline
        />
      </View>

      <View>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 8 }}>
          Target Audience (optional)
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: COLORS.gray,
            borderRadius: 8,
            padding: 12,
            fontSize: 14,
            color: COLORS.black,
            minHeight: 70,
            textAlignVertical: 'top',
          }}
          placeholder="Example: Beginners, Students, Working professionals"
          value={formData.targetAudienceText}
          onChangeText={(text) => updateFormData('targetAudienceText', text)}
          multiline
        />
      </View>

      <View>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 8 }}>
          Time Commitment
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: COLORS.gray,
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            color: COLORS.black,
          }}
          placeholder="e.g. 2 hours per week"
          value={formData.timeCommitment}
          onChangeText={(text) => updateFormData('timeCommitment', text)}
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black }}>
          Certificate Available
        </Text>
        <TouchableOpacity
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: formData.certificateAvailable ? COLORS.green : COLORS.gray,
            backgroundColor: formData.certificateAvailable ? COLORS.green + '20' : 'transparent',
          }}
          onPress={() => updateFormData('certificateAvailable', !formData.certificateAvailable)}
        >
          <Text style={{ color: formData.certificateAvailable ? COLORS.green : COLORS.black, fontWeight: '600' }}>
            {formData.certificateAvailable ? 'Yes' : 'No'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  const renderStep4 = () => (
    <View style={{ gap: 20 }}>
      <View style={{
        backgroundColor: COLORS.white,
        padding: 20,
        borderRadius: 12,
      }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 16 }}>
          Course Summary
        </Text>
        
        <View style={{ gap: 12 }}>
          <View>
            <Text style={{ fontSize: 14, color: COLORS.gray }}>Title:</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black }}>
              {formData.title}
            </Text>
          </View>
          
          <View>
            <Text style={{ fontSize: 14, color: COLORS.gray }}>Category:</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black }}>
              {formData.category}
            </Text>
          </View>
          
          <View>
            <Text style={{ fontSize: 14, color: COLORS.gray }}>Level:</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black }}>
              {formData.level}
            </Text>
          </View>
          
          <View>
            <Text style={{ fontSize: 14, color: COLORS.gray }}>Price:</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black }}>
              {formData.isFree ? 'Free' : `$${formData.price}`}
            </Text>
          </View>
          
          <View>
            <Text style={{ fontSize: 14, color: COLORS.gray }}>Description:</Text>
            <Text style={{ fontSize: 14, color: COLORS.black, lineHeight: 20 }}>
              {formData.description}
            </Text>
          </View>

          <View>
            <Text style={{ fontSize: 14, color: COLORS.gray }}>Thumbnail:</Text>
            <Text style={{ fontSize: 14, color: COLORS.black }}>
              {formData.thumbnailUrl ? 'Uploaded' : 'Not added'}
            </Text>
          </View>

          <View>
            <Text style={{ fontSize: 14, color: COLORS.gray }}>Videos:</Text>
            <Text style={{ fontSize: 14, color: COLORS.black }}>
              {courseVideos.length} uploaded
            </Text>
          </View>

          <View>
            <Text style={{ fontSize: 14, color: COLORS.gray }}>Preview video:</Text>
            <Text style={{ fontSize: 14, color: COLORS.black }}>
              {formData.previewVideoUrl.trim() ? 'Intro video uploaded' : 'Uses first lesson video'}
            </Text>
          </View>

          <View>
            <Text style={{ fontSize: 14, color: COLORS.gray }}>Duration:</Text>
            <Text style={{ fontSize: 14, color: COLORS.black }}>
              {formData.durationMinutes || 0} minutes
            </Text>
          </View>

          <View>
            <Text style={{ fontSize: 14, color: COLORS.gray }}>Objectives:</Text>
            <Text style={{ fontSize: 14, color: COLORS.black }}>
              {formData.objectivesText.trim() ? formData.objectivesText : 'Not provided'}
            </Text>
          </View>
        </View>
      </View>

      <View style={{
        backgroundColor: '#FFF3CD',
        padding: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#FFC107',
      }}>
        <Text style={{ fontSize: 14, color: '#856404' }}>
          Videos and thumbnails are uploaded in Step 2 before course creation.
        </Text>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F8FB' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        
        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: COLORS.black,
          marginLeft: 16,
          flex: 1,
        }}>
          {isEditMode ? 'Edit Course' : 'Create Course'}
        </Text>
      </View>

      {/* Progress Steps */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
      }}>
        {STEPS.map((step) => (
          <View key={step.id} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: currentStep >= step.id ? COLORS.green : COLORS.lightGray,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: currentStep >= step.id ? COLORS.white : COLORS.gray,
              }}>
                {step.id}
              </Text>
            </View>
            
            <Text style={{
              fontSize: 12,
              color: currentStep >= step.id ? COLORS.green : COLORS.gray,
              textAlign: 'center',
            }}>
              {step.title}
            </Text>
          </View>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 16,
          padding: 18,
          borderWidth: 1,
          borderColor: '#E8ECF2',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: COLORS.black,
            marginBottom: 8,
          }}>
            {STEPS[currentStep - 1].title}
          </Text>
          
          <Text style={{
            fontSize: 16,
            color: COLORS.gray,
            marginBottom: 20,
          }}>
            {STEPS[currentStep - 1].description}
          </Text>

          {renderStepContent()}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={{
        flexDirection: 'row',
        padding: 20,
        paddingBottom: 24,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 6,
      }}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.gray,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={handlePrevious}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ArrowLeft size={20} color={COLORS.black} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginLeft: 8 }}>
                Previous
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 16,
            borderRadius: 12,
            backgroundColor: COLORS.green,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={handleNext}
          disabled={isLoading || isPrefilling}
        >
          {isLoading || isPrefilling ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.white, marginRight: 8 }}>
                {currentStep === 4 ? (isEditMode ? 'Save Changes' : 'Create Course') : 'Next'}
              </Text>
              <ArrowRight size={20} color={COLORS.white} />
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Video Player Modal */}
      <Modal
        visible={showVideoPlayer}
        animationType="fade"
        presentationStyle="overFullScreen"
        transparent={true}
        onRequestClose={() => {
          setShowVideoPlayer(false);
          setCurrentVideoUrl('');
          setIsVideoPlaying(false);
        }}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            width: '92%',
            maxWidth: 520,
            backgroundColor: '#000',
            borderRadius: 14,
            overflow: 'hidden',
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 10,
              backgroundColor: '#121212',
            }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                Video Preview
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowVideoPlayer(false);
                  setCurrentVideoUrl('');
                  setIsVideoPlaying(false);
                }}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
            </View>

            <View style={{ aspectRatio: 16 / 9, backgroundColor: '#000' }}>
              {nativeVideoAvailable ? (
                <Video
                  ref={videoRef}
                  source={{ uri: currentVideoUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                  controls={true}
                  paused={!isVideoPlaying}
                  onLoad={() => setIsVideoPlaying(true)}
                  onError={(error: any) => {
                    logger.error('❌ [CourseCreation] Video error:', error);
                    Alert.alert('Preview issue', 'Could not play this video.');
                  }}
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 18,
                  }}
                >
                  <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 12 }}>
                    Native video preview is unavailable in this build.
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (!currentVideoUrl) return;
                      Linking.openURL(currentVideoUrl).catch(() => {
                        Alert.alert('Issue', 'Unable to open video URL.');
                      });
                    }}
                    style={{
                      backgroundColor: COLORS.blue,
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: COLORS.white, fontWeight: '600' }}>
                      Open in Browser
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        presentationStyle="overFullScreen"
        transparent={true}
        onRequestClose={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 32,
            marginHorizontal: 40,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 10,
          }}>
            {/* Success Icon */}
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: COLORS.green + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <Text style={{ 
                fontSize: 32, 
                color: COLORS.green, 
                fontWeight: 'bold' 
              }}>
                ✓
              </Text>
            </View>
            
            {/* Success Text */}
            <Text style={{ 
              fontSize: 24, 
              fontWeight: '700', 
              color: COLORS.black,
              textAlign: 'center',
              marginBottom: 8,
            }}>
              Success!
            </Text>
            
            <Text style={{ 
              fontSize: 16, 
              color: COLORS.gray,
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 22,
            }}>
              {createdCourseTitle} {successVerb} successfully!
            </Text>
            
            {/* OK Button */}
            <TouchableOpacity
              style={{
                backgroundColor: COLORS.green,
                paddingHorizontal: 40,
                paddingVertical: 14,
                borderRadius: 8,
                minWidth: 120,
              }}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
            >
              <Text style={{ 
                color: COLORS.white, 
                fontSize: 16, 
                fontWeight: '600',
                textAlign: 'center',
              }}>
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};