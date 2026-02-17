import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import RNVideo from 'react-native-video';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Star,
  Clock,
  DollarSign,
  Video,
  BookOpen,
  TrendingUp,
  Award,
  Play,
} from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';
import { courseService, Course } from '../../../services/course.service';

type RootStackParamList = {
  CourseDetails: { courseId: string };
};

type CourseDetailsRouteProp = RouteProp<RootStackParamList, 'CourseDetails'>;

type EnrollmentLite = {
  id: string;
  studentId?: string;
  progress?: number;
  status?: string;
  enrolledAt?: string | Date;
  completedAt?: string | Date;
  certificateIssued?: boolean;
};

export default function CourseDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<CourseDetailsRouteProp>();

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentLite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'students' | 'analytics'>('overview');
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [currentVideoTitle, setCurrentVideoTitle] = useState('');

  const { courseId } = route.params;

  const loadCourseDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const [courseData, enrollmentsData] = await Promise.all([
        courseService.getCourseById(courseId),
        courseService.getCourseEnrollments(courseId).catch(() => ({ enrollments: [], total: 0 })),
      ]);
      setCourse(courseData);
      setEnrollments(enrollmentsData?.enrollments || []);
    } catch (error) {
      console.error('Error loading course details:', error);
      Alert.alert('Error', 'Failed to load course details');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourseDetails();
    const unsubscribe = navigation.addListener('focus', loadCourseDetails);
    return unsubscribe;
  }, [navigation, loadCourseDetails]);

  const handleEditCourse = () => {
    navigation.navigate('CourseCreation', { mode: 'edit', courseId });
  };

  const handleDeleteCourse = () => {
    Alert.alert(
      'Delete Course',
      'Are you sure you want to delete this course? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await courseService.deleteCourse(courseId);
              Alert.alert('Success', 'Course deleted successfully');
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Failed to delete course');
            }
          },
        },
      ],
    );
  };

  const formatDuration = (minutesOrSeconds: number): string => {
    if (!minutesOrSeconds || minutesOrSeconds <= 0) return '0m';
    const hours = Math.floor(minutesOrSeconds / 60);
    const minutes = minutesOrSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatCurrency = (amount: number, currency = 'USD'): string => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    } catch {
      return `${currency} ${amount}`;
    }
  };

  const formatLifecycleDate = (value?: Date | string): string => {
    if (!value) return 'N/A';
    const asAny = value as any;
    const parsed =
      asAny?.toDate instanceof Function
        ? asAny.toDate()
        : value instanceof Date
          ? value
          : new Date(value);
    if (!(parsed instanceof Date) || Number.isNaN(parsed.getTime())) {
      return 'N/A';
    }
    return parsed.toLocaleString();
  };

  const totalStudents = enrollments.length || course?.enrollmentCount || 0;
  const completedStudents = enrollments.filter(e => e.status === 'completed' || e.completedAt).length;
  const completionRate = totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;
  const totalRevenue = course?.isFree ? 0 : (course?.price || 0) * totalStudents;
  const averageProgress = totalStudents
    ? Math.round(
        enrollments.reduce((sum, item) => sum + (item.progress || 0), 0) / totalStudents,
      )
    : 0;
  const certificatesIssued = enrollments.filter(e => e.certificateIssued).length;

  const renderOverview = () => (
    <View>
      <View
        style={{
          backgroundColor: COLORS.white,
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.black, marginBottom: 12 }}>
          {course?.title}
        </Text>

        {!!course?.thumbnailUrl && (
          <Image
            source={{ uri: course.thumbnailUrl }}
            style={{ width: '100%', height: 160, borderRadius: 10, marginBottom: 12 }}
            resizeMode="cover"
          />
        )}

        <Text style={{ fontSize: 14, color: COLORS.gray, lineHeight: 20, marginBottom: 16 }}>
          {course?.description}
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8 }}>
            <Video size={16} color={COLORS.gray} />
            <Text style={{ fontSize: 12, color: COLORS.gray, marginLeft: 4 }}>
              {course?.lessonsCount || 0} videos
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8 }}>
            <Clock size={16} color={COLORS.gray} />
            <Text style={{ fontSize: 12, color: COLORS.gray, marginLeft: 4 }}>
              {course?.durationText || formatDuration(course?.duration || 0)}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8 }}>
            <Users size={16} color={COLORS.gray} />
            <Text style={{ fontSize: 12, color: COLORS.gray, marginLeft: 4 }}>
              {totalStudents} students
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Star size={16} color={COLORS.orange} />
            <Text style={{ fontSize: 12, color: COLORS.gray, marginLeft: 4 }}>
              {course?.averageRating?.toFixed(1) || '0.0'} ({course?.ratingCount || 0})
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <DollarSign size={18} color={COLORS.green} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.green, marginLeft: 4 }}>
              {course?.isFree ? 'Free' : formatCurrency(course?.price || 0, course?.currency || 'USD')}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: course?.status === 'published' ? COLORS.green + '20' : COLORS.orange + '20',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 4,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                color: course?.status === 'published' ? COLORS.green : COLORS.orange,
                fontWeight: '500',
                textTransform: 'uppercase',
              }}
            >
              {course?.status}
            </Text>
          </View>
        </View>
      </View>

      {(course?.rejectionReason || course?.submittedAt || course?.approvedAt || course?.publishedAt) && (
        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#E7EBF0',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 10 }}>
            Status History
          </Text>

          {!!course?.submittedAt && (
            <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 4 }}>
              Submitted: {formatLifecycleDate(course.submittedAt)}
            </Text>
          )}

          {!!course?.approvedAt && (
            <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 4 }}>
              Approved: {formatLifecycleDate(course.approvedAt)}
            </Text>
          )}

          {!!course?.publishedAt && (
            <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 4 }}>
              Published: {formatLifecycleDate(course.publishedAt)}
            </Text>
          )}

          {!!course?.rejectedAt && (
            <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 4 }}>
              Rejected: {formatLifecycleDate(course.rejectedAt)}
            </Text>
          )}

          {!!course?.rejectionReason && (
            <View
              style={{
                marginTop: 8,
                backgroundColor: '#FFF5F5',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#F5C2C7',
                padding: 10,
              }}
            >
              <Text style={{ fontSize: 12, color: '#B42318', fontWeight: '700' }}>
                Rejection Reason
              </Text>
              <Text style={{ fontSize: 12, color: '#B42318', marginTop: 4 }}>
                {course.rejectionReason}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            flex: 1,
            marginHorizontal: 4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View
              style={{
                width: 32,
                height: 32,
                backgroundColor: COLORS.blue + '20',
                borderRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 8,
              }}
            >
              <TrendingUp size={16} color={COLORS.blue} />
            </View>
            <Text style={{ fontSize: 12, color: COLORS.gray }}>Completion Rate</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.black }}>{completionRate}%</Text>
        </View>

        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            flex: 1,
            marginHorizontal: 4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View
              style={{
                width: 32,
                height: 32,
                backgroundColor: COLORS.purple + '20',
                borderRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 8,
              }}
            >
              <Award size={16} color={COLORS.purple} />
            </View>
            <Text style={{ fontSize: 12, color: COLORS.gray }}>Certificates</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.black }}>{certificatesIssued}</Text>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    const videos = course?.videos || [];
    return (
      <View
        style={{
          backgroundColor: COLORS.white,
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.black, marginBottom: 16 }}>
          Course Content
        </Text>

        <View
          style={{
            borderWidth: 1,
            borderColor: COLORS.lightGray,
            borderRadius: 10,
            padding: 14,
            marginBottom: 16,
            backgroundColor: '#FFFFFF',
          }}
        >
          <Text style={{ fontSize: 13, color: COLORS.gray, fontWeight: '600', marginBottom: 6 }}>
            Course Overview
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
            {course?.title || 'Untitled Course'}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.gray, marginTop: 6, lineHeight: 18 }}>
            {course?.description || 'No course description provided.'}
          </Text>
        </View>

        <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.black, marginBottom: 10 }}>
          Video Lessons
        </Text>

        {videos.length > 0 ? (
          videos.map((video, index) => (
            <View
              key={video.id || `video-${index + 1}`}
              style={{
                borderWidth: 1,
                borderColor: COLORS.lightGray,
                borderRadius: 10,
                padding: 12,
                marginBottom: 10,
                backgroundColor: '#FAFBFD',
              }}
            >
              <TouchableOpacity
                style={{
                  height: 180,
                  borderRadius: 10,
                  overflow: 'hidden',
                  marginBottom: 10,
                  backgroundColor: '#111827',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                disabled={!video.videoUrl}
                onPress={() => {
                  if (!video.videoUrl) return;
                  setCurrentVideoUrl(video.videoUrl);
                  setCurrentVideoTitle(video.title || `Lesson ${index + 1}`);
                  setShowVideoPlayer(true);
                }}
              >
                {video.thumbnailUrl ? (
                  <Image
                    source={{ uri: video.thumbnailUrl }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ width: '100%', height: '100%', backgroundColor: '#1F2937' }} />
                )}

                <View
                  style={{
                    position: 'absolute',
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Play size={22} color={COLORS.white} />
                </View>
              </TouchableOpacity>

              <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.black }}>
                {index + 1}. {video.title || `Lesson ${index + 1}`}
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.gray, marginTop: 4 }}>
                {video.description || 'No description provided'}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.gray, marginTop: 6 }}>
                {video.videoUrl ? 'Video uploaded' : 'Video missing'}
              </Text>
            </View>
          ))
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 30 }}>
            <BookOpen size={44} color={COLORS.gray} />
            <Text style={{ fontSize: 15, color: COLORS.gray, marginTop: 10 }}>
              No structured lessons found.
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.gray, marginTop: 2, textAlign: 'center' }}>
              Edit this course to add lesson-wise video metadata.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderStudents = () => (
    <View
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.black, marginBottom: 16 }}>
        Enrolled Students
      </Text>

      {enrollments.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 30 }}>
          <Users size={44} color={COLORS.gray} />
          <Text style={{ fontSize: 15, color: COLORS.gray, marginTop: 10 }}>No students enrolled yet.</Text>
        </View>
      ) : (
        enrollments.map((item, index) => (
          <View
            key={item.id || `enrollment-${index + 1}`}
            style={{
              borderWidth: 1,
              borderColor: COLORS.lightGray,
              borderRadius: 10,
              padding: 12,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.black }}>
              Student: {item.studentId || `Student ${index + 1}`}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ fontSize: 12, color: COLORS.gray }}>
                Status: {(item.status || 'active').toUpperCase()}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.gray }}>
                Progress: {Math.round(item.progress || 0)}%
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderAnalytics = () => (
    <View
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.black, marginBottom: 16 }}>
        Course Analytics
      </Text>

      <View style={{ gap: 10 }}>
        <View style={{ padding: 12, borderRadius: 10, backgroundColor: '#F7F8FA' }}>
          <Text style={{ fontSize: 12, color: COLORS.gray }}>Total Enrollments</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.black }}>{totalStudents}</Text>
        </View>
        <View style={{ padding: 12, borderRadius: 10, backgroundColor: '#F7F8FA' }}>
          <Text style={{ fontSize: 12, color: COLORS.gray }}>Average Progress</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.black }}>{averageProgress}%</Text>
        </View>
        <View style={{ padding: 12, borderRadius: 10, backgroundColor: '#F7F8FA' }}>
          <Text style={{ fontSize: 12, color: COLORS.gray }}>Completion Rate</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.black }}>{completionRate}%</Text>
        </View>
        <View style={{ padding: 12, borderRadius: 10, backgroundColor: '#F7F8FA' }}>
          <Text style={{ fontSize: 12, color: COLORS.gray }}>Estimated Revenue</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.green }}>
            {formatCurrency(totalRevenue, course?.currency || 'USD')}
          </Text>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.green} />
        <Text style={{ marginTop: 16, color: COLORS.gray }}>Loading course details...</Text>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: COLORS.gray }}>Course not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.lightGray,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: COLORS.black,
            marginLeft: 16,
            flex: 1,
          }}
        >
          Course Details
        </Text>

        <TouchableOpacity onPress={handleEditCourse} style={{ marginRight: 16 }}>
          <Edit size={20} color={COLORS.gray} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDeleteCourse}>
          <Trash2 size={20} color={COLORS.red} />
        </TouchableOpacity>
      </View>

      <View
        style={{
          flexDirection: 'row',
          backgroundColor: COLORS.white,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.lightGray,
        }}
      >
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'content', label: 'Content' },
          { key: 'students', label: 'Students' },
          { key: 'analytics', label: 'Analytics' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderBottomWidth: 2,
              borderBottomColor: activeTab === tab.key ? COLORS.green : 'transparent',
            }}
            onPress={() => setActiveTab(tab.key as 'overview' | 'content' | 'students' | 'analytics')}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: activeTab === tab.key ? COLORS.green : COLORS.gray,
                textAlign: 'center',
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'content' && renderContent()}
        {activeTab === 'students' && renderStudents()}
        {activeTab === 'analytics' && renderAnalytics()}
      </ScrollView>

      <Modal
        visible={showVideoPlayer}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowVideoPlayer(false);
          setCurrentVideoUrl('');
          setCurrentVideoTitle('');
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: COLORS.black, borderRadius: 12, overflow: 'hidden' }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 10,
                backgroundColor: '#111827',
              }}
            >
              <Text style={{ color: COLORS.white, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                {currentVideoTitle || 'Lesson Preview'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowVideoPlayer(false);
                  setCurrentVideoUrl('');
                  setCurrentVideoTitle('');
                }}
              >
                <Text style={{ color: COLORS.white, fontSize: 22 }}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: COLORS.black }}>
              {currentVideoUrl ? (
                <RNVideo
                  source={{ uri: currentVideoUrl }}
                  style={{ width: '100%', height: '100%' }}
                  controls
                  resizeMode="contain"
                />
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
