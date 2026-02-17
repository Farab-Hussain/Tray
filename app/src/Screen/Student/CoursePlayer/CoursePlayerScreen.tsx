import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Play, Pause, CheckCircle, BookOpen, Users, Star, Lock } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';
import { courseService, Course } from '../../../services/course.service';

interface RouteParams {
  courseId: string;
}

export default function CoursePlayerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { courseId } = route.params as RouteParams;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Mock video data for demonstration
  const mockVideos = [
    { id: '1', title: 'Introduction to Course', duration: 300, isPreview: true },
    { id: '2', title: 'Getting Started', duration: 600, isPreview: false },
    { id: '3', title: 'Core Concepts', duration: 900, isPreview: false },
    { id: '4', title: 'Advanced Topics', duration: 1200, isPreview: false },
  ];

  const currentVideo = mockVideos[currentVideoIndex];

  React.useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setIsLoading(true);
      const courseData = await courseService.getCourseById(courseId);
      setCourse(courseData);
    } catch (error) {
      console.error('Error loading course:', error);
      Alert.alert('Error', 'Failed to load course');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      // Simulate enrollment
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEnrolled(true);
      setShowEnrollmentModal(false);
      Alert.alert('Success!', 'You have successfully enrolled in this course.');
    } catch (error) {
      Alert.alert('Error', 'Failed to enroll in course');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleVideoPress = (index: number) => {
    if (index === 0 || isEnrolled) {
      setCurrentVideoIndex(index);
      setIsPlaying(true);
    } else {
      setShowEnrollmentModal(true);
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
        <Play size={48} color={COLORS.white} />
        <Text style={{
          color: COLORS.white,
          marginTop: 16,
          fontSize: 16,
        }}>
          {currentVideo.title}
        </Text>
        <Text style={{
          color: COLORS.gray,
          marginTop: 8,
          fontSize: 14,
        }}>
          {formatDuration(currentVideo.duration)}
        </Text>
      </View>

      {/* Video Controls */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#1a1a1a',
      }}>
        <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? (
            <Pause size={24} color={COLORS.white} />
          ) : (
            <Play size={24} color={COLORS.white} />
          )}
        </TouchableOpacity>
        
        <View style={{ flex: 1, marginHorizontal: 16 }}>
          <View style={{
            height: 4,
            backgroundColor: COLORS.gray,
            borderRadius: 2,
          }}>
            <View style={{
              height: '100%',
              width: '30%',
              backgroundColor: COLORS.green,
              borderRadius: 2,
            }} />
          </View>
        </View>
        
        <Text style={{
          color: COLORS.white,
          fontSize: 12,
        }}>
          2:45 / 9:20
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
                {mockVideos.length} videos
              </Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <Star size={20} color={COLORS.orange} />
              <Text style={{
                fontSize: 14,
                color: COLORS.gray,
                marginTop: 4,
              }}>
                {course.rating && course.rating > 0 && (
                <Text style={{
                  fontSize: 14,
                  color: COLORS.gray,
                  marginTop: 4,
                }}>
                  {course.rating.toFixed(1)}
                </Text>
              )}
              </Text>
            </View>
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

          {mockVideos.map((video, index) => (
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
        animationType="fade"
        onRequestClose={() => setShowEnrollmentModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400,
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: COLORS.black,
              marginBottom: 16,
              textAlign: 'center',
            }}>
              Enroll in Course
            </Text>
            
            <Text style={{
              fontSize: 16,
              color: COLORS.gray,
              marginBottom: 24,
              textAlign: 'center',
            }}>
              Get full access to all course content and track your progress.
            </Text>
            
            <View style={{
              flexDirection: 'row',
              gap: 12,
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: COLORS.gray,
                  justifyContent: 'center',
                }}
                onPress={() => setShowEnrollmentModal(false)}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: COLORS.black,
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 8,
                  backgroundColor: COLORS.green,
                  justifyContent: 'center',
                }}
                onPress={handleEnroll}
                disabled={isEnrolling}
              >
                {isEnrolling ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: COLORS.white,
                  }}>
                    Enroll - {formatCurrency(course.price)}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
