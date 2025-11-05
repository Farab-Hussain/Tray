import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text } from 'react-native';
import { screenStyles } from '../../../constants/styles/screenStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import ReviewCard from '../../../components/ui/ReviewCard';
import { COLORS } from '../../../constants/core/colors';

const AllReviews = ({ navigation, route }: any) => {
  const { consultantName, reviews = [] } = route.params || {};

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader 
        title={`Reviews for ${consultantName || 'Consultant'}`} 
        onBackPress={() => navigation.goBack()} 
      />

      <ScrollView
        style={screenStyles.scrollViewContainer}
        contentContainerStyle={screenStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>
          All Reviews ({reviews.length})
        </Text>

        {reviews.length > 0 ? (
          reviews.map((review: any) => (
            <ReviewCard key={review.id} review={review} />
          ))
        ) : (
          <Text style={styles.emptyText}>
            No reviews available for this consultant yet.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center' as const,
    marginTop: 40,
  },
};

export default AllReviews;

