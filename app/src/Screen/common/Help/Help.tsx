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
import { AIService } from '../../../services/ai.service';

const SUPPORT_EMAIL = 'umi342606@gmail.com';
const PROMPT_STUDIO_SYSTEM_PROMPT =
  'You are Tray Prompt Studio Assistant. Provide professional, concise, and practical responses. Keep context from prior turns and answer the latest user prompt clearly. If request is ambiguous, ask one focused clarifying question.';

const Help = ({ navigation }: any) => {
  const { user } = useAuth();
  const initialAIMessages = useMemo(
    () => [
      {
        role: 'assistant' as const,
        content:
          "Hello, I'm Tray Support Assistant. I can help with resumes, job posts, profile setup, and account questions.",
      },
    ],
    []
  );
  const initialPromptStudioMessages = useMemo(
    () => [
      {
        role: 'assistant' as const,
        content:
          'Prompt Studio is ready. Enter a prompt to test multi-turn responses.',
      },
    ],
    [],
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
  const [aiMessages, setAiMessages] = useState(initialAIMessages);
  const [aiInput, setAiInput] = useState('');
  const [isAiSending, setIsAiSending] = useState(false);
  const [promptStudioMessages, setPromptStudioMessages] = useState(
    initialPromptStudioMessages,
  );
  const [promptStudioInput, setPromptStudioInput] = useState('');
  const [isPromptStudioSending, setIsPromptStudioSending] = useState(false);

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
    setPromptStudioMessages(initialPromptStudioMessages);
    setPromptStudioInput('');
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
        provider: 'openai',
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
      const fallbackMessage =
        err?.response?.data?.detail ||
        err?.message ||
        'AI support is temporarily unavailable. Please try again.';
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

  const handleSendPromptStudioMessage = async () => {
    const input = promptStudioInput.trim();
    if (!input || isPromptStudioSending) {
      return;
    }

    const nextMessages = [
      ...promptStudioMessages,
      { role: 'user' as const, content: input },
    ];
    setPromptStudioMessages(nextMessages);
    setPromptStudioInput('');

    try {
      setIsPromptStudioSending(true);
      const transcript = nextMessages
        .slice(-12)
        .map(item => `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.content}`)
        .join('\n\n');

      const result = await AIService.generateGeneric({
        provider: 'openai',
        system_prompt: PROMPT_STUDIO_SYSTEM_PROMPT,
        user_prompt: `Continue this conversation and answer the latest user prompt.

Conversation:
${transcript}`,
        max_tokens: 500,
      });

      const reply = result?.output?.trim();
      setPromptStudioMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: reply || 'No output returned. Please try again.',
        },
      ]);
    } catch (err: any) {
      if (__DEV__) {
        console.error('Prompt studio request failed:', err);
      }
      setPromptStudioMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            err?.response?.data?.detail ||
            err?.message ||
            'Prompt Studio is temporarily unavailable. Please try again.',
        },
      ]);
    } finally {
      setIsPromptStudioSending(false);
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
                <Text style={styles.responseTime}>Get instant support guidance</Text>
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
                <Text style={styles.contactTitle}>AI Prompt Studio</Text>
                <Text style={styles.responseTime}>Test prompts in a multi-turn chat flow</Text>
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
              <Text style={styles.modalTitle}>AI Prompt Studio</Text>
              <TouchableOpacity onPress={handleCloseAIDebugModal} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Validate prompt behavior with an ongoing conversation. The system prompt is managed internally.
              </Text>

              <ScrollView
                style={styles.chatContainer}
                contentContainerStyle={styles.modalBodyContent}
                keyboardShouldPersistTaps="handled"
              >
                {promptStudioMessages.map((chat, idx) => {
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
                  value={promptStudioInput}
                  onChangeText={setPromptStudioInput}
                  placeholder="Enter a prompt to test..."
                  placeholderTextColor={COLORS.lightGray}
                  style={styles.chatInput}
                  multiline
                />
                <TouchableOpacity
                  onPress={handleSendPromptStudioMessage}
                  disabled={isPromptStudioSending || !promptStudioInput.trim()}
                  style={[
                    styles.sendAiButton,
                    (isPromptStudioSending || !promptStudioInput.trim()) &&
                      styles.sendAiButtonDisabled,
                  ]}
                >
                  <Text style={styles.sendAiButtonText}>
                    {isPromptStudioSending ? '...' : 'Send'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = helpStyles;

export default Help;
