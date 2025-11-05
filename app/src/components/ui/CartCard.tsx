import { View, Image, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { Text } from 'react-native';
import { cartCardStyles } from '../../constants/styles/cartCardStyles';
import { Trash2 } from 'lucide-react-native';

type BookedSlot = {
  date: string;
  startTime: string;
  endTime: string;
};

type CartCardProps = {
  id: string;
  counter: number;
  price: number;
  image: any;
  title: string;
  description: string;
  bookedSlots?: BookedSlot[];
  onCounterChange: (id: string, newCounter: number) => void;
  onRemove: (id: string) => void;
  isUpdating?: boolean;
};

const CartCard = ({ 
  id, 
  counter, 
  price, 
  image, 
  title, 
  description, 
  onCounterChange, 
  onRemove,
  isUpdating = false
}: CartCardProps) => {
  // Define increment and decrement functions that call the parent's update function
  const increment = () => {
    if (!isUpdating) {
      onCounterChange(id, counter + 1);
    }
  };

  const decrement = () => {
    if (counter > 1 && !isUpdating) {
      onCounterChange(id, counter - 1);
    }
  };

  const handleRemove = () => {
    onRemove(id);
  };

  const totalPrice = counter * price;
  
  return (
    <View style={cartCardStyles.cartCard}>
      <View style={cartCardStyles.Card}>
        <Image
          source={image as ImageSourcePropType}
          style={cartCardStyles.Image}
        />
        <View style={cartCardStyles.Info}>
          <Text style={cartCardStyles.title} numberOfLines={2} ellipsizeMode="tail">{title}</Text>
          <Text style={cartCardStyles.desc} numberOfLines={2} ellipsizeMode="tail">{description}</Text>
          <Text style={cartCardStyles.price}>${totalPrice}</Text>
        </View>
      </View>
      <View style={cartCardStyles.buttonContainer}>
        <TouchableOpacity
          onPress={increment}
          activeOpacity={0.7}
          style={[
            cartCardStyles.button,
            isUpdating && { opacity: 0.5 }
          ]}
          disabled={isUpdating}
        >
          <Text style={cartCardStyles.buttonText}>+</Text>
        </TouchableOpacity>
        <Text style={cartCardStyles.buttonText}>{counter}</Text>
        <TouchableOpacity
          onPress={decrement}
          activeOpacity={0.7}
          style={[
            cartCardStyles.button,
            isUpdating && { opacity: 0.5 }
          ]}
          disabled={isUpdating}
        >
          <Text style={cartCardStyles.buttonText}>-</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={cartCardStyles.deleteButton}
          onPress={handleRemove}
        >
          <Trash2 size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CartCard;
