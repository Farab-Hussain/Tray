import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../constants/core/colors';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { customAlertStyles } from '../../constants/styles/customAlertStyles';

interface CustomAlertProps {
  visible: boolean;
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
  onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={32} color={COLORS.green} />;
      case 'error':
        return <XCircle size={32} color={COLORS.red} />;
      case 'warning':
        return <AlertCircle size={32} color={COLORS.orange} />;
      default:
        return <CheckCircle size={32} color={COLORS.green} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#F0FDF4'; // Light green
      case 'error':
        return '#FEF2F2'; // Light red
      case 'warning':
        return '#FFFBEB'; // Light orange
      default:
        return '#F0FDF4';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return '#86EFAC'; // Green border
      case 'error':
        return '#FECACA'; // Red border
      case 'warning':
        return '#FED7AA'; // Orange border
      default:
        return '#86EFAC';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* OK Button */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: type === 'success' ? COLORS.green : 
                               type === 'error' ? COLORS.red : COLORS.orange
              }
            ]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = customAlertStyles;

export default CustomAlert;
