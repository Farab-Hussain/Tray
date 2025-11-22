import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/core/colors';
import { errorDisplayStyles as styles } from '../../constants/styles/errorDisplayStyles';

type ErrorDisplayProps = {
  error: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: string;
  containerStyle?: any;
  textStyle?: any;
};

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  retryLabel = 'Retry',
  icon = '⚠️',
  containerStyle,
  textStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.text, textStyle]}>{error}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ErrorDisplay;

