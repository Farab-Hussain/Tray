import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import AppButton from '../../../components/ui/AppButton';
import { SessionCompletionService, SessionCompletion } from '../../../services/sessionCompletion.service';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { reviewStyles } from '../../../constants/styles/reviewStyles';
import { sessionRatingStyles } from '../../../constants/styles/sessionRatingStyles';

interface SessionRatingScreenProps {
  route: {
    params: {
      sessionCompletionId: string;
      consultantName: string;
      serviceTitle: string;
      sessionDate: string;
      sessionTime: string;
    };
  };
  navigation: any;
}

const SessionRatingScreen: React.FC<SessionRatingScreenProps> = ({ route, navigation }) => {
  const { sessionCompletionId, consultantName, serviceTitle, sessionDate, sessionTime } = route.params;
  
  const [_sessionCompletion, setSessionCompletion] = useState<SessionCompletion | null>(null);
  const [consultantRating, setConsultantRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [consultantFeedback, setConsultantFeedback] = useState('');
  const [_serviceFeedback, _setServiceFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'consultant' | 'service' | 'complete'>('consultant');

  useEffect(() => {
    const fetchSessionCompletion = async () => {
      try {
        const completion = await SessionCompletionService.getSessionCompletion(sessionCompletionId);
        setSessionCompletion(completion);
        
        // Set current step based on completion status
        if (completion.consultantRating && completion.serviceRating) {
          setCurrentStep('complete');
        } else if (completion.consultantRating) {
          setCurrentStep('service');
          setConsultantRating(completion.consultantRating);
          setConsultantFeedback(completion.consultantFeedback || '');
        }
      } catch (error) {
        console.error('Error fetching session completion:', error);
        Alert.alert('Error', 'Failed to load session details');
      }
    };

    fetchSessionCompletion();
  }, [sessionCompletionId]);

  const handleConsultantRating = async () => {
    if (consultantRating === 0) {
      Alert.alert('Rating Required', 'Please rate the consultant before proceeding');
      return;
    }

    setLoading(true);
    try {
      await SessionCompletionService.rateConsultant(sessionCompletionId, consultantRating, consultantFeedback);
      setCurrentStep('service');
      Alert.alert('Success', 'Consultant rating submitted! Now please rate the service.');
    } catch (error) {
      console.error('Error rating consultant:', error);
      Alert.alert('Error', 'Failed to submit consultant rating');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceRating = async () => {
    if (serviceRating === 0) {
      Alert.alert('Rating Required', 'Please rate the service before proceeding');
      return;
    }

    setLoading(true);
    try {
      await SessionCompletionService.rateService(sessionCompletionId, serviceRating, '');
      
      // Both ratings completed - payment will be released
      Alert.alert(
        'Thank You!', 
        'Both ratings submitted successfully. Payment has been released to the consultant.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error rating service:', error);
      Alert.alert('Error', 'Failed to submit service rating');
    } finally {
      setLoading(false);
    }
  };

  const handleRefundRequest = () => {
    Alert.prompt(
      'Request Refund',
      'Please provide a reason for requesting a refund:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async (reason?: string) => {
            if (!reason || reason.trim().length === 0) {
              Alert.alert('Error', 'Please provide a reason for the refund request');
              return;
            }

            try {
              await SessionCompletionService.requestRefund(sessionCompletionId, reason);
              Alert.alert(
                'Refund Requested',
                'Your refund request has been submitted. The admin will review it and notify you of the decision.'
              );
            } catch (error) {
              console.error('Error requesting refund:', error);
              Alert.alert('Error', 'Failed to submit refund request');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const renderStars = (rating: number, onRatingChange: (rating: number) => void) => {
    return (
      <View style={sessionRatingStyles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onRatingChange(star)}
            style={sessionRatingStyles.starButton}
          >
            <Text style={star <= rating ? reviewStyles.starActive : reviewStyles.starInactive}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderConsultantRating = () => (
    <View style={sessionRatingStyles.ratingContainer}>
      <Text style={sessionRatingStyles.ratingTitle}>
        Rate Your Consultant
      </Text>
      
      <Text style={sessionRatingStyles.ratingSubtitle}>
        {consultantName}
      </Text>
      
      <Text style={reviewStyles.questionText}>
        How was your experience with the consultant?
      </Text>

      {renderStars(consultantRating, setConsultantRating)}

      <AppButton
        title="Continue to Service Rating"
        onPress={handleConsultantRating}
        disabled={loading || consultantRating === 0}
      />
    </View>
  );

  const renderServiceRating = () => (
    <View style={sessionRatingStyles.ratingContainer}>
      <Text style={sessionRatingStyles.ratingTitle}>
        Rate the Service
      </Text>
      
      <Text style={sessionRatingStyles.ratingSubtitle}>
        {serviceTitle}
      </Text>
      
      <Text style={reviewStyles.questionText}>
        How satisfied were you with the service provided?
      </Text>

      {renderStars(serviceRating, setServiceRating)}

      <AppButton
        title="Complete Rating"
        onPress={handleServiceRating}
        disabled={loading || serviceRating === 0}
      />
    </View>
  );

  const renderComplete = () => (
    <View style={sessionRatingStyles.completeContainer}>
      <Text style={sessionRatingStyles.completeTitle}>
        Session Completed
      </Text>
      
      <Text style={reviewStyles.questionText}>
        Thank you for rating your session. Payment has been released to the consultant.
      </Text>

      <AppButton
        title="Request Refund"
        onPress={handleRefundRequest}
        style={reviewStyles.warningButton}
      />

      <AppButton
        title="Back to Home"
        onPress={() => navigation.goBack()}
        style={reviewStyles.successButton}
      />
    </View>
  );

  return (
    <SafeAreaView style={screenStyles.safeArea} edges={['top']}>
      <ScreenHeader title="Rate Your Session" />
      
      <ScrollView style={screenStyles.scrollViewContainer}>
        <View style={sessionRatingStyles.sessionInfoContainer}>
          <Text style={sessionRatingStyles.sessionInfoText}>
            Session: {sessionDate} at {sessionTime}
          </Text>
          
          {currentStep === 'consultant' && renderConsultantRating()}
          {currentStep === 'service' && renderServiceRating()}
          {currentStep === 'complete' && renderComplete()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SessionRatingScreen;
