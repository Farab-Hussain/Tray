import React from 'react';
import { View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { COLORS } from '../../constants/core/colors';
import { statCardStyles } from '../../constants/styles/statCardStyles';

type StatCardProps = {
  icon?: React.ComponentType<any> | LucideIcon;
  iconSize?: number;
  iconColor?: string;
  value: string | number;
  label: string;
  variant?: 'default' | 'pending' | 'approved' | 'rejected';
  containerStyle?: any;
  valueStyle?: any;
  labelStyle?: any;
};

const StatCard: React.FC<StatCardProps> = ({
  icon: IconComponent,
  iconSize = 24,
  iconColor,
  value,
  label,
  variant = 'default',
  containerStyle,
  valueStyle,
  labelStyle,
}) => {
  // Get variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'pending':
        return {
          card: statCardStyles.statCardPending,
          value: statCardStyles.statValuePending,
          label: statCardStyles.statLabelPending,
          defaultIconColor: '#F59E0B',
        };
      case 'approved':
        return {
          card: statCardStyles.statCardApproved,
          value: statCardStyles.statValueApproved,
          label: statCardStyles.statLabelApproved,
          defaultIconColor: '#10B981',
        };
      case 'rejected':
        return {
          card: statCardStyles.statCardRejected,
          value: statCardStyles.statValueRejected,
          label: statCardStyles.statLabelRejected,
          defaultIconColor: '#EF4444',
        };
      default:
        return {
          card: null,
          value: null,
          label: null,
          defaultIconColor: COLORS.green,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const finalIconColor = iconColor || variantStyles.defaultIconColor;

  return (
    <View style={[
      statCardStyles.statCard,
      variantStyles.card,
      containerStyle
    ]}>
      {IconComponent && (
        <IconComponent size={iconSize} color={finalIconColor} />
      )}
      <Text style={[statCardStyles.statValue, variantStyles.value, valueStyle]}>
        {value}
      </Text>
      <Text style={[statCardStyles.statLabel, variantStyles.label, labelStyle]}>
        {label}
      </Text>
    </View>
  );
};

export default StatCard;

