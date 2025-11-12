import { View, Image, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { Text } from 'react-native';
import { cartCardStyles } from '../../constants/styles/cartCardStyles';
import { Trash2 } from 'lucide-react-native';

type CartCardProps = {
  id: string;
  price: number;
  image: any;
  consultantName: string;
  serviceName: string;
  onRemove: (id: string) => void;
};

const CartCard = ({ 
  id, 
  price, 
  image, 
  consultantName,
  serviceName,
  onRemove
}: CartCardProps) => {
  const handleRemove = () => {
    onRemove(id);
  };
  
  return (
    <View style={cartCardStyles.cartCard}>
      <View style={cartCardStyles.Card}>
        <Image
          source={image as ImageSourcePropType}
          style={cartCardStyles.Image}
        />
        <View style={cartCardStyles.Info}>
          <Text style={cartCardStyles.consultantName} numberOfLines={1} ellipsizeMode="tail">
            {consultantName}
          </Text>
          <Text style={cartCardStyles.serviceName} numberOfLines={1} ellipsizeMode="tail">
            {serviceName}
          </Text>
          <Text style={cartCardStyles.price}>${price}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={cartCardStyles.deleteButton}
        onPress={handleRemove}
        activeOpacity={0.7}
      >
        <Trash2 size={22} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );
};

export default CartCard;
