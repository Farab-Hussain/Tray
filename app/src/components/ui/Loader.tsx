import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { COLORS } from '../../constants/core/colors';
import { loaderStyles } from '../../constants/styles/loaderStyles';

type LoaderProps = {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  containerStyle?: any;
  textStyle?: any;
};

const Loader: React.FC<LoaderProps> = ({
  message = 'Loading...',
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

const styles = loaderStyles;

export default Loader;

