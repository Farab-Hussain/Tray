import React from 'react';
import { View, Text } from 'react-native';
import { CheckCircle, Clock, XCircle, UserCircle } from 'lucide-react-native';
import {
  consultantFlowStyles,
  pendingApprovalStyles,
} from '../../constants/styles/consultantFlowStyles';
import { COLORS } from '../../constants/core/colors';

type Status = 'no_profile' | 'pending' | 'approved' | 'rejected';

interface StatusBadgeProps {
  status: Status;
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'medium',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'approved':
        return {
          icon: (
            <CheckCircle
              size={size === 'large' ? 64 : size === 'medium' ? 20 : 16}
              color="#10B981"
            />
          ),
          text: 'APPROVED',
          backgroundColor: '#D1FAE5',
          textColor: '#059669',
        };
      case 'pending':
        return {
          icon: (
            <Clock
              size={size === 'large' ? 64 : size === 'medium' ? 20 : 16}
              color="#F59E0B"
            />
          ),
          text: 'PENDING',
          backgroundColor: '#FEF3C7',
          textColor: '#D97706',
        };
      case 'rejected':
        return {
          icon: (
            <XCircle
              size={size === 'large' ? 64 : size === 'medium' ? 20 : 16}
              color="#EF4444"
            />
          ),
          text: 'REJECTED',
          backgroundColor: '#FEE2E2',
          textColor: '#DC2626',
        };
      case 'no_profile':
      default:
        return {
          icon: (
            <UserCircle
              size={size === 'large' ? 64 : size === 'medium' ? 20 : 16}
              color={COLORS.green}
            />
          ),
          text: 'NO PROFILE',
          backgroundColor: '#F0FDF4',
          textColor: '#166534',
        };
    }
  };

  const config = getStatusConfig();
  const isLarge = size === 'large';

  if (isLarge) {
    return (
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        {showIcon && config.icon}
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: config.textColor,
            marginTop: 12,
          }}
        >
          {config.text}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        consultantFlowStyles.statusBadge,
        { backgroundColor: `${config.textColor}20` },
      ]}
    >
      <View style={consultantFlowStyles.statusContent}>
        {showIcon && config.icon}
        <Text
          style={[consultantFlowStyles.statusText, { color: config.textColor }]}
        >
          {config.text}
        </Text>
      </View>
    </View>
  );
};

interface StatusCardProps {
  status: Status;
  title: string;
  message: string;
  profile?: {
    fullName: string;
    category: string;
    experience: number;
  };
  reviewNotes?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  status,
  profile,
  reviewNotes,
}) => {
  const getStatusBadgeStyle = () => {
    switch (status) {
      case 'pending':
        return [
          pendingApprovalStyles.statusBadge,
          pendingApprovalStyles.statusBadgePending,
        ];
      case 'approved':
        return [
          pendingApprovalStyles.statusBadge,
          pendingApprovalStyles.statusBadgeApproved,
        ];
      case 'rejected':
        return [
          pendingApprovalStyles.statusBadge,
          pendingApprovalStyles.statusBadgeRejected,
        ];
      default:
        return pendingApprovalStyles.statusBadge;
    }
  };

  const getStatusTextStyle = () => {
    switch (status) {
      case 'pending':
        return [
          pendingApprovalStyles.statusBadgeText,
          pendingApprovalStyles.statusBadgeTextPending,
        ];
      case 'approved':
        return [
          pendingApprovalStyles.statusBadgeText,
          pendingApprovalStyles.statusBadgeTextApproved,
        ];
      case 'rejected':
        return [
          pendingApprovalStyles.statusBadgeText,
          pendingApprovalStyles.statusBadgeTextRejected,
        ];
      default:
        return pendingApprovalStyles.statusBadgeText;
    }
  };

  return (
    <View style={pendingApprovalStyles.card}>
      <View style={pendingApprovalStyles.cardHeader}>
        <Text style={pendingApprovalStyles.cardTitle}>Profile Status</Text>
        <View style={getStatusBadgeStyle()}>
          <Text style={getStatusTextStyle()}>{status.toUpperCase()}</Text>
        </View>
      </View>

      {profile && (
        <>
          <View style={pendingApprovalStyles.cardRow}>
            <Text style={pendingApprovalStyles.cardLabel}>Name:</Text>
            <Text style={pendingApprovalStyles.cardValue}>
              {profile.fullName}
            </Text>
          </View>
          <View style={pendingApprovalStyles.cardRow}>
            <Text style={pendingApprovalStyles.cardLabel}>Category:</Text>
            <Text style={pendingApprovalStyles.cardValue}>
              {profile.category}
            </Text>
          </View>
          <View style={pendingApprovalStyles.cardRow}>
            <Text style={pendingApprovalStyles.cardLabel}>Experience:</Text>
            <Text style={pendingApprovalStyles.cardValue}>
              {profile.experience} years
            </Text>
          </View>
        </>
      )}

      {reviewNotes && (
        <View style={pendingApprovalStyles.reviewNotesCard}>
          <Text style={pendingApprovalStyles.reviewNotesTitle}>
            Admin Feedback:
          </Text>
          <Text style={pendingApprovalStyles.reviewNotesText}>
            {reviewNotes}
          </Text>
        </View>
      )}
    </View>
  );
};
