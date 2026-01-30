import React from 'react';
import {
  View,
  Text,
  TextInput,
} from 'react-native';
import { COLORS } from '../../constants/core/colors';
import { consultantApplicationsScreenStyles as styles } from '../../constants/styles/consultantApplicationsScreenStyles';

interface PriceInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  style?: any;
}

const PriceInput: React.FC<PriceInputProps> = ({
  value,
  onChangeText,
  placeholder = '150',
  error,
  required = false,
  style,
}) => {
  return (
    <View style={[styles.inputContainer, style]}>
      <Text style={styles.label}>
        Price (USD)
        {required && ' *'}
      </Text>
      <View style={styles.priceInput}>
        <Text style={styles.priceSymbol}>$</Text>
        <TextInput
          style={[
            styles.input,
            styles.priceInputField,
            error && { borderColor: COLORS.red },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.lightGray}
          keyboardType="numeric"
        />
      </View>
      {error && (
        <Text style={{ color: COLORS.red, fontSize: 12, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default PriceInput;
