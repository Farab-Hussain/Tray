import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { COLORS } from '../../../constants/core/colors';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import {
  Upload,
  FileText,
  Video,
  BookOpen,
  Lightbulb,
  Plus,
  X,
  CheckCircle,
} from 'lucide-react-native';
import { ConsultantContentService } from '../../../services/consultantContent.service';
import { consultantContentStyles } from '../../../constants/styles/consultantContentStyles';
import { AIProvider, AIService } from '../../../services/ai.service';

interface ContentData {
  title: string;
  description: string;
  contentType: 'video' | 'pdf' | 'article' | 'tip' | 'guide' | 'resource';
  contentUrl?: string;
  thumbnailUrl?: string;
  tags: string[];
  category: string;
  isFree: boolean;
  price?: number;
}

const ConsultantContentPostingScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [contentData, setContentData] = useState<ContentData>({
    title: '',
    description: '',
    contentType: 'article',
    tags: [],
    category: '',
    isFree: true,
    price: 0,
  });
  const [newTag, setNewTag] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [thumbnailFile, setThumbnailFile] = useState<any>(null);
  const [contentAiLoading, setContentAiLoading] = useState(false);
  const [contentInsights, setContentInsights] = useState<{
    trending_skill_topics: string[];
    free_content_ideas: string[];
    pricing_recommendation: string;
  } | null>(null);

  const contentTypes = [
    { value: 'article', label: 'Article', icon: BookOpen, color: COLORS.blue },
    { value: 'video', label: 'Video', icon: Video, color: COLORS.purple },
    { value: 'pdf', label: 'PDF Document', icon: FileText, color: COLORS.red },
    { value: 'tip', label: 'Tip', icon: Lightbulb, color: COLORS.green },
    { value: 'guide', label: 'Guide', icon: BookOpen, color: COLORS.orange },
    { value: 'resource', label: 'Resource', icon: Upload, color: COLORS.gray },
  ];

  const parsePossibleJSON = (text: string) => {
    const cleaned = (text || '')
      .trim()
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleaned || '{}');
  };

  const openProviderPicker = (
    title: string,
    action: (provider: AIProvider) => Promise<void> | void,
  ) => {
    Alert.alert(title, 'Choose AI provider', [
      { text: 'OpenAI', onPress: () => action('openai') },
      { text: 'Claude', onPress: () => action('claude') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleContentOptimization = async (provider: AIProvider) => {
    try {
      setContentAiLoading(true);
      const result = await AIService.generateGeneric({
        provider,
        json_mode: true,
        max_tokens: 700,
        system_prompt:
          'You are a consultant content strategy assistant. Return strict JSON only.',
        user_prompt: `Provide content optimization insights for this consultant draft.
Context:
- content_type: ${contentData.contentType}
- title: ${contentData.title || 'N/A'}
- category: ${contentData.category || 'N/A'}
- tags: ${contentData.tags.join(', ') || 'none'}
- is_free: ${contentData.isFree}
- current_price: ${contentData.price || 0}

Return JSON:
{
  "trending_skill_topics": ["..."],
  "free_content_ideas": ["..."],
  "pricing_recommendation": "..."
}`,
      });

      const parsed = parsePossibleJSON(result?.output || '{}');
      setContentInsights({
        trending_skill_topics: Array.isArray(parsed?.trending_skill_topics)
          ? parsed.trending_skill_topics
          : [],
        free_content_ideas: Array.isArray(parsed?.free_content_ideas)
          ? parsed.free_content_ideas
          : [],
        pricing_recommendation:
          parsed?.pricing_recommendation || 'No pricing recommendation returned.',
      });
    } catch (error: any) {
      if (__DEV__) {
        console.error('Content optimization AI failed:', error);
      }
      Alert.alert(
        'AI Error',
        error?.response?.data?.detail ||
          error?.message ||
          'Failed to generate content optimization insights.',
      );
    } finally {
      setContentAiLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !contentData.tags.includes(newTag.trim())) {
      setContentData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setContentData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const pickDocument = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
        quality: 0.8,
      });

      if (!result.didCancel && result.assets) {
        setSelectedFile(result.assets[0]);
      }
    } catch {
      Alert.alert('Issue', 'Failed to pick document');
    }
  };

  const pickThumbnail = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 500,
        maxWidth: 500,
        quality: 0.8,
      });

      if (!result.didCancel && result.assets) {
        setThumbnailFile(result.assets[0]);
      }
    } catch {
      Alert.alert('Issue', 'Failed to pick thumbnail');
    }
  };

  const pickVideo = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'video',
        includeBase64: false,
        quality: 0.8,
      });

      if (!result.didCancel && result.assets) {
        setSelectedFile(result.assets[0]);
      }
    } catch {
      Alert.alert('Issue', 'Failed to pick video');
    }
  };

  const handleFileUpload = () => {
    Alert.alert(
      'Upload Content',
      'Choose how you want to upload your content:',
      [
        {
          text: 'Document/Image',
          onPress: pickDocument,
        },
        {
          text: 'Video',
          onPress: pickVideo,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const validateContent = () => {
    const errors: string[] = [];
    
    if (!contentData.title.trim()) {
      errors.push('Title is required');
    }
    
    if (!contentData.description.trim()) {
      errors.push('Description is required');
    }
    
    if (!contentData.category) {
      errors.push('Category is required');
    }
    
    if (contentData.tags.length === 0) {
      errors.push('At least one tag is required');
    }
    
    if (!contentData.isFree && (!contentData.price || contentData.price <= 0)) {
      errors.push('Price must be greater than 0 for paid content');
    }
    
    if (contentData.contentType === 'video' && !selectedFile) {
      errors.push('Video file is required');
    }
    
    if (contentData.contentType === 'pdf' && !selectedFile) {
      errors.push('PDF file is required');
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateContent();
    
    if (errors.length > 0) {
      Alert.alert('Validation Issue', issues.join('\n\n'));
      return;
    }

    setLoading(true);
    
    try {
      // Upload files first (in a real implementation)
      let contentUrl = '';
      let thumbnailUrl = '';
      
      if (selectedFile) {
        // Mock upload - in real implementation, upload to Cloudinary
        contentUrl = selectedFile.uri;
      }
      
      if (thumbnailFile) {
        // Mock thumbnail upload
        thumbnailUrl = thumbnailFile.uri;
      }

      const contentToSubmit = {
        ...contentData,
        contentUrl,
        thumbnailUrl,
      };

      await ConsultantContentService.createContent(contentToSubmit);
      
      Alert.alert(
        'Success',
        'Content submitted successfully! It will be reviewed by our team before being published.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      logger.error('Error creating content:', error);
      Alert.alert('Issue', issue.message || 'Failed to create content');
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

  const renderContentTypeSelector = () => {
    return (
      <View style={consultantContentStyles.section}>
        <Text style={consultantContentStyles.sectionTitle}>Content Type</Text>
        <View style={consultantContentStyles.sectionContent}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={consultantContentStyles.contentTypeContainer}>
              {contentTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      consultantContentStyles.contentTypeOption,
                      contentData.contentType === type.value && consultantContentStyles.selectedContentType,
                      { backgroundColor: type.color }
                    ]}
                    onPress={() => setContentData(prev => ({ ...prev, contentType: type.value as any }))}
                  >
                    <Icon size={20} color={COLORS.white} />
                    <Text style={consultantContentStyles.contentTypeText}>{type.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderFileUpload = () => {
    if (contentData.contentType === 'article' || contentData.contentType === 'tip' || contentData.contentType === 'guide' || contentData.contentType === 'resource') {
      return null;
    }

    return (
      <View style={consultantContentStyles.section}>
        <Text style={consultantContentStyles.sectionTitle}>
          {contentData.contentType === 'video' ? 'Video Upload' : 'Document Upload'}
        </Text>
        <View style={consultantContentStyles.sectionContent}>
          {selectedFile ? (
            <View style={consultantContentStyles.uploadedFileContainer}>
              <View style={consultantContentStyles.uploadedFileInfo}>
                <CheckCircle size={16} color={COLORS.green} />
                <Text style={consultantContentStyles.uploadedFileName}>
                  {selectedFile.fileName}
                </Text>
              </View>
              <TouchableOpacity
                style={consultantContentStyles.removeFileButton}
                onPress={() => setSelectedFile(null)}
              >
                <X size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={consultantContentStyles.uploadButton}
              onPress={handleFileUpload}
            >
              <Upload size={20} color={COLORS.white} />
              <Text style={consultantContentStyles.uploadButtonText}>
                Upload {contentData.contentType === 'video' ? 'Video' : 'Document'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderThumbnailUpload = () => {
    return (
      <View style={consultantContentStyles.section}>
        <Text style={consultantContentStyles.sectionTitle}>Thumbnail (Optional)</Text>
        <View style={consultantContentStyles.sectionContent}>
          {thumbnailFile ? (
            <View style={consultantContentStyles.thumbnailContainer}>
              <Image
                source={{ uri: thumbnailFile.uri }}
                style={consultantContentStyles.thumbnailImage}
              />
              <TouchableOpacity
                style={consultantContentStyles.removeThumbnailButton}
                onPress={() => setThumbnailFile(null)}
              >
                <X size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={consultantContentStyles.thumbnailUploadButton}
              onPress={pickThumbnail}
            >
              <Upload size={20} color={COLORS.blue} />
              <Text style={consultantContentStyles.thumbnailButtonText}>
                Add Thumbnail
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={consultantContentStyles.container}>
      <ScreenHeader 
        title="Create Content" 
        onBackPress={() => navigation.goBack()} 
      />
      
      <ScrollView style={consultantContentStyles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Content Type Selection */}
        {renderContentTypeSelector()}

        {/* File Upload */}
        {renderFileUpload()}

        {/* Thumbnail Upload */}
        {renderThumbnailUpload()}

        {/* Basic Information */}
        <View style={consultantContentStyles.section}>
          <Text style={consultantContentStyles.sectionTitle}>Basic Information</Text>
          <View style={consultantContentStyles.sectionContent}>
            <TextInput
              style={consultantContentStyles.input}
              placeholder="Content Title *"
              value={contentData.title}
              onChangeText={(value) => setContentData(prev => ({ ...prev, title: value }))}
            />
            
            <TextInput
              style={[consultantContentStyles.input, consultantContentStyles.textArea]}
              placeholder="Content Description *"
              value={contentData.description}
              onChangeText={(value) => setContentData(prev => ({ ...prev, description: value }))}
              multiline
              numberOfLines={4}
            />

            <TextInput
              style={consultantContentStyles.input}
              placeholder="Category *"
              value={contentData.category}
              onChangeText={(value) => setContentData(prev => ({ ...prev, category: value }))}
            />
          </View>
        </View>

        {/* Tags */}
        <View style={consultantContentStyles.section}>
          <Text style={consultantContentStyles.sectionTitle}>Tags</Text>
          <View style={consultantContentStyles.sectionContent}>
            <View style={consultantContentStyles.tagContainer}>
              {contentData.tags.map((tag, index) => (
                <View key={index} style={consultantContentStyles.tag}>
                  <Text style={consultantContentStyles.tagText}>{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(tag)}>
                    <X size={12} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            
            <View style={consultantContentStyles.addTagContainer}>
              <TextInput
                style={consultantContentStyles.tagInput}
                placeholder="Add tag..."
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={addTag}
              />
              <TouchableOpacity
                style={consultantContentStyles.addTagButton}
                onPress={addTag}
              >
                <Plus size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Pricing */}
        <View style={consultantContentStyles.section}>
          <Text style={consultantContentStyles.sectionTitle}>Pricing</Text>
          <View style={consultantContentStyles.sectionContent}>
            <View style={consultantContentStyles.pricingContainer}>
              <TouchableOpacity
                style={[
                  consultantContentStyles.pricingOption,
                  contentData.isFree && consultantContentStyles.selectedPricingOption
                ]}
                onPress={() => setContentData(prev => ({ ...prev, isFree: true, price: 0 }))}
              >
                <CheckCircle size={16} color={contentData.isFree ? COLORS.white : COLORS.gray} />
                <Text style={[
                  consultantContentStyles.pricingText,
                  { color: contentData.isFree ? COLORS.white : COLORS.black }
                ]}>
                  Free Content
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  consultantContentStyles.pricingOption,
                  !contentData.isFree && consultantContentStyles.selectedPricingOption
                ]}
                onPress={() => setContentData(prev => ({ ...prev, isFree: false }))}
              >
                <CheckCircle size={16} color={!contentData.isFree ? COLORS.white : COLORS.gray} />
                <Text style={[
                  consultantContentStyles.pricingText,
                  { color: !contentData.isFree ? COLORS.white : COLORS.black }
                ]}>
                  Paid Content
                </Text>
              </TouchableOpacity>
            </View>
            
            {!contentData.isFree && (
              <TextInput
                style={consultantContentStyles.input}
                placeholder="Price (in USD)"
                value={contentData.price?.toString() || ''}
                onChangeText={(value) => setContentData(prev => ({ ...prev, price: parseFloat(value) || 0 }))}
                keyboardType="numeric"
              />
            )}
          </View>
        </View>

        {/* Guidelines */}
        <View style={consultantContentStyles.section}>
          <Text style={consultantContentStyles.sectionTitle}>Content Guidelines</Text>
          <View style={consultantContentStyles.sectionContent}>
            <Text style={consultantContentStyles.guidelinesText}>
              • High-quality, original content that provides value to users{'\n'}
              • Clear, descriptive titles and comprehensive descriptions{'\n'}
              • Proper categorization and relevant tags{'\n'}
              • Free content helps build your reputation and attract clients{'\n'}
              • Paid content should provide exceptional value{'\n'}
              • All content is subject to admin approval before publishing{'\n'}
              • No copyrighted material without proper attribution
            </Text>
          </View>
        </View>

        <View style={consultantContentStyles.section}>
          <Text style={consultantContentStyles.sectionTitle}>
            AI Content Optimization
          </Text>
          <View style={consultantContentStyles.sectionContent}>
            <Text style={consultantContentStyles.guidelinesText}>
              Get trending topics, free content ideas, and pricing guidance based on your draft.
            </Text>
            <TouchableOpacity
              style={[
                consultantContentStyles.aiActionButton,
                contentAiLoading && consultantContentStyles.aiActionButtonDisabled,
              ]}
              onPress={() =>
                openProviderPicker(
                  'AI Content Optimization',
                  handleContentOptimization,
                )
              }
              disabled={contentAiLoading}
              activeOpacity={0.8}
            >
              <Text style={consultantContentStyles.aiActionButtonText}>
                {contentAiLoading ? 'Analyzing...' : 'Generate AI Content Insights'}
              </Text>
            </TouchableOpacity>

            {contentInsights ? (
              <View style={consultantContentStyles.aiResultBox}>
                <Text style={consultantContentStyles.aiResultHeading}>
                  Trending Skill Topics
                </Text>
                {contentInsights.trending_skill_topics.map((topic, index) => (
                  <Text
                    key={`${topic}-${index}`}
                    style={consultantContentStyles.aiResultText}
                  >
                    • {topic}
                  </Text>
                ))}

                <Text style={consultantContentStyles.aiResultHeading}>
                  Free Content Ideas
                </Text>
                {contentInsights.free_content_ideas.map((idea, index) => (
                  <Text
                    key={`${idea}-${index}`}
                    style={consultantContentStyles.aiResultText}
                  >
                    • {idea}
                  </Text>
                ))}

                <Text style={consultantContentStyles.aiResultHeading}>
                  Pricing Recommendation
                </Text>
                <Text style={consultantContentStyles.aiResultText}>
                  {contentInsights.pricing_recommendation}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={consultantContentStyles.buttonContainer}>
          <TouchableOpacity
            style={consultantContentStyles.cancelButton}
            onPress={handleCancel}
            disabled={loading}
          >
            <Text style={consultantContentStyles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={consultantContentStyles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={consultantContentStyles.submitButtonText}>Submit for Review</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ConsultantContentPostingScreen;