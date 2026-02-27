import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/core/colors';
import { studentProfileStyles } from '../../../constants/styles/studentProfileStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { UserService } from '../../../services/user.service';
import { logger } from '../../../utils/logger';
import {
  Linkedin,
  Globe,
  Github,
  ExternalLink,
  Plus,
  X,
} from 'lucide-react-native';

interface ExternalProfile {
  id: string;
  platform: 'linkedin' | 'portfolio' | 'github' | 'personal';
  url: string;
  displayText: string;
}

const ExternalProfilesScreen = ({ navigation }: any) => {
  const [profiles, setProfiles] = useState<ExternalProfile[]>([]);
  const [newProfile, setNewProfile] = useState({
    platform: 'linkedin' as ExternalProfile['platform'],
    url: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExternalProfiles();
  }, []);

  const loadExternalProfiles = async () => {
    try {
      const response = await UserService.getProfile();
      if (response.profile && response.profile.externalProfiles) {
        const externalProfiles = response.profile.externalProfiles;
        const loadedProfiles: ExternalProfile[] = [];
        
        // Convert backend format to frontend format
        if (externalProfiles.linkedin) {
          loadedProfiles.push({
            id: 'linkedin',
            platform: 'linkedin',
            url: externalProfiles.linkedin,
            displayText: getDisplayText(externalProfiles.linkedin, 'linkedin'),
          });
        }
        if (externalProfiles.github) {
          loadedProfiles.push({
            id: 'github',
            platform: 'github',
            url: externalProfiles.github,
            displayText: getDisplayText(externalProfiles.github, 'github'),
          });
        }
        if (externalProfiles.portfolio) {
          loadedProfiles.push({
            id: 'portfolio',
            platform: 'portfolio',
            url: externalProfiles.portfolio,
            displayText: getDisplayText(externalProfiles.portfolio, 'portfolio'),
          });
        }
        
        setProfiles(loadedProfiles);
        if (__DEV__) {
          logger.debug('📥 [ExternalProfilesScreen] Loaded external profiles:', loadedProfiles);
        }
      }
    } catch (error) {
      if (__DEV__) {
        logger.error('Error loading external profiles:', error);
      }
    }
  };

  const platformConfig = {
    linkedin: {
      name: 'LinkedIn',
      icon: Linkedin,
      color: COLORS.blue,
      placeholder: 'https://linkedin.com/in/yourprofile',
      prefix: 'https://linkedin.com/in/',
    },
    portfolio: {
      name: 'Portfolio',
      icon: Globe,
      color: COLORS.green,
      placeholder: 'https://yourportfolio.com',
      prefix: '',
    },
    github: {
      name: 'GitHub',
      icon: Github,
      color: COLORS.black,
      placeholder: 'https://github.com/yourusername',
      prefix: 'https://github.com/',
    },
    personal: {
      name: 'Personal Website',
      icon: ExternalLink,
      color: COLORS.purple,
      placeholder: 'https://yourwebsite.com',
      prefix: '',
    },
  };

  const validateUrl = (url: string, platform: ExternalProfile['platform']): boolean => {
    if (!url.trim()) return false;
    
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(url)) {
      return false;
    }

    // Platform-specific validation
    const config = platformConfig[platform];
    if (platform === 'linkedin' && !url.includes('linkedin.com')) {
      return false;
    }
    if (platform === 'github' && !url.includes('github.com')) {
      return false;
    }

    return true;
  };

  const addProfile = () => {
    const { platform, url } = newProfile;
    
    if (!validateUrl(url, platform)) {
      Alert.alert(
        'Validation Error', 
        `Please enter a valid ${platformConfig[platform].name} URL`
      );
      return;
    }

    // Check for duplicate platforms
    if (profiles.some(profile => profile.platform === platform)) {
      Alert.alert(
        'Duplicate Entry', 
        `You already have a ${platformConfig[platform].name} profile added`
      );
      return;
    }

    const profile: ExternalProfile = {
      id: Date.now().toString(),
      platform,
      url: url.trim(),
      displayText: getDisplayText(url, platform),
    };

    setProfiles(prev => [...prev, profile]);
    setNewProfile({
      platform: 'linkedin',
      url: '',
    });
  };

  const getDisplayText = (url: string, platform: ExternalProfile['platform']): string => {
    const config = platformConfig[platform];
    if (config.prefix && url.startsWith(config.prefix)) {
      return url.replace(config.prefix, '');
    }
    return url.replace(/^https?:\/\//, '');
  };

  const removeProfile = (id: string) => {
    setProfiles(prev => prev.filter(profile => profile.id !== id));
  };

  const openProfile = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Issue', 'Unable to open this URL');
    });
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Convert frontend format to backend format
      const externalProfilesData: any = {};
      
      profiles.forEach(profile => {
        switch (profile.platform) {
          case 'linkedin':
            externalProfilesData.linkedin = profile.url;
            break;
          case 'github':
            externalProfilesData.github = profile.url;
            break;
          case 'portfolio':
            externalProfilesData.portfolio = profile.url;
            break;
        }
      });

      if (__DEV__) {
        logger.debug('💾 [ExternalProfilesScreen] Saving external profiles:', externalProfilesData);
      }
      
      await UserService.updateProfile({ externalProfiles: externalProfilesData });
      Alert.alert('Success', 'External profiles saved successfully!');
      navigation.goBack();
    } catch (error) {
      logger.error('Error saving external profiles:', error);
      Alert.alert('Issue', 'Failed to save external profiles. Please try again.');
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

  const handleUrlChange = (url: string, platform: ExternalProfile['platform']) => {
    const config = platformConfig[platform];
    
    // Auto-prefix if user doesn't include protocol
    if (url && !url.startsWith('http')) {
      if (config.prefix && !url.startsWith(config.prefix)) {
        url = config.prefix + url;
      } else if (!config.prefix) {
        url = 'https://' + url;
      }
    }
    
    setNewProfile(prev => ({ ...prev, url }));
  };

  return (
    <SafeAreaView style={studentProfileStyles.container}>
      <ScreenHeader 
        title="External Profiles" 
        onBackPress={() => navigation.goBack()} 
      />
      
      <ScrollView style={studentProfileStyles.scrollView}>
        {/* Current Profiles */}
        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Your Profiles</Text>
          
          <View style={studentProfileStyles.sectionContent}>
            {profiles.length === 0 ? (
              <Text style={{ 
                textAlign: 'center', 
                color: COLORS.gray, 
                fontStyle: 'italic',
                marginVertical: 20 
              }}>
                No external profiles added yet
              </Text>
            ) : (
              profiles.map((profile) => {
                const config = platformConfig[profile.platform];
                const Icon = config.icon;
                
                return (
                  <View key={profile.id} style={studentProfileStyles.quickInfo}>
                    <Icon size={16} color={config.color} />
                    <TouchableOpacity 
                      style={{ flex: 1 }} 
                      onPress={() => openProfile(profile.url)}
                    >
                      <Text style={studentProfileStyles.quickInfoText}>
                        {config.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.gray, marginTop: 2 }}>
                        {profile.displayText}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeProfile(profile.id)}>
                      <X size={16} color={COLORS.red} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Add New Profile */}
        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Add Profile</Text>
          
          <View style={studentProfileStyles.sectionContent}>
            {/* Platform Selection */}
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10 }}>
              Select Platform:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 15 }}>
                {Object.entries(platformConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderWidth: 1,
                        borderColor: newProfile.platform === key ? config.color : COLORS.lightGray,
                        borderRadius: 20,
                        backgroundColor: newProfile.platform === key ? config.color : COLORS.white,
                        gap: 6,
                      }}
                      onPress={() => setNewProfile(prev => ({ 
                        ...prev, 
                        platform: key as ExternalProfile['platform'],
                        url: ''
                      }))}
                    >
                      <Icon size={16} color={newProfile.platform === key ? COLORS.white : config.color} />
                      <Text style={{
                        fontSize: 14,
                        color: newProfile.platform === key ? COLORS.white : COLORS.black,
                        fontWeight: newProfile.platform === key ? '600' : 'normal',
                      }}>
                        {config.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* URL Input */}
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10 }}>
              {platformConfig[newProfile.platform].name} URL:
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: COLORS.lightGray,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                marginBottom: 10,
              }}
              placeholder={platformConfig[newProfile.platform].placeholder}
              value={newProfile.url}
              onChangeText={(url) => handleUrlChange(url, newProfile.platform)}
              autoCapitalize="none"
              keyboardType="url"
            />

            {/* URL Preview */}
            {newProfile.url && (
              <View style={{
                backgroundColor: COLORS.lightGray,
                padding: 10,
                borderRadius: 8,
                marginBottom: 10,
              }}>
                <Text style={{ fontSize: 12, color: COLORS.gray }}>
                  Preview: {newProfile.url}
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={{
                padding: 12,
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: platformConfig[newProfile.platform].color,
                flexDirection: 'row',
                gap: 8,
              }}
              onPress={addProfile}
            >
              <Plus size={16} color={COLORS.white} />
              <Text style={{ 
                color: COLORS.white, 
                fontSize: 16, 
                fontWeight: '600' 
              }}>
                Add {platformConfig[newProfile.platform].name} Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Guidelines */}
        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Profile Guidelines</Text>
          <View style={studentProfileStyles.sectionContent}>
            <Text style={{ fontSize: 14, color: COLORS.gray, lineHeight: 20 }}>
              <Text style={{ fontWeight: '600' }}>LinkedIn:</Text> Professional networking profile{'\n'}
              <Text style={{ fontWeight: '600' }}>Portfolio:</Text> Personal portfolio or work samples{'\n'}
              <Text style={{ fontWeight: '600' }}>GitHub:</Text> Code repositories and projects{'\n'}
              <Text style={{ fontWeight: '600' }}>Personal Website:</Text> Custom website or blog{'\n\n'}
              <Text style={{ fontWeight: '600' }}>Tips:</Text>{'\n'}
              • Ensure profiles are professional and up-to-date{'\n'}
              • Use public profiles that employers can view{'\n'}
              • Double-check URLs before saving{'\n'}
              • One profile per platform allowed
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

export default ExternalProfilesScreen;