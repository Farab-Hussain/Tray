import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, BookOpen, Users, Clock, Star, DollarSign } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';
import { courseService, Course } from '../../../services/course.service';
import { logger } from '../../../utils/logger';

export default function CourseLibraryScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

  const categories = ['all', 'Technology', 'Business', 'Design', 'Marketing', 'Photography', 'Music', 'Health & Fitness', 'Personal Development'];
  const levels = ['all', 'beginner', 'intermediate', 'advanced'];

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchQuery, selectedCategory, selectedLevel]);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const result = await courseService.searchCourses({
        page: 1,
        limit: 20,
      });
      setCourses(result.courses);
    } catch (error) {
      logger.error('Error loading courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
    setRefreshing(false);
  };

  const filterCourses = () => {
    let filtered = courses;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    // Level filter
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(course => course.level === selectedLevel);
    }

    setFilteredCourses(filtered);
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

  const renderCourseCard = (course: Course) => (
    <TouchableOpacity
      key={course.id}
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {/* Course Thumbnail */}
      <View style={{
        height: 120,
        backgroundColor: COLORS.lightGray,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {course.thumbnailUrl ? (
          <Image
            source={{ uri: course.thumbnailUrl }}
            style={{
              width: '100%',
              height: '100%',
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            }}
            resizeMode="cover"
          />
        ) : (
          <BookOpen size={32} color={COLORS.gray} />
        )}
        
        {/* Status Badge */}
        <View style={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: course.status === 'published' ? COLORS.green : COLORS.orange,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 4,
        }}>
          <Text style={{
            fontSize: 10,
            color: COLORS.white,
            fontWeight: '500',
            textTransform: 'uppercase',
          }}>
            {course.status}
          </Text>
        </View>
      </View>

      {/* Course Info */}
      <View style={{ padding: 16 }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: COLORS.black,
          marginBottom: 8,
        }}
        numberOfLines={2}>
          {course.title}
        </Text>

        <Text style={{
          fontSize: 14,
          color: COLORS.gray,
          marginBottom: 12,
        }}
        numberOfLines={2}
        >
          {course.description}
        </Text>

        {/* Course Stats */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Users size={14} color={COLORS.gray} />
            <Text style={{
              fontSize: 12,
              color: COLORS.gray,
              marginLeft: 4,
            }}>
              {course.enrollmentCount} students
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Clock size={14} color={COLORS.gray} />
            <Text style={{
              fontSize: 12,
              color: COLORS.gray,
              marginLeft: 4,
            }}>
              {formatDuration(0)}
            </Text>
          </View>

          {course.rating && course.rating > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Star size={14} color={COLORS.orange} fill={COLORS.orange} />
              <Text style={{
                fontSize: 12,
                color: COLORS.gray,
                marginLeft: 4,
              }}>
                {course.rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Price and Level */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <DollarSign size={16} color={COLORS.green} />
            <Text style={{
              fontSize: 16,
              fontWeight: '700',
              color: COLORS.green,
              marginLeft: 2,
            }}>
              {course.price === 0 ? 'Free' : formatCurrency(course.price)}
            </Text>
          </View>

          <View style={{
            backgroundColor: COLORS.blue + '20',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
          }}>
            <Text style={{
              fontSize: 12,
              color: COLORS.blue,
              fontWeight: '500',
              textTransform: 'capitalize',
            }}>
              {course.level}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.green} />
        <Text style={{ marginTop: 16, color: COLORS.gray }}>Loading courses...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View style={{
        backgroundColor: COLORS.white,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
      }}>
        <Text style={{
          fontSize: 24,
          fontWeight: '700',
          color: COLORS.black,
        }}>
          Course Library
        </Text>
        <Text style={{
          fontSize: 14,
          color: COLORS.gray,
          marginTop: 4,
        }}>
          Discover and enroll in courses
        </Text>
      </View>

      {/* Search Bar */}
      <View style={{
        backgroundColor: COLORS.white,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: COLORS.lightGray,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}>
          <Search size={20} color={COLORS.gray} />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 16,
              color: COLORS.black,
            }}
            placeholder="Search courses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filters */}
      <View style={{
        backgroundColor: COLORS.white,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
      }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* Category Filter */}
            <ScrollView horizontal style={{ marginRight: 16 }}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: selectedCategory === category ? COLORS.green : COLORS.lightGray,
                    marginRight: 8,
                  }}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: selectedCategory === category ? COLORS.white : COLORS.black,
                  }}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Level Filter */}
            <ScrollView horizontal>
              {levels.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: selectedLevel === level ? COLORS.blue : COLORS.lightGray,
                    marginRight: 8,
                  }}
                  onPress={() => setSelectedLevel(level)}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: selectedLevel === level ? COLORS.white : COLORS.black,
                    textTransform: 'capitalize',
                  }}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      {/* Courses List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredCourses.length > 0 ? (
          filteredCourses.map(renderCourseCard)
        ) : (
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 60,
          }}>
            <BookOpen size={48} color={COLORS.gray} />
            <Text style={{
              fontSize: 16,
              color: COLORS.gray,
              marginTop: 16,
              textAlign: 'center',
            }}>
              {searchQuery || selectedCategory !== 'all' || selectedLevel !== 'all'
                ? 'No courses found matching your filters.'
                : 'No courses available yet.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
