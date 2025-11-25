import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../../../components/ui/AppButton';
import { SessionCompletionService, RefundRequest } from '../../../services/sessionCompletion.service';
import { EmailService } from '../../../services/email.service';
import { UserService } from '../../../services/user.service';
import { refundReviewStyles } from '../../../constants/styles/refundReviewStyles';

interface AdminRefundReviewProps {
  navigation: any;
}

const AdminRefundReview: React.FC<AdminRefundReviewProps> = ({ navigation: _navigation }) => {
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchRefundRequests();
  }, []);

  const fetchRefundRequests = async () => {
    try {
      const requests = await SessionCompletionService.getAllRefundRequests();
      setRefundRequests(requests);
    } catch (error) {
            if (__DEV__) {
        console.error('Error fetching refund requests:', error)
      };
      Alert.alert('Error', 'Failed to load refund requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRequest = (request: RefundRequest) => {
    setSelectedRequest(request);
    setAdminNotes('');
  };

  const handleApproveRefund = () => {
    if (!selectedRequest) return;

    Alert.alert(
      'Approve Refund',
      `Are you sure you want to approve the refund of $${selectedRequest.amount}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await SessionCompletionService.reviewRefundRequest(
                selectedRequest.id,
                'approved',
                adminNotes
              );

              // Fetch user data for email notifications
              const [studentData, consultantData] = await Promise.all([
                UserService.getUserById(selectedRequest.studentId),
                UserService.getUserById(selectedRequest.consultantId),
              ]);

              const studentEmail = studentData?.email || 'student@example.com';
              const studentName = studentData?.name || studentData?.username || 'Student';
              const consultantEmail = consultantData?.email || 'consultant@example.com';
              const consultantName = consultantData?.name || consultantData?.username || 'Consultant';

              // Send email notifications
              await EmailService.sendRefundDecisionToStudent(
                studentEmail,
                studentName,
                'approved',
                selectedRequest.amount,
                adminNotes
              );

              await EmailService.sendRefundDecisionToConsultant(
                consultantEmail,
                consultantName,
                studentName,
                'approved',
                selectedRequest.amount,
                adminNotes
              );

              Alert.alert('Success', 'Refund approved and notifications sent');
              setSelectedRequest(null);
              fetchRefundRequests();
            } catch (error) {
                            if (__DEV__) {
                console.error('Error approving refund:', error)
              };
              Alert.alert('Error', 'Failed to approve refund');
            }
          }
        }
      ]
    );
  };

  const handleDenyRefund = () => {
    if (!selectedRequest) return;

    Alert.alert(
      'Deny Refund',
      `Are you sure you want to deny the refund request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deny',
          style: 'destructive',
          onPress: async () => {
            try {
              await SessionCompletionService.reviewRefundRequest(
                selectedRequest.id,
                'denied',
                adminNotes
              );

              // Fetch user data for email notifications
              const [studentData, consultantData] = await Promise.all([
                UserService.getUserById(selectedRequest.studentId),
                UserService.getUserById(selectedRequest.consultantId),
              ]);

              const studentEmail = studentData?.email || 'student@example.com';
              const studentName = studentData?.name || studentData?.username || 'Student';
              const consultantEmail = consultantData?.email || 'consultant@example.com';
              const consultantName = consultantData?.name || consultantData?.username || 'Consultant';

              // Send email notifications
              await EmailService.sendRefundDecisionToStudent(
                studentEmail,
                studentName,
                'denied',
                selectedRequest.amount,
                adminNotes
              );

              await EmailService.sendRefundDecisionToConsultant(
                consultantEmail,
                consultantName,
                studentName,
                'denied',
                selectedRequest.amount,
                adminNotes
              );

              Alert.alert('Success', 'Refund denied and notifications sent');
              setSelectedRequest(null);
              fetchRefundRequests();
            } catch (error) {
                            if (__DEV__) {
                console.error('Error denying refund:', error)
              };
              Alert.alert('Error', 'Failed to deny refund');
            }
          }
        }
      ]
    );
  };

  const renderRefundRequestCard = (request: RefundRequest) => (
    <TouchableOpacity
      key={request.id}
      style={[
        refundReviewStyles.requestCard,
        request.status === 'pending' ? refundReviewStyles.requestCardPending :
        request.status === 'consultant_responded' ? refundReviewStyles.requestCardResponded :
        refundReviewStyles.requestCardApproved
      ]}
      onPress={() => handleReviewRequest(request)}
    >
      <Text style={refundReviewStyles.requestTitle}>
        Refund Request #{request.id.slice(-8)}
      </Text>
      <Text style={refundReviewStyles.requestText}>
        Amount: ${request.amount}
      </Text>
      <Text style={refundReviewStyles.requestText}>
        Status: {request.status.replace('_', ' ').toUpperCase()}
      </Text>
      <Text style={refundReviewStyles.requestDate}>
        Requested: {new Date(request.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const renderRequestDetails = () => {
    if (!selectedRequest) return null;

    return (
      <View style={refundReviewStyles.detailsContainer}>
        <Text style={refundReviewStyles.detailsTitle}>
          Refund Request Details
        </Text>

        <View style={refundReviewStyles.detailsSection}>
          <Text style={refundReviewStyles.detailsSectionTitle}>
            Student Reason:
          </Text>
          <Text style={refundReviewStyles.detailsText}>
            {selectedRequest.reason}
          </Text>
        </View>

        {selectedRequest.consultantResponse && (
          <View style={refundReviewStyles.detailsSection}>
            <Text style={refundReviewStyles.detailsSectionTitle}>
              Consultant Response:
            </Text>
            <Text style={refundReviewStyles.detailsText}>
              {selectedRequest.consultantResponse}
            </Text>
          </View>
        )}

        <View style={refundReviewStyles.detailsSection}>
          <Text style={refundReviewStyles.detailsSectionTitle}>
            Admin Notes:
          </Text>
          <TextInput
            style={refundReviewStyles.detailsText}
            placeholder="Add your notes about this refund request..."
            value={adminNotes}
            onChangeText={setAdminNotes}
            multiline
          />
        </View>

        <View style={refundReviewStyles.actionButtons}>
          <AppButton
            title="Approve Refund"
            onPress={handleApproveRefund}
            style={refundReviewStyles.approveButton}
          />
          <AppButton
            title="Deny Refund"
            onPress={handleDenyRefund}
            style={refundReviewStyles.rejectButton}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={refundReviewStyles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={refundReviewStyles.header}>
          <Text style={refundReviewStyles.headerTitle}>Refund Review</Text>
        </View>
        
        <ScrollView style={refundReviewStyles.content} keyboardShouldPersistTaps="handled">
        <Text style={refundReviewStyles.detailsTitle}>
          Pending Refund Requests ({refundRequests.length})
        </Text>

        {loading ? (
          <Text style={refundReviewStyles.emptyStateText}>
            Loading refund requests...
          </Text>
        ) : refundRequests.length === 0 ? (
          <Text style={refundReviewStyles.emptyStateText}>
            No pending refund requests
          </Text>
        ) : (
          <>
            {refundRequests.map(renderRefundRequestCard)}
            {renderRequestDetails()}
          </>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AdminRefundReview;
