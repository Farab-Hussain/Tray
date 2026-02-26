import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ResumeService } from '../../../services/resume.service';
import { COLORS } from '../../../constants/core/colors';
import { studentProfileStyles } from '../../../constants/styles/studentProfileStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { logger } from '../../../utils/logger';
import {
  Target,
  DollarSign,
  Plus,
  X,
  Briefcase,
  ShieldCheck,
  Upload,
} from 'lucide-react-native';
import UploadService from '../../../services/upload.service';

const CareerGoals = ({ navigation }: any) => {
  const [careerGoals, setCareerGoals] = useState({
    careerInterests: [] as string[],
    targetIndustries: [] as string[],
    industriesToAvoid: [] as string[],
    salaryExpectation: {
      min: '',
      max: ''
    },
    employmentGapExplanation: '',
    picsAssessmentCompleted: false,
    picsAssessmentProof: undefined as
      | { fileUrl: string; publicId?: string; fileName: string; uploadedAt: string; mimeType?: string }
      | undefined,
  });

  const [newInterest, setNewInterest] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [showPicsToggle, setShowPicsToggle] = useState(true);
  const [saving, setSaving] = useState(false);
  const [picsProof, setPicsProof] = useState<
    | { fileUrl: string; publicId?: string; fileName: string; uploadedAt: string; mimeType?: string }
    | undefined
  >(undefined);
  const [picsUploading, setPicsUploading] = useState(false);

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
            industriesToAvoid: response.goals.industriesToAvoid || [],
            salaryExpectation: {
              min: response.goals.salaryExpectation?.min?.toString() || '',
              max: response.goals.salaryExpectation?.max?.toString() || ''
            },
            employmentGapExplanation: response.goals.employmentGapExplanation || '',
      picsAssessmentCompleted: !!response.goals.picsAssessmentCompleted,
      picsAssessmentProof: response.goals.picsAssessmentProof,
          };
        
        if (__DEV__) {
          logger.debug('📥 [CareerGoals] Loaded career goals:', loadedGoals);
        }
        
        setCareerGoals(loadedGoals);
      }
    } catch (error: any) {
      // 404 is expected for new users - no career goals exist yet
      if (error?.response?.status === 404) {
        logger.debug('No existing career goals found, starting with defaults');
      } else {
        // Log other errors but don't crash the app
        if (__DEV__) {
          logger.error('Error loading career goals:', error);
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
        },
        employmentGapExplanation: careerGoals.employmentGapExplanation || undefined,
        picsAssessmentCompleted: careerGoals.picsAssessmentCompleted,
        picsAssessmentCompletedAt: careerGoals.picsAssessmentCompleted ? new Date().toISOString() : undefined,
        picsAssessmentProof: picsProof,
      };

      if (__DEV__) {
        logger.debug('💾 [CareerGoals] Saving career goals data:', careerGoalsData);
      }

      await ResumeService.updateCareerGoals(careerGoalsData);
      Alert.alert('Success', 'Career goals updated successfully!');
      navigation.goBack();
    } catch (error) {
      logger.error('Error saving career goals:', error);
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={studentProfileStyles.sectionTitle}>PICS Assessment Proof</Text>
            <TouchableOpacity
              onPress={async () => {
                try {
                  setPicsUploading(true);
                  // Use the same UploadService file picker as other uploads
                  const picker = require('react-native-document-picker');
                  const res = await picker.pick({
                    type: [
                      picker.types.images,
                      picker.types.pdf,
                      picker.types.doc,
                      picker.types.docx,
                    ],
                  });
                  const file = res?.[0] || res;
                  if (!file) return;

                  const uploadRes = await UploadService.uploadFile(file, 'pics-proof');
                  const proof = {
                    fileUrl: uploadRes?.fileUrl || uploadRes?.imageUrl || uploadRes?.url,
                    publicId: uploadRes?.publicId,
                    fileName: uploadRes?.fileName || file?.name || 'document',
                    mimeType: file?.type,
                    uploadedAt: new Date().toISOString(),
                  };
                  setPicsProof(proof);
                  setCareerGoals(prev => ({ ...prev, picsAssessmentCompleted: true }));
                  showSuccess('Proof uploaded and PICS marked as completed');
                } catch (err: any) {
                  if (err?.message?.includes('cancel')) return;
                  showError(err?.message || 'Failed to upload proof');
                } finally {
                  setPicsUploading(false);
                }
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: COLORS.blue,
                opacity: picsUploading ? 0.6 : 1,
              }}
              disabled={picsUploading}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Upload size={16} color={COLORS.white} />
                <Text style={{ color: COLORS.white, fontWeight: '600' }}>
                  {picsUploading ? 'Uploading...' : 'Upload Proof'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {picsProof ? (
            <View style={[studentProfileStyles.quickInfo, { marginTop: 10 }]}>
              <ShieldCheck size={16} color={COLORS.green} />
              <Text style={studentProfileStyles.quickInfoText}>{picsProof.fileName}</Text>
              <TouchableOpacity onPress={() => setPicsProof(undefined)}>
                <X size={16} color={COLORS.red} />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={{ color: COLORS.gray, marginTop: 8 }}>
              Upload a certificate or screenshot to support the PICS completion claim.
            </Text>
          )}
        </View>

        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Employment Gap Explanation</Text>
          <View style={studentProfileStyles.sectionContent}>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: COLORS.lightGray,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                minHeight: 80,
                textAlignVertical: 'top'
              }}
              placeholder="Briefly explain any recent employment gaps (optional)"
              value={careerGoals.employmentGapExplanation}
              onChangeText={(text) => setCareerGoals(prev => ({ ...prev, employmentGapExplanation: text }))}
              multiline
            />
          </View>
        </View>

        <View style={studentProfileStyles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={studentProfileStyles.sectionTitle}>PICS Assessment Completed</Text>
            <Switch
              value={careerGoals.picsAssessmentCompleted}
              onValueChange={(val) => setCareerGoals(prev => ({ ...prev, picsAssessmentCompleted: val }))}
            />
          </View>
          <Text style={{ color: COLORS.gray, marginTop: 6 }}>
            Toggle on if you have finished the PICS assessment.
          </Text>
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
