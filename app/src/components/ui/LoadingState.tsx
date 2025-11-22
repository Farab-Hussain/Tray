import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { COLORS } from '../../constants/core/colors';
import { loadingStateStyles as styles } from '../../constants/styles/loadingStateStyles';

type LoadingStateProps = {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  containerStyle?: any;
  textStyle?: any;
};

const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  size = 'large',
  color = COLORS.green,
  containerStyle,
  textStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={[styles.text, textStyle]}>{message}</Text>}
    </View>
  );
};

export default LoadingState;

