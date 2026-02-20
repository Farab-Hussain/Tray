import { Image, Text, View, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { customCard } from '../../constants/styles/customCard';
import AppButton from './AppButton';
import { MessageCircle, Phone, Video, Star, UserRound } from 'lucide-react-native';
import { COLORS } from '../../constants/core/colors';

type TopConsultantCardProps = {
  name: string;
  title: string;
  description: string;
  avatarUri?: ImageSourcePropType;
  rating: number;
  consultantId?: string;
  navigation: any;
  onChatPress?: () => void;
  onCallPress?: () => void;
  onVideoCallPress?: () => void;
};

const TopConsultantCard: React.FC<TopConsultantCardProps> = ({
  name,
  title,
  description,
  avatarUri,
  rating,
  consultantId,
  navigation,
  onChatPress,
  onCallPress,
  onVideoCallPress,
}) => {
  return (
    <View style={customCard.card}>
      {/* Left side: Avatar + Info + Button + Contact Icons */}
      <View style={customCard.leftBox}>
        {avatarUri ? (
          <Image
            source={avatarUri}
            style={customCard.avatar}
            key={typeof avatarUri === 'object' && 'uri' in avatarUri ? avatarUri.uri : undefined}
          />
        ) : (
          <View
            style={[
              customCard.avatar,
              { backgroundColor: '#A5AFBD', alignItems: 'center', justifyContent: 'center' },
            ]}
          >
            <UserRound size={22} color={COLORS.gray} />
          </View>
        )}

        <Text style={customCard.cardTitle}>{name}</Text>
        <Text style={customCard.cardSubtitle}>{title}</Text>

          <AppButton
            title="Book Now"
            onPress={() => {
                            if (__DEV__) {
                console.log('📍 Book Now Clicked - TopConsultantCard')
              };
                            if (__DEV__) {
                console.log('🆔 Consultant ID:', consultantId)
              };
                            if (__DEV__) {
                console.log('👤 Consultant Name:', name)
              };
                            if (__DEV__) {
                console.log('📂 Consultant Category:', title)
              };
              navigation.navigate('MainTabs', {
                screen: 'Services',
                params: {
                  screen: 'ServicesScreen',
                  params: {
                    consultantId,
                    consultantName: name,
                    consultantCategory: title
                  }
                }
              });
            }}
            style={customCard.cardButton}
            textStyle={customCard.buttonText}
          />

        {/* Contact Icons */}
        <View style={customCard.iconBox}>
          <TouchableOpacity 
            style={customCard.iconCircle}
            onPress={onChatPress || (() => navigation.navigate('ChatScreen', {
              consultant: {
                name: name,
                title: title,
                avatar: avatarUri,
                isOnline: true
              }
            }))}
          >
            <MessageCircle size={18} color="green" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={customCard.iconCircle}
            onPress={onCallPress || (() => navigation.navigate('CallingScreen'))}
          >
            <Phone size={18} color="green" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={customCard.iconCircle}
            onPress={onVideoCallPress || (() => navigation.navigate('VideoCallingScreen'))}
          >
            <Video size={18} color="green" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Right side: Description + Badge + Rating */}
      <View style={customCard.rightBox}>
        <Image
          source={require('../../assets/image/Badge.png')}
          style={customCard.badge}
        />

        <Text style={customCard.description}>{description}</Text>

        {/* Rating */}
        <View style={customCard.ratingBox}>
          {Array.from({ length: 5 }).map((_, i) => {
            const size = 18;
            const emptyColor = '#E5E5E5';
            const fillColor = 'gold';
            const raw = Number.isFinite(rating as number) ? (rating as number) : 0;
            const fullCount = Math.floor(raw);
            const hasHalf = raw < 5 && raw - fullCount > 0;
            const isFull = i < fullCount || (raw === 5 && i < 5);
            const isHalf = i === fullCount && hasHalf;
            return (
              <View key={i} style={{ position: 'relative', width: size, height: size }}>
                <Star size={size} color={emptyColor} />
                {(isFull || isHalf) && (
                  <View style={{ position: 'absolute', left: 0, top: 0, width: isFull ? size : size / 2, height: size, overflow: 'hidden' }}>
                    <Star size={size} color={fillColor} fill={fillColor} />
                  </View>
                )}
              </View>
            );
          })}
          <Text style={customCard.ratingText}>({rating})</Text>
        </View>
      </View>
    </View>
  );
};

export default TopConsultantCard;
