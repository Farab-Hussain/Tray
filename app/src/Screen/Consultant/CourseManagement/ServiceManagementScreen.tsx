// src/Screen/Consultant/CourseManagement/ServiceManagementScreen.tsx
// Comprehensive Service Management Interface for Consultants

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
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  BookOpen
} from 'lucide-react-native';
import { courseService, Course, CourseInput } from '../../../services/course.service';
import { logger } from '../../../utils/logger';

type ServiceManagementNavigationProp = StackNavigationProp<any, 'ServiceManagement'>;

interface Props {
  navigation: ServiceManagementNavigationProp;
  route: any;
}

export const ServiceManagementScreen: React.FC<Props> = ({ navigation: _navigation, route: _route }) => {
  const insets = useSafeAreaInsets();
  const [services, setServices] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [_showScheduleModal, _setShowScheduleModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<'draft' | 'published' | 'archived'>('draft');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    shortDescription: string;
    category: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    price: number;
    isFree: boolean;
    duration: number;
    durationText: string;
    lessonsCount: number;
    objectives: string[];
    prerequisites: string[];
    targetAudience: string[];
    difficultyScore: number;
    timeCommitment: string;
    certificateAvailable: boolean;
    tags: string[];
  }>({
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
    'Finance',
    'Education',
    'Creative Arts',
  ];

  const levels = ['beginner', 'intermediate', 'advanced'];

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await courseService.getMyCourses();
      setServices(response.courses || []);
    } catch (error) {
      logger.error('Error loading services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  };

  const handleCreateService = async () => {
    logger.debug('🚀 [ServiceManagement] Create service button clicked');
    try {
      // Validate form data
      if (!formData.title?.trim() || !formData.description?.trim()) {
        logger.debug('⚠️ [ServiceManagement] Validation failed: missing title or description');
        logger.debug('📝 [ServiceManagement] Title:', formData.title);
        logger.debug('📝 [ServiceManagement] Description:', formData.description);
        Alert.alert('Issue', 'Title and description are required');
        return;
      }

      logger.debug('📝 [ServiceManagement] Form data:', formData);
      logger.debug('💰 [ServiceManagement] Pricing options:', pricingOptions);

      const courseData: CourseInput = {
        ...formData,
        pricingOptions,
        language: 'English',
        currency: 'USD',
        slug: formData.title.toLowerCase().replace(/\s+/g, '-'),
      };

      logger.debug('📤 [ServiceManagement] Calling courseService.createService...');
      await courseService.createCourse(courseData);
      logger.debug('✅ [ServiceManagement] Service created successfully');
      Alert.alert('Success', 'Service created successfully!');
      setShowCreateModal(false);
      resetForm();
      await loadServices();
    } catch (error: any) {
      logger.debug('❌ [ServiceManagement] Service creation issue:', error);
      Alert.alert('Unable to create service', issue.message || 'Please try again');
    }
  };

  const handleUpdateService = async () => {
    if (!selectedService) return;

    try {
      const updateData = {
        ...formData,
        pricingOptions,
        language: 'English',
        currency: 'USD',
        slug: formData.title.toLowerCase().replace(/\s+/g, '-'),
      };

      await courseService.updateCourse(selectedService.id, updateData);
      Alert.alert('Success', 'Service updated successfully!');
      setShowCreateModal(false);
      resetForm();
      setSelectedService(null);
      await loadServices();
    } catch (error: any) {
      logger.debug('❌ [ServiceManagement] Service update issue:', error);
      Alert.alert('Unable to update service', issue.message || 'Please try again');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await courseService.deleteCourse(serviceId);
              Alert.alert('Success', 'Service deleted successfully');
              await loadServices();
            } catch (error: any) {
              logger.debug('❌ [ServiceManagement] Service deletion issue:', error);
              Alert.alert('Unable to delete service', issue.message || 'Please try again');
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
    setPricingOptions({
      monthly: 0,
      yearly: 0,
      lifetime: 0,
    });
    setSelectedService(null);
  };

  const openEditModal = (service: Course) => {
    setSelectedService(service);
    setFormData({
      title: service.title,
      description: service.description,
      shortDescription: service.shortDescription,
      category: service.category,
      level: service.level,
      price: service.price,
      isFree: service.isFree,
      duration: service.duration,
      durationText: service.durationText,
      lessonsCount: service.lessonsCount,
      objectives: service.objectives,
      prerequisites: service.prerequisites,
      targetAudience: service.targetAudience,
      difficultyScore: service.difficultyScore,
      timeCommitment: service.timeCommitment,
      certificateAvailable: service.certificateAvailable,
      tags: service.tags,
    });
    setPricingOptions({
      monthly: (service.pricingOptions?.monthly ?? 0) as number,
      yearly: (service.pricingOptions?.yearly ?? 0) as number,
      lifetime: (service.pricingOptions?.lifetime ?? 0) as number,
    });
    setShowCreateModal(true);
  };

  const filteredServices = services.filter((service: Course) => {
    const matchesTab = 
      (activeTab === 'draft' && service.status === 'draft') ||
      (activeTab === 'published' && service.status === 'published') ||
      (activeTab === 'archived' && service.status === 'archived');
    
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  const renderServiceCard = ({ item: service }: { item: Course }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceTitle}>{service.title}</Text>
          <Text style={styles.serviceCategory}>{service.category}</Text>
          <Text style={styles.serviceLevel}>{service.level}</Text>
        </View>
        <View style={styles.serviceActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => openEditModal(service)}
          >
            <Edit size={16} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteService(service.id)}
          >
            <Trash2 size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.serviceBody}>
        <Text style={styles.serviceDescription} numberOfLines={3}>
          {service.shortDescription || service.description}
        </Text>
        
        <View style={styles.serviceStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Students</Text>
            <Text style={styles.statValue}>{service.enrollmentCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Rating</Text>
            <Text style={styles.statValue}>{service.averageRating?.toFixed(1) || '0.0'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Price</Text>
            <Text style={styles.statValue}>
              {service.isFree ? 'Free' : `$${service.price}`}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.serviceFooter}>
        <Text style={styles.serviceStatus}>
          Status: {service.status}
        </Text>
        <Text style={styles.serviceDate}>
          Created: {new Date((service as any).createdAt?._seconds * 1000 || Date.now()).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Service Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search services..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
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
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText,
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredServices}
          renderItem={renderServiceCard}
          keyExtractor={(item, index) => item.id || `service-${index}`}
          numColumns={1}
          contentContainerStyle={styles.servicesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BookOpen size={48} color="#CCC" />
              <Text style={styles.emptyText}>No services found</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedService ? 'Edit Service' : 'Create New Service'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Service Title"
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

            {/* Category and Level */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category & Level</Text>
              
              <View style={styles.categoryContainer}>
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
              </View>

              <View style={styles.categoryContainer}>
                {levels.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.categoryOption,
                      formData.level === level && styles.selectedCategory,
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, level: level as 'beginner' | 'intermediate' | 'advanced' }))}
                  >
                    <Text style={styles.categoryText}>{level}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pricing */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pricing</Text>
              
              <View style={styles.pricingContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={formData.price.toString()}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, price: parseInt(text, 10) || 0 }))}
                  keyboardType="numeric"
                />
                <View style={styles.switchContainer}>
                  <Text style={styles.label}>Free Service</Text>
                  <Switch
                    value={formData.isFree}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, isFree: value }))}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.pricingButton}
                onPress={() => setShowPricingModal(true)}
              >
                <Text style={styles.pricingButtonText}>Advanced Pricing Options</Text>
              </TouchableOpacity>
            </View>

            {/* Duration */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Duration</Text>
              
              <View style={styles.durationContainer}>
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

              <View style={styles.durationContainer}>
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
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Target Audience</Text>
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Who is this service for?"
                value={formData.targetAudience.join(', ')}
                onChangeText={(text) => setFormData(prev => ({ ...prev, targetAudience: text.split(', ').filter(Boolean) }))}
                multiline
              />
            </View>
          </ScrollView>

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
                if (selectedService) {
                  handleUpdateService();
                } else {
                  handleCreateService();
                }
              }}
            >
              <Text style={styles.createButtonText}>
                {selectedService ? 'Update Service' : 'Create Service'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pricing Modal */}
      <Modal
        visible={showPricingModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Advanced Pricing Options</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPricingModal(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Monthly Subscription</Text>
              <TextInput
                style={styles.input}
                placeholder="Price in cents"
                value={pricingOptions.monthly.toString()}
                onChangeText={(text) => setPricingOptions(prev => ({ ...prev, monthly: parseInt(text, 10) || 0 }))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Yearly Subscription</Text>
              <TextInput
                style={styles.input}
                placeholder="Price in cents"
                value={pricingOptions.yearly.toString()}
                onChangeText={(text) => setPricingOptions(prev => ({ ...prev, yearly: parseInt(text, 10) || 0 }))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lifetime Access</Text>
              <TextInput
                style={styles.input}
                placeholder="Price in cents"
                value={pricingOptions.lifetime.toString()}
                onChangeText={(text) => setPricingOptions(prev => ({ ...prev, lifetime: parseInt(text, 10) || 0 }))}
                keyboardType="numeric"
              />
            </View>
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
              onPress={() => setShowPricingModal(false)}
            >
              <Text style={styles.createButtonText}>Save Pricing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  servicesList: {
    padding: 20,
  },
  serviceCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  serviceCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  serviceLevel: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  serviceActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  serviceBody: {
    marginBottom: 10,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  serviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  serviceStatus: {
    fontSize: 12,
    color: '#666',
  },
  serviceDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFF',
    marginBottom: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  categoryOption: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  pricingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  pricingButton: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pricingButtonText: {
    fontSize: 14,
    color: '#666',
  },
  durationContainer: {
    marginBottom: 15,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  createButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
});

export default ServiceManagementScreen;