import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text } from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ConsultantCard from '../../../components/ui/ConsultantCard';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { ConsultantService } from '../../../services/consultant.service';

const AllConsultants = ({ navigation }: any) => {
  const [consultants, setConsultants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        const response = await ConsultantService.getAllConsultants();
        const allConsultantsData = response?.consultants || [];
        
        // Backend now handles sorting by rating and reviews
        setConsultants(allConsultantsData);
      } catch (err) {
        console.error('Error fetching all consultants:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultants();
  }, []);

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader 
        title="All Consultants" 
        onBackPress={() => navigation.goBack()} 
      />

      <ScrollView 
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Text style={screenStyles.loadingText}>Loading consultants...</Text>
        ) : consultants.length > 0 ? (
          <View style={screenStyles.consultantList}>
            {consultants.map(item => (
              <View key={item.uid} style={screenStyles.consultantCardWrapper}>
                <ConsultantCard
                  name={item.name}
                  title={item.category || 'Consultant'}
                  avatarUri={
                    item.profileImage
                      ? { uri: item.profileImage }
                      : require('../../../assets/image/avatar.png')
                  }
                  rating={item.rating || 5}
                  onBookPress={() => {
                    console.log('📍 Book Now Clicked - AllConsultants Screen');
                    console.log('🆔 Consultant UID:', item.uid);
                    console.log('👤 Consultant Name:', item.name);
                    console.log('📂 Consultant Category:', item.category);
                    navigation.navigate('MainTabs', {
                      screen: 'Services',
                      params: {
                        screen: 'ServicesScreen',
                        params: {
                          consultantId: item.uid,
                          consultantName: item.name,
                          consultantCategory: item.category
                        }
                      }
                    });
                  }}
                  onChatPress={() => navigation.navigate('ChatScreen', {
                    consultant: {
                      name: item.name,
                      title: item.category || 'Consultant',
                      avatar: item.profileImage
                        ? { uri: item.profileImage }
                        : require('../../../assets/image/avatar.png'),
                      isOnline: true
                    }
                  })}
                  onCallPress={() => navigation.navigate('CallingScreen')}
                  onVideoCallPress={() => navigation.navigate('VideoCallingScreen')}
                />
              </View>
            ))}
          </View>
        ) : (
          <Text style={screenStyles.emptyStateText}>No consultants available</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AllConsultants;

