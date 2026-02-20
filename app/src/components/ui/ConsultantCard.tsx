import { Image, Text, View, TouchableOpacity, ImageSourcePropType } from 'react-native';
import AppButton from './AppButton';
import { MessageCircle, Phone, Video, Star, UserRound } from 'lucide-react-native';
import { consultantCard } from '../../constants/styles/consultantCard';
import { COLORS } from '../../constants/core/colors';

type ConsultantCardProps = {
  name: string;
  title: string;
  avatarUri?: ImageSourcePropType;
  rating: number;
  onBookPress?: () => void;
  onChatPress?: () => void;
  onCallPress?: () => void;
  onVideoCallPress?: () => void;
};

const ConsultantCard: React.FC<ConsultantCardProps> = ({
  name,
  title,
  avatarUri,
  rating,
  onBookPress,
  onChatPress,
  onCallPress,
  onVideoCallPress,
}) => {
  return (
      <View style={consultantCard.card}>
        {/* Left side: Avatar + Info + Button + Contact Icons */}
        <View style={consultantCard.leftBox}>
          {avatarUri ? (
            <Image
              source={avatarUri}
              style={consultantCard.avatar}
              key={typeof avatarUri === 'object' && 'uri' in avatarUri ? avatarUri.uri : undefined}
            />
          ) : (
            <View
              style={[
                consultantCard.avatar,
                { backgroundColor: '#A5AFBD', alignItems: 'center', justifyContent: 'center' },
              ]}
            >
              <UserRound size={22} color={COLORS.gray} />
            </View>
          )}

          <Text 
            style={consultantCard.cardTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {name}
          </Text>
          <Text 
            style={consultantCard.cardSubtitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>

          <AppButton
            title="Book Now"
            onPress={onBookPress || (() => {})}
            style={consultantCard.cardButton} 
            textStyle={consultantCard.buttonText}
          />

          {/* Contact Icons */}
          <View style={consultantCard.iconBox}>
            <TouchableOpacity 
              style={consultantCard.iconCircle}
              onPress={onChatPress}
            >
              <MessageCircle size={18} color="green" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={consultantCard.iconCircle}
              onPress={onCallPress}
            >
              <Phone size={18} color="green" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={consultantCard.iconCircle}
              onPress={onVideoCallPress}
            >
              <Video size={18} color="green" />
            </TouchableOpacity>
          </View>
          <View style={consultantCard.ConsultantRatingBox}>
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
            <Text style={consultantCard.ratingText}>({rating})</Text>
          </View>
        </View>
      </View>
  );
};

export default ConsultantCard;
