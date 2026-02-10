import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/core/colors';
import { studentProfileStyles } from '../../../constants/styles/studentProfileStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import {
  Code,
  Users,
  Plus,
  X,
  Globe,
} from 'lucide-react-native';

interface Skill {
  id: string;
  name: string;
  category: 'technical' | 'soft' | 'language';
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface Language {
  id: string;
  language: string;
  proficiency: 'basic' | 'conversational' | 'professional' | 'native';
}

const SkillsScreen = ({ navigation }: any) => {
  const [technicalSkills, setTechnicalSkills] = useState<Skill[]>([]);
  const [softSkills, setSoftSkills] = useState<Skill[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [newTechnicalSkill, setNewTechnicalSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newLanguageProficiency, setNewLanguageProficiency] = useState('conversational');
  const [loading, setLoading] = useState(false);

  const proficiencyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
  const languageProficiencyLevels = ['basic', 'conversational', 'professional', 'native'];

  const addTechnicalSkill = () => {
    if (!newTechnicalSkill.trim()) {
      Alert.alert('Validation Error', 'Please enter a technical skill');
      return;
    }

    const skill: Skill = {
      id: Date.now().toString(),
      name: newTechnicalSkill.trim(),
      category: 'technical',
      proficiency: 'intermediate',
    };

    setTechnicalSkills(prev => [...prev, skill]);
    setNewTechnicalSkill('');
  };

  const addSoftSkill = () => {
    if (!newSoftSkill.trim()) {
      Alert.alert('Validation Error', 'Please enter a soft skill');
      return;
    }

    const skill: Skill = {
      id: Date.now().toString(),
      name: newSoftSkill.trim(),
      category: 'soft',
      proficiency: 'intermediate',
    };

    setSoftSkills(prev => [...prev, skill]);
    setNewSoftSkill('');
  };

  const addLanguage = () => {
    if (!newLanguage.trim()) {
      Alert.alert('Validation Error', 'Please enter a language');
      return;
    }

    const language: Language = {
      id: Date.now().toString(),
      language: newLanguage.trim(),
      proficiency: newLanguageProficiency as Language['proficiency'],
    };

    setLanguages(prev => [...prev, language]);
    setNewLanguage('');
    setNewLanguageProficiency('conversational');
  };

  const removeTechnicalSkill = (id: string) => {
    setTechnicalSkills(prev => prev.filter(skill => skill.id !== id));
  };

  const removeSoftSkill = (id: string) => {
    setSoftSkills(prev => prev.filter(skill => skill.id !== id));
  };

  const removeLanguage = (id: string) => {
    setLanguages(prev => prev.filter(lang => lang.id !== id));
  };

  const updateSkillProficiency = (skillId: string, proficiency: Skill['proficiency'], category: 'technical' | 'soft') => {
    if (category === 'technical') {
      setTechnicalSkills(prev => 
        prev.map(skill => 
          skill.id === skillId ? { ...skill, proficiency } : skill
        )
      );
    } else {
      setSoftSkills(prev => 
        prev.map(skill => 
          skill.id === skillId ? { ...skill, proficiency } : skill
        )
      );
    }
  };

  const handleSave = async () => {
    // Validation checks
    const errors: string[] = [];
    
    if (technicalSkills.length === 0 && softSkills.length === 0 && languages.length === 0) {
      errors.push('Please add at least one skill or language');
    }
    
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n\n'));
      return;
    }

    setLoading(true);
    
    try {
      // TODO: Save to backend
      Alert.alert('Success', 'Skills information saved successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save skills information');
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

  const getProficiencyColor = (proficiency: string) => {
    switch (proficiency) {
      case 'beginner':
      case 'basic':
        return COLORS.lightGray;
      case 'intermediate':
      case 'conversational':
        return COLORS.blue;
      case 'advanced':
      case 'professional':
        return COLORS.green;
      case 'expert':
      case 'native':
        return COLORS.purple;
      default:
        return COLORS.gray;
    }
  };

  return (
    <SafeAreaView style={studentProfileStyles.container}>
      <ScreenHeader 
        title="Skills & Languages" 
        onBackPress={() => navigation.goBack()} 
      />
      
      <ScrollView style={studentProfileStyles.scrollView}>
        {/* Technical Skills Section */}
        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Technical Skills</Text>
          
          <View style={studentProfileStyles.sectionContent}>
            {technicalSkills.map((skill) => (
              <View key={skill.id} style={studentProfileStyles.quickInfo}>
                <Code size={16} color={COLORS.blue} />
                <Text style={studentProfileStyles.quickInfoText}>
                  {skill.name}
                </Text>
                <View style={{ 
                  paddingHorizontal: 8, 
                  paddingVertical: 4, 
                  backgroundColor: getProficiencyColor(skill.proficiency || 'intermediate'),
                  borderRadius: 12
                }}>
                  <Text style={{ fontSize: 12, color: COLORS.white, fontWeight: '600' }}>
                    {skill.proficiency || 'intermediate'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeTechnicalSkill(skill.id)}>
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
                placeholder="Add technical skill (e.g., JavaScript, Python)"
                value={newTechnicalSkill}
                onChangeText={setNewTechnicalSkill}
              />
              <TouchableOpacity
                style={{
                  padding: 12,
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: COLORS.lightGray,
                }}
                onPress={addTechnicalSkill}
              >
                <Plus size={16} color={COLORS.black} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Soft Skills Section */}
        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Soft Skills</Text>
          
          <View style={studentProfileStyles.sectionContent}>
            {softSkills.map((skill) => (
              <View key={skill.id} style={studentProfileStyles.quickInfo}>
                <Users size={16} color={COLORS.green} />
                <Text style={studentProfileStyles.quickInfoText}>
                  {skill.name}
                </Text>
                <View style={{ 
                  paddingHorizontal: 8, 
                  paddingVertical: 4, 
                  backgroundColor: getProficiencyColor(skill.proficiency || 'intermediate'),
                  borderRadius: 12
                }}>
                  <Text style={{ fontSize: 12, color: COLORS.white, fontWeight: '600' }}>
                    {skill.proficiency || 'intermediate'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeSoftSkill(skill.id)}>
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
                placeholder="Add soft skill (e.g., Communication, Leadership)"
                value={newSoftSkill}
                onChangeText={setNewSoftSkill}
              />
              <TouchableOpacity
                style={{
                  padding: 12,
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: COLORS.lightGray,
                }}
                onPress={addSoftSkill}
              >
                <Plus size={16} color={COLORS.black} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Languages Section */}
        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Languages</Text>
          
          <View style={studentProfileStyles.sectionContent}>
            {languages.map((language) => (
              <View key={language.id} style={studentProfileStyles.quickInfo}>
                <Globe size={16} color={COLORS.purple} />
                <Text style={studentProfileStyles.quickInfoText}>
                  {language.language}
                </Text>
                <View style={{ 
                  paddingHorizontal: 8, 
                  paddingVertical: 4, 
                  backgroundColor: getProficiencyColor(language.proficiency),
                  borderRadius: 12
                }}>
                  <Text style={{ fontSize: 12, color: COLORS.white, fontWeight: '600' }}>
                    {language.proficiency}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeLanguage(language.id)}>
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
                placeholder="Language (e.g., English, Spanish)"
                value={newLanguage}
                onChangeText={setNewLanguage}
              />
              <TouchableOpacity
                style={{
                  padding: 12,
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: COLORS.lightGray,
                }}
                onPress={addLanguage}
              >
                <Plus size={16} color={COLORS.black} />
              </TouchableOpacity>
            </View>
            
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 5 }}>
                Proficiency Level:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {languageProficiencyLevels.map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderWidth: 1,
                        borderColor: newLanguageProficiency === level ? COLORS.purple : COLORS.lightGray,
                        borderRadius: 20,
                        backgroundColor: newLanguageProficiency === level ? COLORS.purple : COLORS.white,
                      }}
                      onPress={() => setNewLanguageProficiency(level)}
                    >
                      <Text style={{
                        fontSize: 14,
                        color: newLanguageProficiency === level ? COLORS.white : COLORS.black,
                        fontWeight: newLanguageProficiency === level ? '600' : 'normal',
                        textTransform: 'capitalize',
                      }}>
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Skills Guidelines */}
        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Skills Guidelines</Text>
          <View style={studentProfileStyles.sectionContent}>
            <Text style={{ fontSize: 14, color: COLORS.gray, lineHeight: 20 }}>
              <Text style={{ fontWeight: '600' }}>Technical Skills:</Text> Programming languages, software, tools, and technical competencies{'\n\n'}
              <Text style={{ fontWeight: '600' }}>Soft Skills:</Text> Communication, teamwork, problem-solving, leadership, and interpersonal abilities{'\n\n'}
              <Text style={{ fontWeight: '600' }}>Proficiency Levels:</Text>{'\n'}
              • Beginner/Basic: Learning stage{'\n'}
              • Intermediate/Conversational: Can work independently{'\n'}
              • Advanced/Professional: Highly skilled{'\n'}
              • Expert/Native: Mastery level
            </Text>
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

export default SkillsScreen;
