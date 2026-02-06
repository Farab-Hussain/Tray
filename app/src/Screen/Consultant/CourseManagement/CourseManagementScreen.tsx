// src/Screen/Consultant/CourseManagement/CourseManagementScreen.tsx
// Comprehensive Course Management Interface for Consultants

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  Switch,
  Image,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { 
  Plus, 
  Edit, 
  Rocket, 
  Trash2, 
  Search, 
  BookOpen
} from 'lucide-react-native';
import { courseService, Course, CourseInput } from '../../../services/course.service';

type CourseManagementNavigationProp = StackNavigationProp<any, 'CourseManagement'>;

interface Props {
  navigation: CourseManagementNavigationProp;
  route: any;
}

export const CourseManagementScreen: React.FC<Props> = ({ navigation: _navigation, route: _route }) => {
  const insets = useSafeAreaInsets();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [_showScheduleModal, _setShowScheduleModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<'draft' | 'published' | 'archived'>('draft');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: '',
    level: 'beginner' as const,
    price: 0,
    isFree: false,
    duration: 0,
    durationText: '',
    lessonsCount: 0,
    objectives: [''],
    prerequisites: [''],
    targetAudience: [''],
    difficultyScore: 5,
    timeCommitment: '',
    certificateAvailable: true,
    tags: [''],
  });

  const [pricingOptions, setPricingOptions] = useState({
    monthly: 0,
    yearly: 0,
    lifetime: 0,
  });

  const [_scheduleData, _setScheduleData] = useState({
    startDate: new Date(),
    endDate: null,
    enrollmentDeadline: null,
    maxEnrollments: null,
  });

  const categories = [
    'Technology',
    'Business',
    'Design',
    'Marketing',
    'Personal Development',
    'Health & Fitness',
    'Finance',
    'Education',
    'Creative Arts',
  ];

  const levels = ['beginner', 'intermediate', 'advanced'];

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      // Pass empty filters object to get all courses
      const coursesData = await courseService.getMyCourses({});
      setCourses(coursesData.courses || []);
    } catch (error: any) {
      console.error('Error loading courses:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load courses';
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again in a moment.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication error. Please log in again.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
    setRefreshing(false);
  };

  const handleCreateCourse = async () => {
    try {
      // Validate form data
      if (!formData.title || !formData.description) {
        Alert.alert('Error', 'Title and description are required');
        return;
      }

      const courseData: CourseInput = {
        ...formData,
        pricingOptions,
        language: 'English',
        currency: 'USD',
        slug: formData.title.toLowerCase().replace(/\s+/g, '-'),
      };

      await courseService.createCourse(courseData);
      Alert.alert('Success', 'Course created successfully!');
      setShowCreateModal(false);
      resetForm();
      await loadCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      Alert.alert('Error', 'Failed to create course');
    }
  };

  const handleUpdateCourse = async () => {
    if (!selectedCourse) return;

    try {
      const updateData = {
        ...formData,
        pricingOptions,
        language: 'English',
        currency: 'USD',
        slug: formData.title.toLowerCase().replace(/\s+/g, '-'),
      };

      await courseService.updateCourse(selectedCourse.id, updateData);
      Alert.alert('Success', 'Course updated successfully!');
      setShowPricingModal(false);
      setSelectedCourse(null);
      await loadCourses();
    } catch (error) {
      console.error('Error updating course:', error);
      Alert.alert('Error', 'Failed to update course');
    }
  };

  const handleLaunchCourse = async (course: Course) => {
    try {
      await courseService.launchCourse(course.id);
      Alert.alert('Success', 'Course launched successfully!');
      await loadCourses();
    } catch (error) {
      console.error('Error launching course:', error);
      Alert.alert('Error', 'Failed to launch course');
    }
  };

  const handleDeleteCourse = (course: Course) => {
    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete "${course.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await courseService.deleteCourse(course.id);
              Alert.alert('Success', 'Course deleted successfully!');
              await loadCourses();
            } catch (error) {
              console.error('Error deleting course:', error);
              Alert.alert('Error', 'Failed to delete course');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      shortDescription: '',
      category: '',
      level: 'beginner',
      price: 0,
      isFree: false,
      duration: 0,
      durationText: '',
      lessonsCount: 0,
      objectives: [''],
      prerequisites: [''],
      targetAudience: [''],
      difficultyScore: 5,
      timeCommitment: '',
      certificateAvailable: true,
      tags: [''],
    });
    setPricingOptions({
      monthly: 0,
      yearly: 0,
      lifetime: 0,
    });
  };

  const openEditModal = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      shortDescription: course.shortDescription,
      category: course.category,
      level: course.level as any,
      price: course.price,
      isFree: course.isFree,
      duration: course.duration,
      durationText: course.durationText,
      lessonsCount: course.lessonsCount,
      objectives: course.objectives,
      prerequisites: course.prerequisites,
      targetAudience: course.targetAudience,
      difficultyScore: course.difficultyScore,
      timeCommitment: course.timeCommitment,
      certificateAvailable: course.certificateAvailable,
      tags: course.tags,
    });
    setPricingOptions({
      monthly: (course.pricingOptions?.monthly ?? 0) as number,
      yearly: (course.pricingOptions?.yearly ?? 0) as number,
      lifetime: (course.pricingOptions?.lifetime ?? 0) as number,
    });
    setShowPricingModal(true);
  };

  const filterCourses = useCallback(() => {
    let filtered = courses;

    // Filter by tab
    filtered = filtered.filter(course => {
      if (activeTab === 'draft') return course.status === 'draft';
      if (activeTab === 'published') return course.status === 'published';
      if (activeTab === 'archived') return course.status === 'archived';
      return true;
    });

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [courses, activeTab, searchQuery]);

  const renderCourseCard = ({ item }: { item: Course }) => (
    <View style={styles.courseCard}>
      <Image
        source={{ uri: item.thumbnailUrl || 'https://via.placeholder.com/300x200' }}
        style={styles.courseImage}
      />
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle}>{item.title}</Text>
        <Text style={styles.courseStatus}>{item.status.toUpperCase()}</Text>
        <View style={styles.courseMeta}>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.level}>{item.level}</Text>
          <Text style={styles.enrollmentCount}>
            {item.enrollmentCount || 0} students
          </Text>
          <Text style={styles.rating}>
            ⭐ {item.averageRating?.toFixed(1) || '0.0'} ({item.ratingCount || 0})
          </Text>
        </View>
        
        {/* Launch status */}
        {item.isLaunched && (
          <View style={styles.launchedBadge}>
            <Text style={styles.launchedText}>LAUNCHED</Text>
          </View>
        )}
      </View>
      
      <View style={styles.courseActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditModal(item)}
        >
          <Edit size={16} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, item.isLaunched && styles.disabledButton]}
          onPress={() => handleLaunchCourse(item)}
          disabled={item.isLaunched}
        >
          <Rocket size={16} color={item.isLaunched ? "#CCC" : "#007AFF"} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteCourse(item)}
        >
          <Trash2 size={16} color="#DC3545" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.createModal}>
          <Text style={styles.modalTitle}>Create New Course</Text>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Basic Information */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <TextInput
                style={styles.input}
                placeholder="Course Title"
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                multiline
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Short Description"
                value={formData.shortDescription}
                onChangeText={(text) => setFormData(prev => ({ ...prev, shortDescription: text }))}
                multiline
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Full Description"
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Course Details */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Course Details</Text>
              
              {/* Category Selection */}
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        formData.category === category && styles.selectedCategory,
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, category }))}
                    >
                      <Text style={styles.categoryText}>{category}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Level Selection */}
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Level</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {levels.map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.categoryOption,
                        formData.level === level && styles.selectedCategory,
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, level: level as any }))}
                    >
                      <Text style={styles.categoryText}>{level}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Pricing */}
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Price ($)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={formData.price.toString()}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, price: parseInt(text, 10) || 0 }))}
                  keyboardType="numeric"
                />
                <View style={styles.switchContainer}>
                  <Text style={styles.label}>Free Course</Text>
                  <Switch
                    value={formData.isFree}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, isFree: value }))}
                  />
                </View>
              </View>

              {/* Duration */}
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Duration (minutes)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={formData.duration.toString()}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, duration: parseInt(text, 10) || 0 }))}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 2 hours 30 minutes"
                  value={formData.durationText}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, durationText: text }))}
                />
              </View>

              {/* Lessons Count */}
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Number of Lessons</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={formData.lessonsCount.toString()}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, lessonsCount: parseInt(text, 10) || 0 }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Target Audience */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Target Audience</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Who is this course for?"
                value={formData.targetAudience.join(', ')}
                onChangeText={(text) => setFormData(prev => ({ ...prev, targetAudience: text.split(', ').filter(Boolean) }))}
                multiline
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => {
                setShowCreateModal(false);
                setShowPricingModal(true);
              }}
            >
              <Text style={styles.createButtonText}>Set Pricing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderPricingModal = () => (
    <Modal
      visible={showPricingModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pricingModal}>
          <Text style={styles.modalTitle}>Course Pricing Options</Text>
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Monthly Access</Text>
            <TextInput
              style={styles.input}
              placeholder="Price in cents"
              value={pricingOptions.monthly.toString()}
              onChangeText={(text) => setPricingOptions(prev => ({ ...prev, monthly: parseInt(text, 10) || 0 }))}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Yearly Access</Text>
            <TextInput
              style={styles.input}
              placeholder="Price in cents"
              value={pricingOptions.yearly.toString()}
              onChangeText={(text) => setPricingOptions(prev => ({ ...prev, yearly: parseInt(text, 10) || 0 }))}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Lifetime Access</Text>
            <TextInput
              style={styles.input}
              placeholder="Price in cents"
              value={pricingOptions.lifetime.toString()}
              onChangeText={(text) => setPricingOptions(prev => ({ ...prev, lifetime: parseInt(text, 10) || 0 }))}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPricingModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => {
                if (selectedCourse) {
                  handleUpdateCourse();
                } else {
                  handleCreateCourse();
                }
              }}
            >
              <Text style={styles.createButtonText}>
                {selectedCourse ? 'Update Course' : 'Create Course'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const filteredCourses = filterCourses();

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Course Management</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            resetForm();
            setShowCreateModal(true);
          }}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['draft', 'published', 'archived'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          renderItem={renderCourseCard}
          keyExtractor={(item) => item.id}
          numColumns={1}
          contentContainerStyle={styles.coursesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BookOpen size={48} color="#CCC" />
              <Text style={styles.emptyText}>No courses found</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Modals */}
      {renderCreateModal()}
      {renderPricingModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  coursesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  courseInfo: {
    padding: 12,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
  },
  courseStatus: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  courseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  category: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  level: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  enrollmentCount: {
    fontSize: 12,
    color: '#666',
  },
  rating: {
    fontSize: 12,
    color: '#666',
  },
  launchedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  launchedText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  courseActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  loader: {
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxHeight: '90%',
    width: '90%',
  },
  pricingModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxHeight: '90%',
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 16,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  categoryOption: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButton: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customDurationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
  },
  customPriceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
  },
  removeCustomButton: {
    marginLeft: 8,
  },
  addCustomButton: {
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  createButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CourseManagementScreen;
