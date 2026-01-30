import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { FileText, Pencil, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react-native';
import { COLORS } from '../../constants/core/colors';
import { getStatusColor } from '../../utils/statusUtils';
import { consultantApplicationsScreenStyles as styles } from '../../constants/styles/consultantApplicationsScreenStyles';

interface ConsultantApplicationCardProps {
  application: any;
  onEdit?: (application: any) => void;
  onDelete?: (application: any) => void;
  isLoadingServiceDetails?: boolean;
  loadingServiceId?: string;
  isSubmitting?: boolean;
  mutatingApplicationId?: string;
}

const ConsultantApplicationCard: React.FC<ConsultantApplicationCardProps> = ({
  application,
  onEdit,
  onDelete,
  isLoadingServiceDetails = false,
  loadingServiceId,
  isSubmitting = false,
  mutatingApplicationId,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} color={COLORS.green} />;
      case 'pending': return <Clock size={16} color={COLORS.orange} />;
      case 'rejected': return <XCircle size={16} color={COLORS.red} />;
      default: return <FileText size={16} color={COLORS.gray} />;
    }
  };

  return (
    <View style={styles.applicationCard}>
      <View style={styles.cardHeader}>
        <FileText size={20} color={COLORS.green} />
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(application.status, 'service')}20` }]}>
          <View style={styles.statusContent}>
            {getStatusIcon(application.status)}
            <Text style={[styles.statusText, { color: getStatusColor(application.status, 'service') }]}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.cardTitle}>
        {application.type === 'new' || application.type === 'update'
          ? application.customService?.title
          : application.existingServiceTitle || 'Service Application'}
      </Text>
      
      {(application.type === 'new' || application.type === 'update') && application.customService && (
        <>
          {application.customService.imageUrl && (
            <View style={styles.serviceImageContainer}>
              <Image 
                source={{ uri: application.customService.imageUrl! }} 
                style={styles.serviceImage}
                resizeMode="cover"
              />
            </View>
          )}
          <Text style={styles.cardDescription} numberOfLines={2}>
            {application.customService.description}
          </Text>
          <View style={styles.cardDetails}>
            <Text style={styles.cardDetailText}>
              ${application.customService.price} • {application.customService.duration} mins
            </Text>
          </View>
        </>
      )}

      {application.reviewNotes && (
        <View style={styles.reviewNotes}>
          <Text style={styles.reviewNotesLabel}>Review Notes:</Text>
          <Text style={styles.reviewNotesText}>{application.reviewNotes}</Text>
        </View>
      )}

      {(application.status === 'pending' || application.status === 'approved') && (
        <View style={styles.cardActions}>
          {/* Only show Edit button for approved services */}
          {application.status === 'approved' && (application.type === 'new' || application.type === 'update') && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEdit?.(application)}
              disabled={isLoadingServiceDetails || isSubmitting}
            >
              {loadingServiceId === application.id && isLoadingServiceDetails ? (
                <ActivityIndicator size="small" color={COLORS.green} />
              ) : (
                <>
                  <Pencil size={16} color={COLORS.green} />
                  <Text style={styles.editButtonText}>Edit</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.deleteButton,
              application.status === 'approved' && styles.deleteButtonEmphasis,
            ]}
            onPress={() => onDelete?.(application)}
            disabled={isSubmitting}
          >
            {mutatingApplicationId === application.id && isSubmitting ? (
              <ActivityIndicator size="small" color={COLORS.red} />
            ) : (
              <>
                <Trash2 size={16} color={COLORS.red} />
                <Text
                  style={[
                    styles.deleteButtonText,
                    application.status === 'approved' && styles.deleteButtonTextStrong,
                  ]}
                >
                  Delete
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ConsultantApplicationCard;
