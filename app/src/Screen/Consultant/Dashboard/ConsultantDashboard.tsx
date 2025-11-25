import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, ScrollView } from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { Profile } from '../../../constants/styles/profile';
import ProfileList from '../../../components/ui/ProfileList';
import { COLORS } from '../../../constants/core/colors';
import { User, Star, Briefcase, Calendar, CreditCard, Wallet } from 'lucide-react-native';

const ConsultantDashboard = ({ navigation }: any) => {
  const dashboardMenuItems = [
    {
      id: 1,
      icon: User,
      text: 'My Clients',
      route: 'MyClients',
    },
    {
      id: 2,
      icon: Star,
      text: 'My Reviews',
      route: 'MyReviews',
    },
    {
      id: 3,
      icon: Briefcase,
      text: 'My Services',
      route: 'ConsultantServices',
    },
    {
      id: 4,
      icon: Calendar,
      text: 'Availability',
      route: 'ConsultantAvailability',
    },
    {
      id: 5,
      icon: CreditCard,
      text: 'Earnings',
      route: 'Earnings',
    },
    {
      id: 6,
      icon: Wallet,
      text: 'Payment Setup',
      route: 'StripePaymentSetup',
    },
  ];

  const handlePress = (route: string) => {
    switch (route) {
      case 'MyClients':
        navigation.navigate('MyClients');
        break;
      case 'MyReviews':
        navigation.navigate('ConsultantReviews');
        break;
      case 'ConsultantServices':
        navigation.navigate('ConsultantServices');
        break;
      case 'ConsultantAvailability':
        navigation.navigate('ConsultantAvailability');
        break;
      case 'Earnings':
        navigation.navigate('Earnings');
        break;
      case 'StripePaymentSetup':
        navigation.navigate('StripePaymentSetup');
        break;
      default:
        navigation.navigate(route);
        break;
    }
  };

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader title="Dashboard" onBackPress={() => navigation.goBack()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={Profile.container}>
          <View style={Profile.listContainer}>
            {dashboardMenuItems.map((item) => (
              <ProfileList
                key={item.id}
                icon={<item.icon size={24} color={COLORS.green} strokeWidth={1.5} />}
                text={item.text}
                onPress={() => handlePress(item.route)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ConsultantDashboard;

