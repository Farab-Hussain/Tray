import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
} from 'react-native';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { Briefcase, Plus, FileText, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../../../constants/core/colors';
import { recruiterJobsStyles } from '../../../constants/styles/recruiterJobsStyles';

const RecruiterJobs = ({ navigation }: any) => {
  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader title="Jobs" onBackPress={() => navigation.goBack()} />
      
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={recruiterJobsStyles.container}>
          <TouchableOpacity
            style={recruiterJobsStyles.listItem}
            onPress={() => navigation.navigate('RecruiterMyJobs')}
            activeOpacity={0.7}
          >
            <View style={recruiterJobsStyles.listItemLeft}>
              <View style={recruiterJobsStyles.iconCircle}>
                <Briefcase size={28} color={COLORS.green} />
              </View>
              <Text style={recruiterJobsStyles.listText}>My Jobs</Text>
            </View>
            <ChevronRight size={24} color={COLORS.blackTransparent} />
          </TouchableOpacity>

          <TouchableOpacity
            style={recruiterJobsStyles.listItem}
            onPress={() => navigation.navigate('RecruiterPostJob')}
            activeOpacity={0.7}
          >
            <View style={recruiterJobsStyles.listItemLeft}>
              <View style={recruiterJobsStyles.iconCircle}>
                <Plus size={28} color={COLORS.green} />
              </View>
              <Text style={recruiterJobsStyles.listText}>Post a Job</Text>
            </View>
            <ChevronRight size={24} color={COLORS.blackTransparent} />
          </TouchableOpacity>

          <TouchableOpacity
            style={recruiterJobsStyles.listItem}
            onPress={() => navigation.navigate('RecruiterAllApplications')}
            activeOpacity={0.7}
          >
            <View style={recruiterJobsStyles.listItemLeft}>
              <View style={recruiterJobsStyles.iconCircle}>
                <FileText size={28} color={COLORS.green} />
              </View>
              <Text style={recruiterJobsStyles.listText}>All Applications</Text>
            </View>
            <ChevronRight size={24} color={COLORS.blackTransparent} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RecruiterJobs;

