import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Plus, Eye, Pencil, Trash2, Send } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';
import { Course, courseService } from '../../../services/course.service';

const formatPrice = (course: Course) => {
  if (course.isFree || course.price === 0) return 'Free';
  return `${course.currency || 'USD'} ${course.price}`;
};

export default function CourseManagementHomeScreen() {
  const navigation = useNavigation<any>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string>('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editLevel, setEditLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [editLanguage, setEditLanguage] = useState('en');
  const [editIsFree, setEditIsFree] = useState(false);
  const [editPrice, setEditPrice] = useState('');
  const [editDurationMinutes, setEditDurationMinutes] = useState('');
  const [editTimeCommitment, setEditTimeCommitment] = useState('');
  const [editObjectivesText, setEditObjectivesText] = useState('');
  const [editPrerequisitesText, setEditPrerequisitesText] = useState('');
  const [editTargetAudienceText, setEditTargetAudienceText] = useState('');
  const [editCertificateAvailable, setEditCertificateAvailable] = useState(false);

  const loadCourses = useCallback(async () => {
    try {
      const response = await courseService.getMyCourses();
      setCourses(response?.courses || []);
    } catch (error) {
      console.log('Course list load issue:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadCourses();
    }, [loadCourses]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
    setRefreshing(false);
  };

  const openEditModal = (course: Course) => {
    const joinList = (value?: string[]) => (value && value.length > 0 ? value.join('\n') : '');
    setEditingCourseId(course.id);
    setEditTitle(course.title || '');
    setEditDescription(course.description || '');
    setEditCategory(course.category || '');
    setEditLevel((course.level || 'beginner') as 'beginner' | 'intermediate' | 'advanced');
    setEditLanguage(course.language || 'en');
    setEditIsFree(!!course.isFree);
    setEditPrice(String(course.price ?? 0));
    setEditDurationMinutes(String(course.duration ?? 0));
    setEditTimeCommitment(course.timeCommitment || '');
    setEditObjectivesText(joinList(course.objectives));
    setEditPrerequisitesText(joinList(course.prerequisites));
    setEditTargetAudienceText(joinList(course.targetAudience));
    setEditCertificateAvailable(!!course.certificateAvailable);
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCourseId) return;
    if (!editTitle.trim() || !editDescription.trim() || !editCategory.trim()) {
      Alert.alert('Validation Error', 'Title, description, and category are required.');
      return;
    }

    if (!editIsFree) {
      const numericPrice = Number(editPrice);
      if (Number.isNaN(numericPrice) || numericPrice < 0) {
        Alert.alert('Validation Error', 'Price must be a valid number.');
        return;
      }
    }

    const numericDuration = Number(editDurationMinutes);
    if (Number.isNaN(numericDuration) || numericDuration <= 0) {
      Alert.alert('Validation Error', 'Duration must be a valid number greater than 0.');
      return;
    }

    const parseList = (text: string): string[] =>
      text
        .split(/\n|,/)
        .map(item => item.trim())
        .filter(Boolean);

    const parsedObjectives = parseList(editObjectivesText);
    if (parsedObjectives.length === 0) {
      Alert.alert('Validation Error', 'At least one learning objective is required.');
      return;
    }

    try {
      setIsSavingEdit(true);
      await courseService.updateCourse(editingCourseId, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        shortDescription: editDescription.trim().slice(0, 150),
        category: editCategory.trim(),
        level: editLevel,
        language: editLanguage.trim() || 'en',
        isFree: editIsFree,
        price: editIsFree ? 0 : Number(editPrice),
        duration: numericDuration,
        durationText: `${numericDuration} minutes`,
        objectives: parsedObjectives,
        prerequisites: parseList(editPrerequisitesText),
        targetAudience: parseList(editTargetAudienceText),
        timeCommitment: editTimeCommitment.trim() || 'Self-paced',
        certificateAvailable: editCertificateAvailable,
      });

      setIsEditModalVisible(false);
      await loadCourses();
      Alert.alert('Success', 'Course updated successfully.');
    } catch (error: any) {
      Alert.alert('Update Failed', error?.message || 'Unable to update course.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteCourse = (course: Course) => {
    Alert.alert(
      'Delete Course',
      `Delete "${course.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await courseService.deleteCourse(course.id);
              await loadCourses();
              Alert.alert('Deleted', 'Course deleted successfully.');
            } catch (error: any) {
              Alert.alert('Delete Failed', error?.message || 'Unable to delete course.');
            }
          },
        },
      ],
    );
  };

  const handleSubmitForApproval = async (course: Course) => {
    try {
      await courseService.submitForApproval(course.id);
      await loadCourses();
      Alert.alert('Submitted', course.rejectionReason ? 'Course re-submitted for approval.' : 'Course sent for approval.');
    } catch (error: any) {
      Alert.alert('Submit Failed', error?.message || 'Unable to submit course.');
    }
  };

  const renderCourseCard = ({ item }: { item: Course }) => (
    <View
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E7EBF0',
      }}
    >
      {!!item.thumbnailUrl && (
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={{ width: '100%', height: 140, borderRadius: 10, marginBottom: 10 }}
          resizeMode="cover"
        />
      )}

      <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.black }}>{item.title}</Text>
      <Text style={{ marginTop: 4, color: COLORS.gray }}>{item.shortDescription || item.description}</Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        <Text style={{ color: COLORS.black, fontWeight: '600', textTransform: 'capitalize' }}>
          {item.level}
        </Text>
        <Text style={{ color: COLORS.green, fontWeight: '700' }}>{formatPrice(item)}</Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Text style={{ color: COLORS.gray }}>{item.category}</Text>
        <Text style={{ color: COLORS.gray, textTransform: 'capitalize' }}>{item.status}</Text>
      </View>

      {!!item.rejectionReason && (
        <View
          style={{
            marginTop: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#F5C2C7',
            backgroundColor: '#FFF5F5',
            padding: 10,
          }}
        >
          <Text style={{ color: '#B42318', fontSize: 12, fontWeight: '700' }}>Rejected Feedback</Text>
          <Text style={{ color: '#B42318', fontSize: 12, marginTop: 4 }}>{item.rejectionReason}</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 9,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#D9DEE5',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => navigation.navigate('CourseDetails', { courseId: item.id })}
        >
          <Eye size={16} color={COLORS.black} />
          <Text style={{ marginLeft: 6, color: COLORS.black, fontWeight: '600' }}>Preview</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 9,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#D9DEE5',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => navigation.navigate('CourseCreation', { mode: 'edit', courseId: item.id })}
        >
          <Pencil size={16} color={COLORS.black} />
          <Text style={{ marginLeft: 6, color: COLORS.black, fontWeight: '600' }}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 9,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#F3C3C3',
            backgroundColor: '#FFF5F5',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => handleDeleteCourse(item)}
        >
          <Trash2 size={16} color={'#DC2626'} />
          <Text style={{ marginLeft: 6, color: '#DC2626', fontWeight: '600' }}>Delete</Text>
        </TouchableOpacity>
      </View>

      {item.status === 'draft' && (
        <TouchableOpacity
          style={{
            marginTop: 10,
            backgroundColor: '#E8F7EC',
            borderRadius: 8,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => handleSubmitForApproval(item)}
        >
          <Send size={16} color={COLORS.green} />
          <Text style={{ marginLeft: 6, color: COLORS.green, fontWeight: '700' }}>
            {item.rejectionReason ? 'Resubmit For Approval' : 'Submit For Approval'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F8FB' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.black }}>Courses</Text>
        <Text style={{ marginTop: 4, color: COLORS.gray }}>Create and manage your courses</Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.green,
            borderRadius: 12,
            paddingVertical: 14,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => navigation.navigate('CourseCreation')}
        >
          <Plus size={18} color={COLORS.white} />
          <Text style={{ marginLeft: 8, color: COLORS.white, fontSize: 16, fontWeight: '700' }}>
            Create Course
          </Text>
        </TouchableOpacity>
        <Text style={{ marginTop: 8, color: COLORS.gray, fontSize: 12 }}>
          Students can see only courses with status "published".
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.green} />
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          renderItem={renderCourseCard}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View
              style={{
                marginTop: 40,
                padding: 20,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E7EBF0',
                backgroundColor: COLORS.white,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>No courses yet</Text>
              <Text style={{ marginTop: 6, color: COLORS.gray }}>
                Tap "Create Course" to publish your first course.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.35)',
            justifyContent: 'center',
            paddingHorizontal: 18,
          }}
        >
          <View style={{ backgroundColor: COLORS.white, borderRadius: 12, padding: 16, maxHeight: '88%' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 12 }}>
              Edit Course
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              <TextInput
                placeholder="Title"
                value={editTitle}
                onChangeText={setEditTitle}
                style={{
                  borderWidth: 1,
                  borderColor: '#D9DEE5',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 10,
                  color: COLORS.black,
                }}
              />

              <TextInput
                placeholder="Description"
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                style={{
                  borderWidth: 1,
                  borderColor: '#D9DEE5',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  minHeight: 90,
                  marginBottom: 10,
                  color: COLORS.black,
                  textAlignVertical: 'top',
                }}
              />

              <TextInput
                placeholder="Category"
                value={editCategory}
                onChangeText={setEditCategory}
                style={{
                  borderWidth: 1,
                  borderColor: '#D9DEE5',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 10,
                  color: COLORS.black,
                }}
              />

              <TextInput
                placeholder="Language (e.g. en)"
                value={editLanguage}
                onChangeText={setEditLanguage}
                style={{
                  borderWidth: 1,
                  borderColor: '#D9DEE5',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 10,
                  color: COLORS.black,
                }}
              />

              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setEditLevel(level)}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: editLevel === level ? COLORS.green : '#D9DEE5',
                      backgroundColor: editLevel === level ? '#E8F7EC' : COLORS.white,
                      borderRadius: 8,
                      paddingVertical: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: COLORS.black, textTransform: 'capitalize' }}>{level}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: COLORS.black, fontWeight: '600' }}>Free Course</Text>
                <Switch value={editIsFree} onValueChange={setEditIsFree} />
              </View>

              {!editIsFree && (
                <TextInput
                  placeholder="Price"
                  value={editPrice}
                  onChangeText={setEditPrice}
                  keyboardType="numeric"
                  style={{
                    borderWidth: 1,
                    borderColor: '#D9DEE5',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    marginBottom: 10,
                    color: COLORS.black,
                  }}
                />
              )}

              <TextInput
                placeholder="Total Duration (minutes)"
                value={editDurationMinutes}
                onChangeText={setEditDurationMinutes}
                keyboardType="numeric"
                style={{
                  borderWidth: 1,
                  borderColor: '#D9DEE5',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 10,
                  color: COLORS.black,
                }}
              />

              <TextInput
                placeholder="Learning Objectives (comma or new line separated)"
                value={editObjectivesText}
                onChangeText={setEditObjectivesText}
                multiline
                style={{
                  borderWidth: 1,
                  borderColor: '#D9DEE5',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  minHeight: 80,
                  marginBottom: 10,
                  color: COLORS.black,
                  textAlignVertical: 'top',
                }}
              />

              <TextInput
                placeholder="Prerequisites (optional)"
                value={editPrerequisitesText}
                onChangeText={setEditPrerequisitesText}
                multiline
                style={{
                  borderWidth: 1,
                  borderColor: '#D9DEE5',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  minHeight: 70,
                  marginBottom: 10,
                  color: COLORS.black,
                  textAlignVertical: 'top',
                }}
              />

              <TextInput
                placeholder="Target Audience (optional)"
                value={editTargetAudienceText}
                onChangeText={setEditTargetAudienceText}
                multiline
                style={{
                  borderWidth: 1,
                  borderColor: '#D9DEE5',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  minHeight: 70,
                  marginBottom: 10,
                  color: COLORS.black,
                  textAlignVertical: 'top',
                }}
              />

              <TextInput
                placeholder="Time Commitment (optional)"
                value={editTimeCommitment}
                onChangeText={setEditTimeCommitment}
                style={{
                  borderWidth: 1,
                  borderColor: '#D9DEE5',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 10,
                  color: COLORS.black,
                }}
              />

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: COLORS.black, fontWeight: '600' }}>Certificate Available</Text>
                <Switch value={editCertificateAvailable} onValueChange={setEditCertificateAvailable} />
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#D9DEE5',
                  borderRadius: 8,
                  paddingVertical: 11,
                  alignItems: 'center',
                }}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={{ color: COLORS.black, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: COLORS.green,
                  borderRadius: 8,
                  paddingVertical: 11,
                  alignItems: 'center',
                }}
                onPress={handleSaveEdit}
                disabled={isSavingEdit}
              >
                {isSavingEdit ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={{ color: COLORS.white, fontWeight: '700' }}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
