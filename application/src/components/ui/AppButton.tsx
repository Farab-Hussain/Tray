import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { COLORS } from '../../constants/core/colors';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
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

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    flexDirection: 'row',
    minHeight: 48,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabled: {
    backgroundColor: COLORS.blackTransparent,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginHorizontal: 6,
  },
  iconText: {
    marginHorizontal: 6,
  },
});

export default AppButton;
