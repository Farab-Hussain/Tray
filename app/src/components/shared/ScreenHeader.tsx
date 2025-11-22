import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
  const navigation = useNavigation();
  
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={screenStyles.header}>
      {showBackButton ? (
        <TouchableOpacity onPress={handleBackPress} activeOpacity={0.7}>
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

