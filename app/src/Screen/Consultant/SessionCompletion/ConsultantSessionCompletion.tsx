import React, { useState, useEffect } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity } from 'react-native';
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
import { AIProvider, AIService } from '../../../services/ai.service';
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
  const [prepLoading, setPrepLoading] = useState(false);
  const [sessionPrep, setSessionPrep] = useState<{
    profile_summary: string;
    risk_areas: string[];
    coaching_talking_points: string[];
    progress_metrics: string[];
  } | null>(null);

  const parsePossibleJSON = (text: string) => {
    const cleaned = (text || '')
      .trim()
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleaned || '{}');
  };

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

  const openProviderPicker = (
    title: string,
    action: (provider: AIProvider) => Promise<void> | void,
  ) => {
    Alert.alert(title, 'Choose AI provider', [
      { text: 'OpenAI', onPress: () => action('openai') },
      { text: 'Claude', onPress: () => action('claude') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleGenerateSessionPrep = async (provider: AIProvider) => {
    try {
      setPrepLoading(true);
      const result = await AIService.generateGeneric({
        provider,
        json_mode: true,
        max_tokens: 700,
        system_prompt:
          'You are a consultant session prep assistant. Return strict JSON only.',
        user_prompt: `Create prep notes for consultant session.
Context:
- student_name: ${studentName}
- service_title: ${serviceTitle}
- session_date: ${sessionDate}
- session_time: ${sessionTime}
- refund_requested: ${!!sessionCompletion?.refundRequested}
- payment_released: ${!!sessionCompletion?.paymentReleased}

Return JSON:
{
  "profile_summary": "short paragraph",
  "risk_areas": ["..."],
  "coaching_talking_points": ["..."],
  "progress_metrics": ["..."]
}`,
      });

      const parsed = parsePossibleJSON(result?.output || '{}');
      setSessionPrep({
        profile_summary:
          parsed?.profile_summary || 'No profile summary generated.',
        risk_areas: Array.isArray(parsed?.risk_areas) ? parsed.risk_areas : [],
        coaching_talking_points: Array.isArray(parsed?.coaching_talking_points)
          ? parsed.coaching_talking_points
          : [],
        progress_metrics: Array.isArray(parsed?.progress_metrics)
          ? parsed.progress_metrics
          : [],
      });
    } catch (error: any) {
      if (__DEV__) {
        console.error('Session prep AI failed:', error);
      }
      Alert.alert(
        'AI Error',
        error?.response?.data?.detail ||
          error?.message ||
          'Failed to generate session prep insights.',
      );
    } finally {
      setPrepLoading(false);
    }
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

          <View style={sessionCompletionStyles.aiPanel}>
            <Text style={sessionCompletionStyles.aiPanelTitle}>
              AI Session Prep Assistant
            </Text>
            <Text style={sessionCompletionStyles.aiPanelText}>
              Summarizes client context, flags risk areas, and suggests coaching talking points.
            </Text>
            <TouchableOpacity
              style={[
                sessionCompletionStyles.aiActionButton,
                prepLoading && sessionCompletionStyles.aiActionButtonDisabled,
              ]}
              onPress={() =>
                openProviderPicker(
                  'AI Session Prep Assistant',
                  handleGenerateSessionPrep,
                )
              }
              disabled={prepLoading}
              activeOpacity={0.8}
            >
              <Text style={sessionCompletionStyles.aiActionButtonText}>
                {prepLoading ? 'Generating...' : 'Generate AI Session Prep'}
              </Text>
            </TouchableOpacity>

            {sessionPrep ? (
              <View style={sessionCompletionStyles.aiResultBox}>
                <Text style={sessionCompletionStyles.aiResultHeading}>
                  Profile Summary
                </Text>
                <Text style={sessionCompletionStyles.aiResultText}>
                  {sessionPrep.profile_summary}
                </Text>

                <Text style={sessionCompletionStyles.aiResultHeading}>Risk Areas</Text>
                {sessionPrep.risk_areas.map((item, index) => (
                  <Text
                    key={`${item}-${index}`}
                    style={sessionCompletionStyles.aiResultText}
                  >
                    • {item}
                  </Text>
                ))}

                <Text style={sessionCompletionStyles.aiResultHeading}>
                  Coaching Talking Points
                </Text>
                {sessionPrep.coaching_talking_points.map((item, index) => (
                  <Text
                    key={`${item}-${index}`}
                    style={sessionCompletionStyles.aiResultText}
                  >
                    • {item}
                  </Text>
                ))}

                <Text style={sessionCompletionStyles.aiResultHeading}>
                  Progress Metrics
                </Text>
                {sessionPrep.progress_metrics.map((item, index) => (
                  <Text
                    key={`${item}-${index}`}
                    style={sessionCompletionStyles.aiResultText}
                  >
                    • {item}
                  </Text>
                ))}
              </View>
            ) : null}
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
