import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Play, Pause, CheckCircle, BookOpen, Users, Star, Lock } from 'lucide-react-native';
import { useStripe } from '@stripe/stripe-react-native';
import RNVideo from 'react-native-video';
import { COLORS } from '../../../constants/core/colors';
import { courseService, Course } from '../../../services/course.service';
import PaymentService from '../../../services/payment.service';
import { useAuth } from '../../../contexts/AuthContext';
import { logger } from '../../../utils/logger';

interface RouteParams {
  courseId: string;
}

interface PlayerVideoItem {
  id: string;
  title: string;
  duration: number;
  isPreview: boolean;
  videoUrl: string;
}

export default function CoursePlayerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { courseId } = route.params as RouteParams;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [displayRating, setDisplayRating] = useState(0);
  const [displayRatingCount, setDisplayRatingCount] = useState(0);
  const videoRef = React.useRef<any>(null);

  const videoItems = React.useMemo<PlayerVideoItem[]>(() => {
    if (!course) return [];

    const courseVideos = (course.videos || []).filter(video => !!video.videoUrl?.trim());
    const estimatedDurationSeconds =
      course.duration > 0 && courseVideos.length > 0
        ? Math.max(60, Math.round((course.duration * 60) / courseVideos.length))
        : 300;
    const previewVideoUrl = course.previewVideoUrl?.trim() || '';

    const items: PlayerVideoItem[] = [];

    if (previewVideoUrl) {
      const previewExistsInCourseVideos = courseVideos.some(
        video => (video.videoUrl || '').trim() === previewVideoUrl,
      );
      if (!previewExistsInCourseVideos) {
        items.push({
          id: 'preview',
          title: 'Course Preview',
          duration: estimatedDurationSeconds,
          isPreview: true,
          videoUrl: previewVideoUrl,
        });
      }
    }

    courseVideos.forEach((video, index) => {
      items.push({
        id: video.id || `video-${index + 1}`,
        title: video.title?.trim() || `Lesson ${index + 1}`,
        duration: estimatedDurationSeconds,
        isPreview: !previewVideoUrl && index === 0,
        videoUrl: (video.videoUrl || '').trim(),
      });
    });

    return items;
  }, [course]);

  const currentVideo = videoItems[currentVideoIndex] || null;

  React.useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        const [courseData, enrollmentData] = await Promise.all([
          courseService.getCourseById(courseId),
          courseService.getMyEnrollments({ page: 1, limit: 100 }),
        ]);
        setCourse(courseData);
        setDisplayRating(courseData.averageRating || courseData.rating || 0);
        setDisplayRatingCount(courseData.ratingCount || 0);
        const enrolled = (enrollmentData?.enrollments || []).some(
          enrollment => enrollment.courseId === courseId && enrollment.status === 'active',
        );
        setIsEnrolled(enrolled);

        if (user?.uid) {
          try {
            const reviewsRes = await courseService.getCourseReviews(courseId, { page: 1, limit: 100 });
            const myReview = (reviewsRes?.reviews || []).find((review: any) => review.studentId === user.uid);
            if (myReview) {
              setSelectedRating(Number(myReview.rating) || 0);
              setRatingComment(myReview.comment || '');
            }
          } catch (reviewErr) {
            if (__DEV__) {
              logger.debug('Could not fetch course reviews for current user', reviewErr);
            }
          }
        }
      } catch (error) {
        logger.error('Error loading course:', error);
        Alert.alert('Error', 'Failed to load course');
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [courseId]);

  React.useEffect(() => {
    if (currentVideoIndex >= videoItems.length) {
      setCurrentVideoIndex(0);
      setIsPlaying(false);
    }
  }, [currentVideoIndex, videoItems.length]);

  React.useEffect(() => {
    setVideoCurrentTime(0);
    setVideoDuration(0);
  }, [currentVideoIndex]);

  const handleEnroll = async () => {
    if (!course) return;

    if (!course.isFree && (course.price || 0) > 0) {
      Alert.alert(
        'Payment Required',
        `This is a paid course (${formatCurrency(course.price)}). Complete payment before enrollment.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Pay ${formatCurrency(course.price)}`,
            onPress: () => {
              void handlePaidCourseEnrollment();
            },
          },
        ],
      );
      return;
    }

    setIsEnrolling(true);
    try {
      await courseService.enrollInCourse(courseId);
      setIsEnrolled(true);
      setShowEnrollmentModal(false);
      Alert.alert('Success!', 'You have successfully enrolled in this course.');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to enroll in course');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handlePaidCourseEnrollment = async () => {
    if (!course) return;
    if (!user?.uid) {
      Alert.alert('Authentication Required', 'Please log in to complete payment.');
      return;
    }

    setIsEnrolling(true);
    try {
      const paymentIntent = await PaymentService.createPaymentIntent({
        amount: Number(course.price || 0),
        currency: 'usd',
        bookingId: `COURSE_${courseId}_${Date.now()}`,
        studentId: user.uid,
        consultantId: course.instructorId || 'COURSE_INSTRUCTOR',
      });

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Tray',
        paymentIntentClientSecret: paymentIntent.clientSecret,
        defaultBillingDetails: {
          name: user.displayName || user.email || 'Student',
        },
        allowsDelayedPaymentMethods: true,
        returnURL: 'tray://stripe-redirect',
      });

      if (initError) {
        Alert.alert('Payment Error', initError.message || 'Failed to initialize payment form.');
        return;
      }

      const { error: paymentError } = await presentPaymentSheet();
      if (paymentError) {
        if (paymentError.code !== 'Canceled') {
          Alert.alert('Payment Failed', paymentError.message || 'Payment could not be processed.');
        }
        return;
      }

      await courseService.enrollInCourse(courseId, { paymentId: paymentIntent.paymentIntentId });
      setIsEnrolled(true);
      setShowEnrollmentModal(false);
      Alert.alert('Success!', 'Payment completed and enrollment successful.');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to complete payment and enrollment');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleVideoPress = (index: number) => {
    const selectedVideo = videoItems[index];
    if (!selectedVideo) return;

    if (selectedVideo.isPreview || isEnrolled) {
      setCurrentVideoIndex(index);
      setIsPlaying(true);
    } else {
      setShowEnrollmentModal(true);
    }
  };

  const clampTime = React.useCallback(
    (time: number) => Math.max(0, Math.min(time, videoDuration || 0)),
    [videoDuration],
  );

  const seekToTime = React.useCallback(
    (nextTime: number) => {
      if (!currentVideo || !videoRef.current || !Number.isFinite(nextTime)) return;
      const clampedTime = clampTime(nextTime);
      try {
        videoRef.current.seek(clampedTime);
        setVideoCurrentTime(clampedTime);
      } catch (error) {
        if (__DEV__) {
          logger.error('Seek error:', error);
        }
      }
    },
    [clampTime, currentVideo],
  );

  const seekRelative = React.useCallback(
    (deltaSeconds: number) => {
      seekToTime(videoCurrentTime + deltaSeconds);
    },
    [seekToTime, videoCurrentTime],
  );

  const seekFromBarTouch = React.useCallback(
    (locationX: number) => {
      if (!videoDuration || progressBarWidth <= 0) return;
      const ratio = Math.max(0, Math.min(locationX / progressBarWidth, 1));
      const targetTime = ratio * videoDuration;
      seekToTime(targetTime);
    },
    [progressBarWidth, seekToTime, videoDuration],
  );

  const handleOpenRating = () => {
    if (!isEnrolled) {
      Alert.alert('Enrollment Required', 'Please enroll in this course before rating.');
      return;
    }
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (!course) return;
    if (selectedRating < 1 || selectedRating > 5) {
      Alert.alert('Rating Required', 'Please choose a rating from 1 to 5 stars.');
      return;
    }

    setIsSubmittingRating(true);
    try {
      await courseService.addCourseReview(course.id, {
        rating: selectedRating,
        comment: ratingComment.trim() || 'Great course',
      });

      const latestReviews = await courseService.getCourseReviews(course.id, { page: 1, limit: 200 });
      const allReviews = latestReviews?.reviews || [];
      const count = allReviews.length;
      const avg =
        count > 0
          ? Math.round(
              (allReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0) / count) * 10,
            ) / 10
          : 0;

      setDisplayRating(avg);
      setDisplayRatingCount(count);
      setCourse(prev =>
        prev
          ? {
              ...prev,
              rating: avg,
              averageRating: avg,
              ratingCount: count,
            }
          : prev,
      );

      setShowRatingModal(false);
      Alert.alert('Success', 'Your rating has been submitted.');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to submit rating');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatPlayerTime = (seconds: number): string => {
    const clamped = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(clamped / 60);
    const secs = clamped % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.green} />
        <Text style={{ marginTop: 16, color: COLORS.gray }}>Loading course...</Text>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.black }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.black,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.white} />
        </TouchableOpacity>
        
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: COLORS.white,
          marginLeft: 16,
          flex: 1,
        }}>
          {course.title}
        </Text>
      </View>

      {/* Video Player Area */}
      <View style={{
        backgroundColor: '#1a1a1a',
        aspectRatio: 16 / 9,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {currentVideo ? (
          <>
            <RNVideo
              ref={videoRef}
              source={{ uri: currentVideo.videoUrl }}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backgroundColor: '#000',
              }}
              resizeMode="contain"
              paused={!isPlaying}
              onLoad={(data) => {
                setVideoDuration(data.duration || 0);
              }}
              onProgress={(data) => {
                if (!isSeeking) {
                  setVideoCurrentTime(data.currentTime || 0);
                }
              }}
              onError={() => {
                setIsPlaying(false);
                Alert.alert('Playback Error', 'Unable to play this video.');
              }}
            />
            {!isPlaying && (
              <View style={{ alignItems: 'center' }}>
                <Play size={48} color={COLORS.white} />
                <Text style={{
                  color: COLORS.white,
                  marginTop: 16,
                  fontSize: 16,
                }}>
                  {currentVideo.title}
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            {course.thumbnailUrl ? (
              <Image
                source={{ uri: course.thumbnailUrl }}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  opacity: 0.35,
                }}
                resizeMode="cover"
              />
            ) : null}
            <Text style={{
              color: COLORS.white,
              fontSize: 18,
              fontWeight: '600',
            }}>
              No video preview available
            </Text>
          </>
        )}
      </View>

      {/* Video Controls */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#1a1a1a',
      }}>
        <TouchableOpacity
          onPress={() => {
            if (!currentVideo) return;
            setIsPlaying(!isPlaying);
          }}
        >
          {isPlaying ? (
            <Pause size={24} color={COLORS.white} />
          ) : (
            <Play size={24} color={COLORS.white} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => seekRelative(-10)}
          disabled={!currentVideo}
          style={{ marginLeft: 14, marginRight: 6 }}
        >
          <Text style={{ color: COLORS.white, fontSize: 13, fontWeight: '700' }}>-10s</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => seekRelative(10)}
          disabled={!currentVideo}
          style={{ marginHorizontal: 6 }}
        >
          <Text style={{ color: COLORS.white, fontSize: 13, fontWeight: '700' }}>+10s</Text>
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 10, marginRight: 12 }}>
          <View
            style={{
              height: 24,
              justifyContent: 'center',
            }}
            onLayout={event => {
              setProgressBarWidth(event.nativeEvent.layout.width);
            }}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={event => {
              setIsSeeking(true);
              seekFromBarTouch(event.nativeEvent.locationX);
            }}
            onResponderMove={event => {
              seekFromBarTouch(event.nativeEvent.locationX);
            }}
            onResponderRelease={event => {
              seekFromBarTouch(event.nativeEvent.locationX);
              setIsSeeking(false);
            }}
            onResponderTerminate={() => {
              setIsSeeking(false);
            }}
          >
            <View
              style={{
                height: 4,
                backgroundColor: COLORS.gray,
                borderRadius: 2,
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${videoDuration > 0 ? Math.min(100, (videoCurrentTime / videoDuration) * 100) : 0}%`,
                  backgroundColor: COLORS.green,
                  borderRadius: 2,
                }}
              />
            </View>
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: `${videoDuration > 0 ? Math.min(100, (videoCurrentTime / videoDuration) * 100) : 0}%`,
                marginLeft: -7,
                top: 5,
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: COLORS.green,
              }}
            />
          </View>
        </View>

        <Text style={{ color: COLORS.white, fontSize: 12, minWidth: 86, textAlign: 'right' }}>
          {formatPlayerTime(videoCurrentTime)} / {formatPlayerTime(videoDuration)}
        </Text>
      </View>

      {/* Course Info */}
      <ScrollView style={{ flex: 1, backgroundColor: COLORS.white }}>
        <View style={{ padding: 20 }}>
          {/* Course Title and Instructor */}
          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: COLORS.black,
            marginBottom: 8,
          }}>
            {course.title}
          </Text>
          
          <Text style={{
            fontSize: 16,
            color: COLORS.gray,
            marginBottom: 16,
          }}>
            By {course.instructorName}
          </Text>

          {/* Course Stats */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}>
            <View style={{ alignItems: 'center' }}>
              <Users size={20} color={COLORS.gray} />
              <Text style={{
                fontSize: 14,
                color: COLORS.gray,
                marginTop: 4,
              }}>
                {course.enrollmentCount} students
              </Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <BookOpen size={20} color={COLORS.gray} />
              <Text style={{
                fontSize: 14,
                color: COLORS.gray,
                marginTop: 4,
              }}>
                {videoItems.length || course.lessonsCount || 0} videos
              </Text>
            </View>
            
            <TouchableOpacity style={{ alignItems: 'center' }} onPress={handleOpenRating}>
              <Star size={20} color={COLORS.orange} />
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.gray,
                  marginTop: 4,
                }}
              >
                {displayRating > 0 ? displayRating.toFixed(1) : '0.0'}
              </Text>
              <Text style={{ fontSize: 11, color: COLORS.gray }}>
                ({displayRatingCount || 0})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={{
            fontSize: 16,
            color: COLORS.black,
            lineHeight: 24,
            marginBottom: 24,
          }}>
            {course.description}
          </Text>

          {/* Video List */}
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: COLORS.black,
            marginBottom: 16,
          }}>
            Course Content
          </Text>

          {videoItems.map((video, index) => (
            <TouchableOpacity
              key={video.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: COLORS.lightGray,
                borderRadius: 8,
                marginBottom: 8,
              }}
              onPress={() => handleVideoPress(index)}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: currentVideoIndex === index ? COLORS.green : COLORS.gray,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16,
              }}>
                {currentVideoIndex === index && isPlaying ? (
                  <Pause size={20} color={COLORS.white} />
                ) : (
                  <Play size={20} color={COLORS.white} />
                )}
              </View>
              
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: COLORS.black,
                  marginBottom: 4,
                }}>
                  {video.title}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: COLORS.gray,
                }}>
                  {formatDuration(video.duration)}
                </Text>
              </View>

              {!video.isPreview && !isEnrolled && (
                <Lock size={20} color={COLORS.gray} />
              )}
              
              {video.isPreview && (
                <View style={{
                  backgroundColor: COLORS.green + '20',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                }}>
                  <Text style={{
                    fontSize: 12,
                    color: COLORS.green,
                    fontWeight: '500',
                  }}>
                    Preview
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {videoItems.length === 0 && (
            <View
              style={{
                backgroundColor: COLORS.lightGray,
                padding: 16,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: COLORS.gray }}>
                No course videos added yet.
              </Text>
            </View>
          )}

          {/* Enrollment Status */}
          {!isEnrolled && (
            <TouchableOpacity
              style={{
                backgroundColor: COLORS.green,
                padding: 16,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 24,
              }}
              onPress={() => setShowEnrollmentModal(true)}
            >
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: COLORS.white,
              }}>
                Enroll in Course - {formatCurrency(course.price)}
              </Text>
            </TouchableOpacity>
          )}

          {isEnrolled && (
            <View style={{
              backgroundColor: COLORS.green + '20',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
              marginTop: 24,
              flexDirection: 'row',
              justifyContent: 'center',
            }}>
              <CheckCircle size={20} color={COLORS.green} />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: COLORS.green,
                marginLeft: 8,
              }}>
                You are enrolled in this course
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Enrollment Modal */}
      <Modal
        visible={showEnrollmentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEnrollmentModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          justifyContent: 'flex-end',
        }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setShowEnrollmentModal(false)}
          />
          <View style={{
            backgroundColor: COLORS.white,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 30,
            width: '100%',
            maxWidth: 520,
            alignSelf: 'center',
          }}>
            <Text style={{
              fontSize: 28,
              fontWeight: '700',
              color: COLORS.black,
              marginBottom: 10,
              textAlign: 'center',
            }}>
              Enroll in Course
            </Text>
            
            <Text style={{
              fontSize: 17,
              color: COLORS.gray,
              lineHeight: 24,
              marginBottom: 24,
              textAlign: 'center',
            }}>
              Get full access to all course content and track your progress.
            </Text>
            
            <View style={{
              flexDirection: 'row',
              columnGap: 12,
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  minHeight: 56,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: COLORS.gray,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => setShowEnrollmentModal(false)}
              >
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: COLORS.black,
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  flex: 1,
                  minHeight: 56,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: COLORS.green,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={handleEnroll}
                disabled={isEnrolling}
              >
                {isEnrolling ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: COLORS.white,
                    textAlign: 'center',
                  }}>
                    Enroll {formatCurrency(course.price)}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            padding: 20,
          }}
          onPress={() => setShowRatingModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 12,
              padding: 16,
            }}
            onPress={e => e.stopPropagation()}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.black, marginBottom: 12 }}>
              Rate this course
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 14 }}>
              {[1, 2, 3, 4, 5].map(value => (
                <TouchableOpacity key={value} onPress={() => setSelectedRating(value)} style={{ marginHorizontal: 6 }}>
                  <Star
                    size={30}
                    color={value <= selectedRating ? COLORS.orange : COLORS.lightGray}
                    fill={value <= selectedRating ? COLORS.orange : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              placeholder="Write a short comment (optional)"
              value={ratingComment}
              onChangeText={setRatingComment}
              multiline
              style={{
                borderWidth: 1,
                borderColor: COLORS.lightGray,
                borderRadius: 10,
                minHeight: 90,
                padding: 12,
                color: COLORS.black,
                textAlignVertical: 'top',
                marginBottom: 14,
              }}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity
                onPress={() => setShowRatingModal(false)}
                style={{ paddingVertical: 10, paddingHorizontal: 14, marginRight: 8 }}
              >
                <Text style={{ color: COLORS.gray, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitRating}
                disabled={isSubmittingRating}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: COLORS.green,
                  opacity: isSubmittingRating ? 0.7 : 1,
                }}
              >
                <Text style={{ color: COLORS.white, fontWeight: '700' }}>
                  {isSubmittingRating ? 'Submitting...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
