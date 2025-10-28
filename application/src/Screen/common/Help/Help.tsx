import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { COLORS } from '../../../constants/core/colors';
import { Mail } from 'lucide-react-native';

const Help = ({ navigation }: any) => {

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader title="Help & Support" onBackPress={() => navigation.goBack()} />
      
      <ScrollView
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={screenStyles.container}>
          <Text style={screenStyles.heading}>Help & Support</Text>
          <Text style={screenStyles.helpText}>
            Need help? We're here to assist you.
          </Text>

          {/* Email Support Only */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Get Help</Text>
            <View style={styles.emailCard}>
              <View style={styles.contactIcon}>
                <Mail size={24} color={COLORS.green} />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactTitle}>Email Support</Text>
                <Text style={styles.emailAddress}>support@tray.com</Text>
                <Text style={styles.responseTime}>We'll get back to you within 24 hours</Text>
              </View>
            </View>
          </View>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.appInfoText}>Tray App v1.0.0</Text>
            <Text style={styles.appInfoText}>© 2024 Tray. All rights reserved.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 16,
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.chatInputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  emailAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.green,
    marginBottom: 4,
  },
  responseTime: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  appInfo: {
    marginTop: 32,
    alignItems: 'center',
    paddingVertical: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
});

export default Help;
