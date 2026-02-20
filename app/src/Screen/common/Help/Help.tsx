import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { COLORS } from '../../../constants/core/colors';
import { Mail, MessageCircle, FlaskConical } from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { SupportService } from '../../../services/support.service';
import { helpStyles } from '../../../constants/styles/helpStyles';
import { AIProvider, AIService } from '../../../services/ai.service';

const SUPPORT_EMAIL = 'umi342606@gmail.com';

const Help = ({ navigation }: any) => {
  const { user } = useAuth();
  const initialAIMessages = useMemo(
    () => [
      {
        role: 'assistant' as const,
        content:
          "Hi, I'm Tray AI Support. Ask me about resumes, job posts, or account help.",
      },
    ],
    []
  );

  const initialName = useMemo(() => {
    if (user?.displayName && user.displayName.trim()) {
      return user.displayName.trim();
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return '';
  }, [user?.displayName, user?.email]);

  const initialEmail = user?.email ?? '';

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAIModalVisible, setIsAIModalVisible] = useState(false);
  const [isAIDebugModalVisible, setIsAIDebugModalVisible] = useState(false);
  const [aiProvider, setAiProvider] = useState<AIProvider>('openai');
  const [aiMessages, setAiMessages] = useState(initialAIMessages);
  const [aiInput, setAiInput] = useState('');
  const [isAiSending, setIsAiSending] = useState(false);
  const [debugProvider, setDebugProvider] = useState<AIProvider>('openai');
  const [debugSystemPrompt, setDebugSystemPrompt] = useState('You are concise and helpful.');
  const [debugUserPrompt, setDebugUserPrompt] = useState('');
  const [debugOutput, setDebugOutput] = useState('');
  const [isDebugLoading, setIsDebugLoading] = useState(false);

  const resetForm = () => {
    setName(initialName);
    setEmail(initialEmail);
    setSubject('');
    setMessage('');
  };

  const handleOpenModal = () => {
    resetForm();
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleSendSupportEmail = async () => {
    if (!subject.trim()) {
      Alert.alert('Subject Required', 'Please enter a subject for your message.');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Message Required', 'Please enter a message describing your issue.');
      return;
    }

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
      Alert.alert(
        'Valid Email Required',
        'Please provide a valid email address so we can reach you.',
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await SupportService.sendSupportRequest({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setIsModalVisible(false);
      Alert.alert(
        'Message Sent',
        'Thanks for contacting Tray support. Our team will reach out within 24 hours.',
      );
    } catch (err: any) {
      if (__DEV__) {
        console.error('Error sending support request', err);
      }
      Alert.alert(
        'Something went wrong',
        `We could not send your request right now. Please try again later or email us at ${SUPPORT_EMAIL}.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAIModal = () => {
    setAiMessages(initialAIMessages);
    setAiInput('');
    setIsAIModalVisible(true);
  };

  const handleCloseAIModal = () => {
    setIsAIModalVisible(false);
  };

  const handleOpenAIDebugModal = () => {
    setDebugOutput('');
    setDebugUserPrompt('');
    setIsAIDebugModalVisible(true);
  };

  const handleCloseAIDebugModal = () => {
    setIsAIDebugModalVisible(false);
  };

  const handleSendAIMessage = async () => {
    const input = aiInput.trim();
    if (!input || isAiSending) return;

    const nextMessages = [...aiMessages, { role: 'user' as const, content: input }];
    setAiMessages(nextMessages);
    setAiInput('');

    try {
      setIsAiSending(true);
      const history = nextMessages.map(messageItem => ({
        role: messageItem.role,
        content: messageItem.content,
      }));
      const response = await AIService.chatbotMessage({
        provider: aiProvider,
        message: input,
        history,
        user_context: {
          name: initialName || 'User',
          plan: 'free',
        },
      });

      const reply = response?.reply?.trim();
      setAiMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: reply || 'I could not generate a response. Please try again.',
        },
      ]);
    } catch (err: any) {
      if (__DEV__) {
        console.error('AI support chat failed:', err);
      }
      const isQuotaError = err?.response?.status === 429;
      const fallbackMessage = isQuotaError
        ? 'OpenAI quota exceeded. Add billing/credits to OpenAI, or switch provider to Claude.'
        : err?.response?.data?.detail ||
          err?.message ||
          'I am having trouble right now. Please try again.';
      setAiMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: fallbackMessage,
        },
      ]);
    } finally {
      setIsAiSending(false);
    }
  };

  const handleRunAIDebug = async () => {
    if (!debugUserPrompt.trim()) {
      Alert.alert('Prompt Required', 'Please enter a user prompt.');
      return;
    }

    try {
      setIsDebugLoading(true);
      const result = await AIService.generateGeneric({
        provider: debugProvider,
        system_prompt: debugSystemPrompt.trim() || 'You are concise and helpful.',
        user_prompt: debugUserPrompt.trim(),
        max_tokens: 500,
      });
      setDebugOutput(result?.output?.trim() || 'No output returned.');
    } catch (err: any) {
      if (__DEV__) {
        console.error('AI debug request failed:', err);
      }
      setDebugOutput(
        err?.response?.data?.detail ||
          err?.message ||
          'AI debug request failed.'
      );
    } finally {
      setIsDebugLoading(false);
    }
  };

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader title="Help & Support" onBackPress={() => navigation.goBack()} />

      <ScrollView
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={screenStyles.container}>
          <Text style={screenStyles.heading}>Help & Support</Text>
          <Text style={screenStyles.helpText}>
            Need help? We're here to assist you.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Get Help</Text>
            <TouchableOpacity
              style={styles.emailCard}
              activeOpacity={0.85}
              onPress={handleOpenModal}
            >
              <View style={styles.contactIcon}>
                <Mail size={24} color={COLORS.green} />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactTitle}>Email Support</Text>
                <Text style={styles.responseTime}>Tap to compose your message</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.emailCard}
              activeOpacity={0.85}
              onPress={handleOpenAIModal}
            >
              <View style={styles.contactIcon}>
                <MessageCircle size={24} color={COLORS.green} />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactTitle}>AI Support Chat</Text>
                <Text style={styles.responseTime}>Tap to chat with OpenAI or Claude</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.emailCard}
              activeOpacity={0.85}
              onPress={handleOpenAIDebugModal}
            >
              <View style={styles.contactIcon}>
                <FlaskConical size={24} color={COLORS.green} />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactTitle}>AI Prompt Test</Text>
                <Text style={styles.responseTime}>Test /api/ai/generate quickly</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.appInfo}>
            <Text style={styles.appInfoText}>Tray App v1.0.0</Text>
            <Text style={styles.appInfoText}>© 2024 Tray. All rights reserved.</Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contact Support</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalDescription}>
                Fill out the form below and we’ll send the details directly to the Tray support team.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={COLORS.lightGray}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.lightGray}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subject</Text>
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="How can we help?"
                  placeholderTextColor={COLORS.lightGray}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message</Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Describe the issue or question"
                  placeholderTextColor={COLORS.lightGray}
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSendSupportEmail}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Sending…' : 'Send Message'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isAIModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseAIModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Support Chat</Text>
              <TouchableOpacity onPress={handleCloseAIModal} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.providerRow}>
                {(['openai', 'claude'] as AIProvider[]).map(provider => {
                  const active = aiProvider === provider;
                  return (
                    <TouchableOpacity
                      key={provider}
                      onPress={() => setAiProvider(provider)}
                      style={[styles.providerChip, active && styles.providerChipActive]}
                    >
                      <Text
                        style={[
                          styles.providerChipText,
                          active && styles.providerChipTextActive,
                        ]}
                      >
                        {provider === 'openai' ? 'OpenAI' : 'Claude'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <ScrollView
                style={styles.chatContainer}
                contentContainerStyle={styles.modalBodyContent}
                keyboardShouldPersistTaps="handled"
              >
                {aiMessages.map((chat, idx) => {
                  const isUser = chat.role === 'user';
                  return (
                    <View
                      key={`${chat.role}-${idx}`}
                      style={isUser ? styles.chatBubbleUser : styles.chatBubbleAssistant}
                    >
                      <Text
                        style={[
                          styles.chatBubbleText,
                          isUser && styles.chatBubbleTextUser,
                        ]}
                      >
                        {chat.content}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.chatInputRow}>
                <TextInput
                  value={aiInput}
                  onChangeText={setAiInput}
                  placeholder="Ask a question..."
                  placeholderTextColor={COLORS.lightGray}
                  style={styles.chatInput}
                  multiline
                />
                <TouchableOpacity
                  onPress={handleSendAIMessage}
                  disabled={isAiSending || !aiInput.trim()}
                  style={[
                    styles.sendAiButton,
                    (isAiSending || !aiInput.trim()) && styles.sendAiButtonDisabled,
                  ]}
                >
                  <Text style={styles.sendAiButtonText}>
                    {isAiSending ? '...' : 'Send'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isAIDebugModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseAIDebugModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Prompt Test</Text>
              <TouchableOpacity onPress={handleCloseAIDebugModal} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
              <View style={styles.providerRow}>
                {(['openai', 'claude'] as AIProvider[]).map(provider => {
                  const active = debugProvider === provider;
                  return (
                    <TouchableOpacity
                      key={provider}
                      onPress={() => setDebugProvider(provider)}
                      style={[styles.providerChip, active && styles.providerChipActive]}
                    >
                      <Text
                        style={[
                          styles.providerChipText,
                          active && styles.providerChipTextActive,
                        ]}
                      >
                        {provider === 'openai' ? 'OpenAI' : 'Claude'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>System Prompt</Text>
                <TextInput
                  value={debugSystemPrompt}
                  onChangeText={setDebugSystemPrompt}
                  placeholder="You are concise and helpful."
                  placeholderTextColor={COLORS.lightGray}
                  style={[styles.input, styles.textAreaCompact]}
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>User Prompt</Text>
                <TextInput
                  value={debugUserPrompt}
                  onChangeText={setDebugUserPrompt}
                  placeholder="Write your test prompt..."
                  placeholderTextColor={COLORS.lightGray}
                  style={[styles.input, styles.textAreaCompact]}
                  multiline
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isDebugLoading && styles.submitButtonDisabled]}
                onPress={handleRunAIDebug}
                disabled={isDebugLoading}
              >
                <Text style={styles.submitButtonText}>
                  {isDebugLoading ? 'Running…' : 'Run Test'}
                </Text>
              </TouchableOpacity>

              {debugOutput ? (
                <View style={styles.debugOutputCard}>
                  <Text style={styles.inputLabel}>Output</Text>
                  <Text style={styles.debugOutputText}>{debugOutput}</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = helpStyles;

export default Help;
