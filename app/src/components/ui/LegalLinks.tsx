import React from 'react';
import { Linking, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { COLORS } from '../../constants/core/colors';
import { LEGAL_URLS } from '../../constants/core/legal';

type LegalLinksProps = {
  style?: StyleProp<ViewStyle>;
};

const openUrl = async (url: string) => {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  } catch {
    // ignore — user can open links from Help if browser fails
  }
};

const LegalLinks = ({ style }: LegalLinksProps) => (
  <View style={[styles.container, style]}>
    <Text style={styles.text}>
      By using FairChance, you agree to our{' '}
      <Text style={styles.link} onPress={() => openUrl(LEGAL_URLS.termsOfService)}>
        Terms of Service
      </Text>
      {' and '}
      <Text style={styles.link} onPress={() => openUrl(LEGAL_URLS.privacyPolicy)}>
        Privacy Policy
      </Text>
      .
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  text: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  link: {
    color: COLORS.green,
    fontWeight: '600',
  },
});

export default LegalLinks;
