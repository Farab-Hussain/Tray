import React, { useState, useEffect } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import AppButton from '../../../components/ui/AppButton';
import {
  SessionCompletionService,
  SessionCompletion,
} from '../../../services/sessionCompletion.service';
import { EmailService } from '../../../services/email.service';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { sessionCompletionStyles } from '../../../constants/styles/sessionCompletionStyles';
import { logger } from '../../../utils/logger';

interface ConsultantSessionCompletionProps {
  route: {
    params: {
      sessionCompletionId: string;
      studentName: string;
      serviceTitle: string;
      sessionDate: string;
      sessionTime: string;
    };
  };
  navigation: any;
}

const ConsultantSessionCompletion: React.FC<
  ConsultantSessionCompletionProps
> = ({ route, navigation }) => {
  const {
    sessionCompletionId,
    studentName,
    serviceTitle,
    sessionDate,
    sessionTime,
  } = route.params;

  const [sessionCompletion, setSessionCompletion] =
    useState<SessionCompletion | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSessionCompletion = async () => {
      try {
        const completion = await SessionCompletionService.getSessionCompletion(
          sessionCompletionId,
        );
        setSessionCompletion(completion);
      } catch (error) {
                if (__DEV__) {
          logger.error('Error fetching session completion:', error)
        };
        Alert.alert('Error', 'Failed to load session details');
      }
    };

    fetchSessionCompletion();
  }, [sessionCompletionId]);

  const handleEndSession = () => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end this session? The student will be asked to rate their experience.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await SessionCompletionService.completeSession(
                sessionCompletionId,
                sessionCompletion?.bookingId || '',
              );

              // Send email notification to student
              await EmailService.sendSessionCompletionToStudent(
                'student@example.com', // This should be student's actual email
                studentName,
                'Consultant Name', // This should be consultant's actual name
                serviceTitle,
                sessionDate,
                sessionTime,
              );

              Alert.alert(
                'Session Ended',
                'The session has been ended. The student will receive an email to rate their experience.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ],
              );
            } catch (error) {
                            if (__DEV__) {
                logger.error('Error ending session:', error)
              };
              Alert.alert('Error', 'Failed to end session');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleRefundResponse = () => {
    if (!sessionCompletion?.refundRequested) {
      Alert.alert(
        'No Refund Request',
        'There is no pending refund request for this session.',
      );
      return;
    }

    Alert.prompt(
      'Respond to Refund Request',
      "Please provide your response to the student's refund request:",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Response',
          onPress: async (response?: string) => {
            if (!response || response.trim().length === 0) {
              Alert.alert('Error', 'Please provide a response');
              return;
            }

            try {
              await SessionCompletionService.respondToRefundRequest(
                sessionCompletionId,
                response,
              );

              // Send email notification to admin
              await EmailService.sendConsultantResponseToAdmin(
                sessionCompletionId,
                'Consultant Name', // This should be consultant's actual name
                studentName,
                response,
              );

              Alert.alert(
                'Response Submitted',
                'Your response has been submitted to the admin for review.',
              );
            } catch (error) {
                            if (__DEV__) {
                logger.error('Error submitting response:', error)
              };
              Alert.alert('Error', 'Failed to submit response');
            }
          },
        },
      ],
      'plain-text',
    );
  };

  return (
    <SafeAreaView style={screenStyles.safeArea} edges={['top']}>
      <ScreenHeader title="Session Management" />

      <ScrollView style={screenStyles.scrollViewContainer}>
        <View style={sessionCompletionStyles.container}>
          <View style={sessionCompletionStyles.sessionDetailsContainer}>
            <Text style={sessionCompletionStyles.title}>
              Session Details
            </Text>
            <Text style={sessionCompletionStyles.infoText}>
              <Text style={sessionCompletionStyles.boldText}>Student:</Text> {studentName}
            </Text>
            <Text style={sessionCompletionStyles.infoText}>
              <Text style={sessionCompletionStyles.boldText}>Service:</Text>{' '}
              {serviceTitle}
            </Text>
            <Text style={sessionCompletionStyles.infoText}>
              <Text style={sessionCompletionStyles.boldText}>Date:</Text> {sessionDate}
            </Text>
            <Text style={sessionCompletionStyles.infoText}>
              <Text style={sessionCompletionStyles.boldText}>Time:</Text> {sessionTime}
            </Text>
            <Text style={sessionCompletionStyles.infoText}>
              <Text style={sessionCompletionStyles.boldText}>Status:</Text>{' '}
              {sessionCompletion?.paymentReleased
                ? 'Completed & Paid'
                : 'In Progress'}
            </Text>
          </View>

          {sessionCompletion?.refundRequested && (
            <View style={sessionCompletionStyles.refundWarningContainer}>
              <Text style={sessionCompletionStyles.refundWarningTitle}>
                ⚠️ Refund Request Pending
              </Text>
              <Text style={sessionCompletionStyles.refundWarningText}>
                Student Reason: {sessionCompletion.refundReason}
              </Text>
              <AppButton
                title="Respond to Refund Request"
                onPress={handleRefundResponse}
                style={sessionCompletionStyles.refundButton}
              />
            </View>
          )}

          {!sessionCompletion?.paymentReleased && (
            <AppButton
              title="End Session"
              onPress={handleEndSession}
              disabled={loading}
              style={sessionCompletionStyles.endSessionButton}
            />
          )}

          {sessionCompletion?.paymentReleased && (
            <View style={sessionCompletionStyles.completedContainer}>
              <Text style={sessionCompletionStyles.completedTitle}>
                ✅ Session Completed
              </Text>
              <Text style={sessionCompletionStyles.completedText}>
                Payment has been released to your account.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ConsultantSessionCompletion;
