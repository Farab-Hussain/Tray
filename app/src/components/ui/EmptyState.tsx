import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { COLORS } from '../../constants/core/colors';
import { emptyStateStyles as styles } from '../../constants/styles/emptyStateStyles';

type EmptyStateProps = {
  icon?: LucideIcon;
  iconSize?: number;
  iconColor?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  containerStyle?: any;
};

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  iconSize = 64,
  iconColor = COLORS.gray,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  containerStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {Icon && <Icon size={iconSize} color={iconColor} />}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          {ActionIcon && <ActionIcon size={20} color={COLORS.white} />}
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default EmptyState;

