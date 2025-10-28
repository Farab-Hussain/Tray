import { Text, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { screenStyles } from '../../../constants/styles/screenStyles';
import HomeHeader from '../../../components/shared/HomeHeader';

const ConsultantNotifications = ({ navigation: _navigation }: any) => {
  return (
    <SafeAreaView style={screenStyles.safeArea} edges={['top']}>
      <HomeHeader />
      <ScrollView
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={screenStyles.container}>
          <Text style={screenStyles.heading}>Consultant Notifications</Text>
          <Text style={screenStyles.heading}>
            This is the Consultant Notifications screen. You can add your notification features here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ConsultantNotifications;
