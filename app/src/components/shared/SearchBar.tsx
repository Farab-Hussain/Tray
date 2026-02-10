import React from 'react';
import { View, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';
import { COLORS } from '../../constants/core/colors';
import { searchBarStyles } from '../../constants/styles/searchBarStyles';

type SearchBarProps = {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  style?: any;
};

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.gray} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
          value={value}
          onChangeText={onChangeText}
        />
      </View>
    </View>
  );
};

const styles = searchBarStyles;

export default SearchBar;
