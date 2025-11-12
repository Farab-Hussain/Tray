import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
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
import { Mail } from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { SupportService } from '../../../services/support.service';

const SUPPORT_EMAIL = 'umi342606@gmail.com';

const Help = ({ navigation }: any) => {
  const { user } = useAuth();

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
    } catch (error) {
      console.error('Error sending support request', error);
      Alert.alert(
        'Something went wrong',
        `We could not send your request right now. Please try again later or email us at ${SUPPORT_EMAIL}.`,
      );
    } finally {
      setIsSubmitting(false);
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 16,
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.chatInputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  emailAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.green,
    marginBottom: 4,
  },
  responseTime: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  appInfo: {
    marginTop: 32,
    alignItems: 'center',
    paddingVertical: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 20,
    color: COLORS.gray,
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  modalBodyContent: {
    paddingBottom: 24,
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginVertical: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  textArea: {
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: COLORS.green,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Help;
