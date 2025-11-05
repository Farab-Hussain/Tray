import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/core/colors';

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  text: {
    marginTop: 16,
    color: COLORS.gray,
    fontSize: 16,
  },
});

export default Loader;

