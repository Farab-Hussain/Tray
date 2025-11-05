import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { screenStyles } from '../../constants/styles/screenStyles';
import { COLORS } from '../../constants/core/colors';
import { authStyles } from '../../constants/styles/authStyles';

type ScreenHeaderProps = {
  title: string | React.ReactNode;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  showBackButton?: boolean;
};

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  onBackPress,
  rightComponent,
  showBackButton = true,
}) => {
  return (
    <View style={screenStyles.header}>
      {showBackButton ? (
        <TouchableOpacity onPress={onBackPress}>
          <ChevronLeft color={COLORS.black} style={authStyles.back}/>
        </TouchableOpacity>
      ) : (
        <View style={screenStyles.spacer} />
      )}
      {typeof title === 'string' ? (
        <Text style={screenStyles.headerTitle}>{title}</Text>
      ) : (
        title
      )}
      {rightComponent ? rightComponent : <View style={screenStyles.spacer} />}
    </View>
  );
};

export default ScreenHeader;

