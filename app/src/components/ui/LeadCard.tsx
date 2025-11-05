import { View, Text, Image } from 'react-native';
import { consultantStyles, consultantHome } from '../../constants/styles/consultantStyles';
import AppButton from './AppButton';

type LeadCardProps = {
  clientName: string;
  serviceNeeded: string;
  avatarUri: any;
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
  console.log(`🖼️ [LeadCard] Rendering card for client: ${clientName}, service: ${serviceNeeded}, avatarUri:`, avatarUri);
  
  return (
    <View style={[consultantStyles.leadCard, consultantHome.leadCardWrapper]}>
      <View style={consultantStyles.leadCardHeader}>
        <Image
          source={avatarUri}
          style={consultantStyles.leadProfileImage}
          onError={(error) => {
            console.log(`❌ [LeadCard] Failed to load image for ${clientName}:`, error);
          }}
          defaultSource={require('../../assets/image/avatar.png')}
        />
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
