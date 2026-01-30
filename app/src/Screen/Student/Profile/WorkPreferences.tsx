import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { ResumeService } from '../../../services/resume.service';
import { COLORS } from '../../../constants/core/colors';
import { studentProfileStyles } from '../../../constants/styles/studentProfileStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import {
  Save,
  Plus,
  X,
  Car,
  AlertCircle,
  Briefcase,
} from 'lucide-react-native';

const WorkPreferences = ({ navigation }: any) => {
  const { } = useAuth();
  const [_loading, _setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [workPreferences, setWorkPreferences] = useState({
    workRestrictions: [] as string[],
    transportationStatus: '' as 'own-car' | 'public-transport' | 'none',
    shiftFlexibility: {
      days: [] as string[],
      shifts: [] as string[]
    },
    preferredWorkTypes: [] as string[],
    jobsToAvoid: [] as string[]
  });

  const [newRestriction, setNewRestriction] = useState('');
  const [newJobToAvoid, setNewJobToAvoid] = useState('');

  const transportationOptions = [
    { value: 'own-car', label: 'Own Car' },
    { value: 'public-transport', label: 'Public Transport' },
    { value: 'none', label: 'None' }
  ];

  const workTypeOptions = [
    'full-time',
    'part-time', 
    'contract',
    'internship'
  ];

  const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const shiftOptions = ['morning', 'evening', 'night'];

  useEffect(() => {
    loadWorkPreferences();
  }, []);

  const loadWorkPreferences = async () => {
    _setLoading(false);
  };

  const handleSave = async () => {
    // Validation checks
    const errors: string[] = [];
    
    if (workPreferences.workRestrictions.length === 0) {
      errors.push('Please add at least one work restriction or remove this section');
    }
    
    if (!workPreferences.transportationStatus) {
      errors.push('Please select your transportation method');
    }
    
    if (workPreferences.preferredWorkTypes.length === 0) {
      errors.push('Please select at least one preferred work type');
    }
    
    if (workPreferences.shiftFlexibility.days.length === 0 || workPreferences.shiftFlexibility.shifts.length === 0) {
      errors.push('Please select at least one available day and one preferred shift');
    }
    
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n\n'));
      return;
    }

    try {
      setSaving(true);
      await ResumeService.updateWorkPreferences(workPreferences);
      Alert.alert('Success', 'Work preferences updated successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update work preferences');
    } finally {
      setSaving(false);
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

  const addWorkRestriction = () => {
    if (newRestriction.trim()) {
      setWorkPreferences(prev => ({
        ...prev,
        workRestrictions: [...prev.workRestrictions, newRestriction.trim()]
      }));
      setNewRestriction('');
    }
  };

  const removeWorkRestriction = (index: number) => {
    setWorkPreferences(prev => ({
      ...prev,
      workRestrictions: prev.workRestrictions.filter((_, i) => i !== index)
    }));
  };

  const addJobToAvoid = () => {
    if (newJobToAvoid.trim()) {
      setWorkPreferences(prev => ({
        ...prev,
        jobsToAvoid: [...prev.jobsToAvoid, newJobToAvoid.trim()]
      }));
      setNewJobToAvoid('');
    }
  };

  const removeJobToAvoid = (index: number) => {
    setWorkPreferences(prev => ({
      ...prev,
      jobsToAvoid: prev.jobsToAvoid.filter((_, i) => i !== index)
    }));
  };

  const toggleDay = (day: string) => {
    setWorkPreferences(prev => ({
      ...prev,
      shiftFlexibility: {
        ...prev.shiftFlexibility,
        days: prev.shiftFlexibility.days.includes(day)
          ? prev.shiftFlexibility.days.filter(d => d !== day)
          : [...prev.shiftFlexibility.days, day]
      }
    }));
  };

  const toggleShift = (shift: string) => {
    setWorkPreferences(prev => ({
      ...prev,
      shiftFlexibility: {
        ...prev.shiftFlexibility,
        shifts: prev.shiftFlexibility.shifts.includes(shift)
          ? prev.shiftFlexibility.shifts.filter(s => s !== shift)
          : [...prev.shiftFlexibility.shifts, shift]
      }
    }));
  };

  const toggleWorkType = (type: string) => {
    setWorkPreferences(prev => ({
      ...prev,
      preferredWorkTypes: prev.preferredWorkTypes.includes(type)
        ? prev.preferredWorkTypes.filter(t => t !== type)
        : [...prev.preferredWorkTypes, type]
    }));
  };

  return (
    <SafeAreaView style={studentProfileStyles.container}>
      <ScreenHeader 
        title="Work Preferences" 
        onBackPress={() => navigation.goBack()} 
      />
      
      <ScrollView style={studentProfileStyles.scrollView}>
        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Work Restrictions</Text>
          
          <View style={studentProfileStyles.sectionContent}>
            {workPreferences.workRestrictions.map((restriction, index) => (
              <View key={index} style={studentProfileStyles.quickInfo}>
                <AlertCircle size={16} color={COLORS.orange} />
                <Text style={studentProfileStyles.quickInfoText}>{restriction}</Text>
                <TouchableOpacity onPress={() => removeWorkRestriction(index)}>
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
                placeholder="Add work restriction"
                value={newRestriction}
                onChangeText={setNewRestriction}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.green,
                  padding: 12,
                  borderRadius: 8,
                  justifyContent: 'center'
                }}
                onPress={addWorkRestriction}
              >
                <Plus size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Transportation</Text>
          
          <View style={studentProfileStyles.sectionContent}>
            {transportationOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderWidth: 1,
                  borderColor: workPreferences.transportationStatus === option.value ? COLORS.green : COLORS.lightGray,
                  borderRadius: 8,
                  marginBottom: 8
                }}
                onPress={() => setWorkPreferences(prev => ({ ...prev, transportationStatus: option.value as any }))}
              >
                <Car size={20} color={workPreferences.transportationStatus === option.value ? COLORS.green : COLORS.gray} />
                <Text style={{ marginLeft: 12, fontSize: 16, color: COLORS.black }}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Preferred Work Types</Text>
          
          <View style={studentProfileStyles.sectionContent}>
            {workTypeOptions.map(type => (
              <TouchableOpacity
                key={type}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderWidth: 1,
                  borderColor: workPreferences.preferredWorkTypes.includes(type) ? COLORS.green : COLORS.lightGray,
                  borderRadius: 8,
                  marginBottom: 8
                }}
                onPress={() => toggleWorkType(type)}
              >
                <Briefcase size={20} color={workPreferences.preferredWorkTypes.includes(type) ? COLORS.green : COLORS.gray} />
                <Text style={{ marginLeft: 12, fontSize: 16, textTransform: 'capitalize', color: COLORS.black }}>{type}</Text>
                <Text style={{ marginLeft: 12, fontSize: 16, textTransform: 'capitalize' }}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Shift Flexibility</Text>
          
          <View style={studentProfileStyles.sectionContent}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10 }}>Available Days:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {dayOptions.map(day => (
                <TouchableOpacity
                  key={day}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: workPreferences.shiftFlexibility.days.includes(day) ? COLORS.green : COLORS.lightGray,
                    borderRadius: 20,
                    backgroundColor: workPreferences.shiftFlexibility.days.includes(day) ? COLORS.green : COLORS.white
                  }}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={{ 
                    color: workPreferences.shiftFlexibility.days.includes(day) ? COLORS.white : COLORS.black,
                    fontSize: 14
                  }}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10 }}>Available Shifts:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {shiftOptions.map(shift => (
                <TouchableOpacity
                  key={shift}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: workPreferences.shiftFlexibility.shifts.includes(shift) ? COLORS.green : COLORS.lightGray,
                    borderRadius: 20,
                    backgroundColor: workPreferences.shiftFlexibility.shifts.includes(shift) ? COLORS.green : COLORS.white
                  }}
                  onPress={() => toggleShift(shift)}
                >
                  <Text style={{ 
                    color: workPreferences.shiftFlexibility.shifts.includes(shift) ? COLORS.white : COLORS.black,
                    fontSize: 14,
                    textTransform: 'capitalize'
                  }}>{shift}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Jobs to Avoid</Text>
          
          <View style={studentProfileStyles.sectionContent}>
            {workPreferences.jobsToAvoid.map((job, index) => (
              <View key={index} style={studentProfileStyles.quickInfo}>
                <X size={16} color={COLORS.red} />
                <Text style={studentProfileStyles.quickInfoText}>{job}</Text>
                <TouchableOpacity onPress={() => removeJobToAvoid(index)}>
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
                placeholder="Add job to avoid"
                value={newJobToAvoid}
                onChangeText={setNewJobToAvoid}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.red,
                  padding: 12,
                  borderRadius: 8,
                  justifyContent: 'center'
                }}
                onPress={addJobToAvoid}
              >
                <Plus size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
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
              backgroundColor: COLORS.green,
              padding: 16,
              borderRadius: 12,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8
            }}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '600' }}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WorkPreferences;
