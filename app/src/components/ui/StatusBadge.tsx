import React from 'react';
import { View, Text } from 'react-native';
import { getStatusColor, getApplicationStatusColor, getJobStatusColor, getServiceApplicationStatusColor, getTransactionStatusColor } from '../../utils/statusUtils';
import { COLORS } from '../../constants/core/colors';
import { statusBadgeStyles as styles } from '../../constants/styles/statusBadgeStyles';

type StatusBadgeProps = {
  status: string;
  type?: 'application' | 'job' | 'service' | 'transaction' | 'booking';
  variant?: 'filled' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  style?: any;
  textStyle?: any;
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type,
  variant = 'filled',
  size = 'medium',
  style,
  textStyle,
}) => {
  const getColor = () => {
    if (type) {
      switch (type) {
        case 'application':
          return getApplicationStatusColor(status);
        case 'job':
          return getJobStatusColor(status);
        case 'service':
          return getServiceApplicationStatusColor(status);
        case 'transaction':
          return getTransactionStatusColor(status);
        default:
          return getStatusColor(status, type);
      }
    }
    return getStatusColor(status);
  };

  const backgroundColor = getColor();
  const textColor = variant === 'filled' ? COLORS.white : backgroundColor;

  const sizeStyles = {
    small: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 10 },
    medium: { paddingHorizontal: 10, paddingVertical: 4, fontSize: 12 },
    large: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 14 },
  };

  const currentSizeStyle = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        variant === 'filled' && { backgroundColor },
        variant === 'outlined' && {
          borderWidth: 1,
          borderColor: backgroundColor,
          backgroundColor: 'transparent',
        },
        {
          paddingHorizontal: currentSizeStyle.paddingHorizontal,
          paddingVertical: currentSizeStyle.paddingVertical,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize: currentSizeStyle.fontSize,
          },
          textStyle,
        ]}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
};

export default StatusBadge;

