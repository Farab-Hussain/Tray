import React from 'react';
import {
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { COLORS } from '../../constants/core/colors';
import { appButtonStyles } from '../../constants/styles/appButtonStyles';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  iconSize?: number;
  iconColor?: string;
  iconLeft?: boolean;
}

const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  disabled,
  loading,
  icon: IconComponent,
  iconSize = 20,
  iconColor = COLORS.white,
  iconLeft = true,
}) => (
  <TouchableOpacity
    style={[styles.button, style, disabled && styles.disabled]}
    onPress={onPress}
    activeOpacity={0.7}
    disabled={disabled || loading}
  >
    {loading ? (
      <ActivityIndicator color={COLORS.white} />
    ) : (
      <View style={styles.contentRow}>
        {IconComponent && iconLeft && (
          <IconComponent
            size={iconSize}
            color={iconColor}
            style={styles.icon}
          />
        )}
        <Text style={[styles.buttonText, textStyle]}>{title}</Text>
        {IconComponent && !iconLeft && (
          <IconComponent
            size={iconSize}
            color={iconColor}
            style={styles.icon}
          />
        )}
      </View>
    )}
  </TouchableOpacity>
);

const styles = appButtonStyles;

export default AppButton;
