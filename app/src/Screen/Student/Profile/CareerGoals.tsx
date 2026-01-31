import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ResumeService } from '../../../services/resume.service';
import { COLORS } from '../../../constants/core/colors';
import { studentProfileStyles } from '../../../constants/styles/studentProfileStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import {
  Target,
  DollarSign,
  Plus,
  X,
  Briefcase,
} from 'lucide-react-native';

const CareerGoals = ({ navigation }: any) => {
  const [careerGoals, setCareerGoals] = useState({
    careerInterests: [] as string[],
    targetIndustries: [] as string[],
    salaryExpectation: {
      min: '',
      max: ''
    }
  });

  const [newInterest, setNewInterest] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCareerGoals();
  }, []);

  const loadCareerGoals = async () => {
    try {
      const response = await ResumeService.getCareerGoals();
      if (response.goals) {
        const loadedGoals = {
          careerInterests: response.goals.careerInterests || [],
          targetIndustries: response.goals.targetIndustries || [],
          salaryExpectation: {
            min: response.goals.salaryExpectation?.min?.toString() || '',
            max: response.goals.salaryExpectation?.max?.toString() || ''
          }
        };
        
        if (__DEV__) {
          console.log('📥 [CareerGoals] Loaded career goals:', loadedGoals);
        }
        
        setCareerGoals(loadedGoals);
      }
    } catch (error: any) {
      // 404 is expected for new users - no career goals exist yet
      if (error?.response?.status === 404) {
        console.log('No existing career goals found, starting with defaults');
      } else {
        // Log other errors but don't crash the app
        if (__DEV__) {
          console.error('Error loading career goals:', error);
        }
      }
    }
  };

  const addCareerInterest = () => {
    if (newInterest.trim()) {
      setCareerGoals(prev => ({
        ...prev,
        careerInterests: [...prev.careerInterests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const removeCareerInterest = (index: number) => {
    setCareerGoals(prev => ({
      ...prev,
      careerInterests: prev.careerInterests.filter((_, i) => i !== index)
    }));
  };

  const addTargetIndustry = () => {
    if (newIndustry.trim()) {
      setCareerGoals(prev => ({
        ...prev,
        targetIndustries: [...prev.targetIndustries, newIndustry.trim()]
      }));
      setNewIndustry('');
    }
  };

  const removeTargetIndustry = (index: number) => {
    setCareerGoals(prev => ({
      ...prev,
      targetIndustries: prev.targetIndustries.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    // More lenient validation - allow partial saves
    const errors: string[] = [];
    
    // Only validate if user has entered some data
    const hasSomeData = 
      careerGoals.careerInterests.length > 0 ||
      careerGoals.targetIndustries.length > 0 ||
      (careerGoals.salaryExpectation.min && careerGoals.salaryExpectation.max);

    if (!hasSomeData) {
      errors.push('Please add at least one career goal before saving');
    }
    
    // Validate salary if both fields are filled
    if (careerGoals.salaryExpectation.min && careerGoals.salaryExpectation.max) {
      const min = parseInt(careerGoals.salaryExpectation.min, 10);
      const max = parseInt(careerGoals.salaryExpectation.max, 10);
      
      if (isNaN(min) || isNaN(max)) {
        errors.push('Please enter valid salary amounts');
      } else if (min > max) {
        errors.push('Minimum salary cannot be greater than maximum salary');
      } else if (min < 0 || max < 0) {
        errors.push('Salary amounts must be positive numbers');
      }
    }
    
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n\n'));
      return;
    }

    try {
      setSaving(true);
      
      const careerGoalsData = {
        careerInterests: careerGoals.careerInterests,
        targetIndustries: careerGoals.targetIndustries,
        salaryExpectation: {
          min: careerGoals.salaryExpectation.min ? parseInt(careerGoals.salaryExpectation.min, 10) : 0,
          max: careerGoals.salaryExpectation.max ? parseInt(careerGoals.salaryExpectation.max, 10) : 0
        }
      };

      if (__DEV__) {
        console.log('💾 [CareerGoals] Saving career goals data:', careerGoalsData);
      }

      await ResumeService.updateCareerGoals(careerGoalsData);
      Alert.alert('Success', 'Career goals updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving career goals:', error);
      Alert.alert('Error', 'Failed to update career goals. Please try again.');
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

  return (
    <SafeAreaView style={studentProfileStyles.container}>
      <ScreenHeader 
        title="Career Goals" 
        onBackPress={() => navigation.goBack()} 
      />
      
      <ScrollView style={studentProfileStyles.scrollView}>
        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Career Interests</Text>
          
          <View style={studentProfileStyles.sectionContent}>
            {careerGoals.careerInterests.map((interest, index) => (
              <View key={index} style={studentProfileStyles.quickInfo}>
                <Target size={16} color={COLORS.purple} />
                <Text style={studentProfileStyles.quickInfoText}>{interest}</Text>
                <TouchableOpacity onPress={() => removeCareerInterest(index)}>
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
                placeholder="Add career interest"
                value={newInterest}
                onChangeText={setNewInterest}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.purple,
                  padding: 12,
                  borderRadius: 8,
                  justifyContent: 'center'
                }}
                onPress={addCareerInterest}
              >
                <Plus size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Target Industries</Text>
          
          <View style={studentProfileStyles.sectionContent}>
            {careerGoals.targetIndustries.map((industry, index) => (
              <View key={index} style={studentProfileStyles.quickInfo}>
                <Briefcase size={16} color={COLORS.blue} />
                <Text style={studentProfileStyles.quickInfoText}>{industry}</Text>
                <TouchableOpacity onPress={() => removeTargetIndustry(index)}>
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
                placeholder="Add target industry"
                value={newIndustry}
                onChangeText={setNewIndustry}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.blue,
                  padding: 12,
                  borderRadius: 8,
                  justifyContent: 'center'
                }}
                onPress={addTargetIndustry}
              >
                <Plus size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Salary Expectation</Text>
          
          <View style={studentProfileStyles.sectionContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 16 }}>$</Text>
              <TextInput
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLORS.lightGray,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16
                }}
                placeholder="Min"
                value={careerGoals.salaryExpectation.min}
                onChangeText={(value) => setCareerGoals(prev => ({
                  ...prev,
                  salaryExpectation: { ...prev.salaryExpectation, min: value }
                }))}
                keyboardType="numeric"
              />
              <Text style={{ fontSize: 16 }}>to</Text>
              <TextInput
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLORS.lightGray,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16
                }}
                placeholder="Max"
                value={careerGoals.salaryExpectation.max}
                onChangeText={(value) => setCareerGoals(prev => ({
                  ...prev,
                  salaryExpectation: { ...prev.salaryExpectation, max: value }
                }))}
                keyboardType="numeric"
              />
            </View>
            
            <View style={studentProfileStyles.quickInfo}>
              <DollarSign size={16} color={COLORS.green} />
              <Text style={studentProfileStyles.quickInfoText}>
                {careerGoals.salaryExpectation.min && careerGoals.salaryExpectation.max
                  ? `$${careerGoals.salaryExpectation.min} - $${careerGoals.salaryExpectation.max}`
                  : 'Not specified'}
              </Text>
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
            backgroundColor: COLORS.purple,
            padding: 16,
            borderRadius: 12,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8
          }}
          onPress={handleSave}
        >
          <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '600' }}>
            Save
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </SafeAreaView>
  );
};

export default CareerGoals;
