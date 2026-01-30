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

  const handleSave = () => {
    // Validation checks
    const errors: string[] = [];
    
    if (careerGoals.careerInterests.length === 0) {
      errors.push('Please add at least one career interest');
    }
    
    if (careerGoals.targetIndustries.length === 0) {
      errors.push('Please add at least one target industry');
    }
    
    if (!careerGoals.salaryExpectation.min || !careerGoals.salaryExpectation.max) {
      errors.push('Please specify both minimum and maximum salary expectations');
    } else {
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

    Alert.alert('Success', 'Career goals updated successfully!');
    navigation.goBack();
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
