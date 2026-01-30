import React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { COLORS } from '../../constants/core/colors';
import { consultantApplicationsScreenStyles as styles } from '../../constants/styles/consultantApplicationsScreenStyles';
import ImageUpload from './ImageUpload';

interface ConsultantServiceModalProps {
  visible: boolean;
  isEditing: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitButtonText: string;
  children: React.ReactNode;
}

const ConsultantServiceModal: React.FC<ConsultantServiceModalProps> = ({
  visible,
  isEditing,
  onClose,
  onSubmit,
  isSubmitting,
  submitButtonText,
  children,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Service' : 'New Application'}</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalForm}>
                {children}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={onSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Text style={styles.submitButtonText}>Submitting...</Text>
                ) : (
                  <Text style={styles.submitButtonText}>{submitButtonText}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ConsultantServiceModal;
