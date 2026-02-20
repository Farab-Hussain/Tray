import { View, Text, Image } from 'react-native';
import { UserRound } from 'lucide-react-native';
import { consultantStyles, consultantHome } from '../../constants/styles/consultantStyles';
import AppButton from './AppButton';
import { COLORS } from '../../constants/core/colors';
import { logger } from '../../utils/logger';

type LeadCardProps = {
  clientName: string;
  serviceNeeded: string;
  avatarUri?: any;
  onAccept: () => void;
  onDecline: () => void;
};

const LeadCard = ({ 
  clientName, 
  serviceNeeded, 
  avatarUri, 
  onAccept, 
  onDecline 
}: LeadCardProps) => {
  logger.debug(
    `🖼️ [LeadCard] Rendering card for client: ${clientName}, service: ${serviceNeeded}, avatarUri:`,
    avatarUri,
  );
  
  return (
    <View style={[consultantStyles.leadCard, consultantHome.leadCardWrapper]}>
      <View style={consultantStyles.leadCardHeader}>
        {avatarUri ? (
          <Image
            source={avatarUri}
            style={consultantStyles.leadProfileImage}
            onError={(error) => {
              logger.warn(`❌ [LeadCard] Failed to load image for ${clientName}:`, error);
            }}
          />
        ) : (
          <View
            style={[
              consultantStyles.leadProfileImage,
              {
                backgroundColor: '#A5AFBD',
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            <UserRound size={20} color={COLORS.gray} />
          </View>
        )}
        <Text style={consultantStyles.HeaderTitle}>Matched</Text>
      </View>
      <View style={consultantStyles.leadCardContent}>
        <Text style={consultantStyles.leadCardContentTitle}>Client Name</Text>
        <Text style={consultantStyles.leadCardContentDescription}>
          {clientName}
        </Text>
      </View>
      <View style={consultantStyles.leadCardContent}>
        <Text style={consultantStyles.leadCardContentTitle}>Service Needed</Text>
        <Text style={consultantStyles.leadCardContentDescription}>
          {serviceNeeded}
        </Text>
      </View>
      <AppButton 
        title="Accept Request" 
        onPress={onAccept}
        style={consultantStyles.acceptRequestButton}
        textStyle={consultantStyles.acceptRequestButtonText}
      />
      <AppButton
        title="Decline"
        onPress={onDecline}
        style={consultantStyles.leadCardButton}
        textStyle={consultantStyles.declineButtonText}
      />
    </View>
  );
};

export default LeadCard;
