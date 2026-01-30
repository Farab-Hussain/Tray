import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { COLORS } from '../../../constants/core/colors';
import { studentProfileStyles } from '../../../constants/styles/studentProfileStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import {
  GraduationCap,
  Plus,
  X,
  Calendar,
  BookOpen,
} from 'lucide-react-native';

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

const EducationScreen = ({ navigation }: any) => {
  const [educationList, setEducationList] = useState<Education[]>([]);
  const [newEducation, setNewEducation] = useState({
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    gpa: '',
  });
  const [loading, setLoading] = useState(false);

  const addEducation = () => {
    if (!newEducation.institution.trim() || !newEducation.degree.trim()) {
      Alert.alert('Validation Error', 'Please fill in at least institution and degree');
      return;
    }

    const education: Education = {
      id: Date.now().toString(),
      ...newEducation,
    };

    setEducationList(prev => [...prev, education]);
    setNewEducation({
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: '',
    });
  };

  const removeEducation = (id: string) => {
    setEducationList(prev => prev.filter(edu => edu.id !== id));
  };

  const handleSave = async () => {
    // Validation checks
    const errors: string[] = [];
    
    if (educationList.length === 0) {
      errors.push('Please add at least one education entry or remove this section');
    }
    
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n\n'));
      return;
    }

    setLoading(true);
    
    try {
      // TODO: Save to backend
      Alert.alert('Success', 'Education information saved successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save education information');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes? Any unsaved information will be lost.',
      [
        {
          text: 'Keep Editing',
          style: 'cancel',
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={studentProfileStyles.container}>
      <ScreenHeader 
        title="Education" 
        onBackPress={() => navigation.goBack()} 
      />
      
      <ScrollView style={studentProfileStyles.scrollView}>
        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Education History</Text>
          
          <View style={studentProfileStyles.sectionContent}>
            {educationList.map((education, index) => (
              <View key={education.id} style={studentProfileStyles.quickInfo}>
                <GraduationCap size={16} color={COLORS.blue} />
                <View style={{ flex: 1 }}>
                  <Text style={studentProfileStyles.quickInfoText}>
                    {education.degree} in {education.field}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.gray, marginTop: 2 }}>
                    {education.institution}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.gray, marginTop: 2 }}>
                    {education.startDate} - {education.endDate}
                  </Text>
                  {education.gpa && (
                    <Text style={{ fontSize: 12, color: COLORS.gray, marginTop: 2 }}>
                      GPA: {education.gpa}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => removeEducation(education.id)}>
                  <X size={16} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            ))}
            
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TextInput
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLORS.lightGray,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16
                }}
                placeholder="Institution"
                value={newEducation.institution}
                onChangeText={(value) => setNewEducation(prev => ({ ...prev, institution: value }))}
              />
              <TextInput
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLORS.lightGray,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16
                }}
                placeholder="Degree"
                value={newEducation.degree}
                onChangeText={(value) => setNewEducation(prev => ({ ...prev, degree: value }))}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TextInput
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLORS.lightGray,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16
                }}
                placeholder="Field of Study"
                value={newEducation.field}
                onChangeText={(value) => setNewEducation(prev => ({ ...prev, field: value }))}
              />
              <TextInput
                style={{
                  width: 80,
                  borderWidth: 1,
                  borderColor: COLORS.lightGray,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16
                }}
                placeholder="GPA"
                value={newEducation.gpa}
                onChangeText={(value) => setNewEducation(prev => ({ ...prev, gpa: value }))}
              />
            </View>
            
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TextInput
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLORS.lightGray,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16
                }}
                placeholder="Start Date (MM/YYYY)"
                value={newEducation.startDate}
                onChangeText={(value) => setNewEducation(prev => ({ ...prev, startDate: value }))}
              />
              <TextInput
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLORS.lightGray,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16
                }}
                placeholder="End Date (MM/YYYY)"
                value={newEducation.endDate}
                onChangeText={(value) => setNewEducation(prev => ({ ...prev, endDate: value }))}
              />
            </View>
            
            <TouchableOpacity
              style={{
                padding: 12,
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: COLORS.lightGray,
                marginTop: 10,
                flexDirection: 'row',
                gap: 8
              }}
              onPress={addEducation}
            >
              <Plus size={16} color={COLORS.black} />
              <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: '600' }}>
                Add Education
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{
          flexDirection: 'row',
          gap: 12,
          margin: 20,
        }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: COLORS.lightGray,
              padding: 16,
              borderRadius: 12,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8
            }}
            onPress={handleCancel}
          >
            <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: '600' }}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: COLORS.blue,
              padding: 16,
              borderRadius: 12,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8
            }}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '600' }}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EducationScreen;
