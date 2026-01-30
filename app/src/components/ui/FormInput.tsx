import React from 'react';
import {
  View,
  Text,
  TextInput,
} from 'react-native';
import { COLORS } from '../../constants/core/colors';
import { consultantApplicationsScreenStyles as styles } from '../../constants/styles/consultantApplicationsScreenStyles';

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  required?: boolean;
  style?: any;
  inputStyle?: any;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  error,
  required = false,
  style,
  inputStyle,
}) => {
  return (
    <View style={[styles.inputContainer, style]}>
      <Text style={styles.label}>
        {label}
        {required && ' *'}
      </Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
          error && { borderColor: COLORS.red },
          inputStyle,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.lightGray}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
      {error && (
        <Text style={{ color: COLORS.red, fontSize: 12, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default FormInput;
