import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { formComponentsStyles } from '../../constants/styles/formComponentsStyles';
import { consultantFlowStyles } from '../../constants/styles/consultantFlowStyles';
import { COLORS } from '../../constants/core/colors';
import * as LucideIcons from 'lucide-react-native';
import { sanitizeUserMessage } from '../../utils/sanitizeUserMessage';

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
  required?: boolean;
  error?: string;
  containerStyle?: any;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
  required = false,
  error,
  containerStyle,
}) => {
  return (
    <View style={[consultantFlowStyles.inputContainer, containerStyle]}>
      <Text style={consultantFlowStyles.label}>
        {label} {required && '*'}
      </Text>
      <TextInput
        style={[
          consultantFlowStyles.input,
          multiline && consultantFlowStyles.textArea,
          error && { borderColor: COLORS.red },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
      {error && (
        <Text style={formComponentsStyles.errorText}>
          {sanitizeUserMessage(error)}
        </Text>
      )}
    </View>
  );
};

interface TextAreaProps
  extends Omit<FormInputProps, 'multiline' | 'numberOfLines'> {
  minLength?: number;
  maxLength?: number;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
  minLength = 0,
  maxLength,
  error,
}) => {
  const showCharCount = minLength > 0 || maxLength;

  return (
    <View style={consultantFlowStyles.inputContainer}>
      <Text style={consultantFlowStyles.label}>
        {label} {required && '*'}
        {minLength > 0 && ` (min ${minLength} chars)`}
      </Text>
      <TextInput
        style={[
          consultantFlowStyles.input,
          consultantFlowStyles.textArea,
          error && { borderColor: COLORS.red },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
      {showCharCount && (
        <Text style={consultantFlowStyles.charCount}>
          {value.length} characters
          {maxLength && ` / ${maxLength}`}
        </Text>
      )}
      {error && (
        <Text style={formComponentsStyles.errorText}>
          {sanitizeUserMessage(error)}
        </Text>
      )}
    </View>
  );
};

interface PriceInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  currency?: string;
  required?: boolean;
  error?: string;
}

export const PriceInput: React.FC<PriceInputProps> = ({
  label,
  value,
  onChangeText,
  currency = '$',
  required = false,
  error,
}) => {
  return (
    <View style={consultantFlowStyles.inputContainer}>
      <Text style={consultantFlowStyles.label}>
        {label} {required && '*'}
      </Text>
      <View style={consultantFlowStyles.priceInput}>
        <Text style={consultantFlowStyles.priceSymbol}>{currency}</Text>
        <TextInput
          style={[
            consultantFlowStyles.input,
            consultantFlowStyles.priceInputField,
            error && { borderColor: COLORS.red },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder="Enter hourly rate"
          keyboardType="numeric"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      {error && (
        <Text style={formComponentsStyles.errorText}>
          {sanitizeUserMessage(error)}
        </Text>
      )}
    </View>
  );
};

interface CategorySelectorProps {
  label: string;
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  required?: boolean;
  error?: string;
  useDropdown?: boolean;
  customCategory?: string;
  onCustomCategoryChange?: (category: string) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  label,
  categories,
  selectedCategory,
  onCategorySelect,
  required = false,
  error,
  useDropdown = false,
  customCategory = '',
  onCustomCategoryChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showScrollIndicators, setShowScrollIndicators] = useState({
    left: false,
    right: true,
  });

  const handleCategorySelect = (category: string) => {
    onCategorySelect(category);
    setIsDropdownOpen(false);
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollX = contentOffset.x;
    const maxScrollX = contentSize.width - layoutMeasurement.width;

    setShowScrollIndicators({
      left: scrollX > 0,
      right: scrollX < maxScrollX - 10, // 10px threshold
    });
  };

  if (useDropdown) {
    return (
      <View style={consultantFlowStyles.inputContainer}>
        <Text style={consultantFlowStyles.label}>
          {label} {required && '*'}
        </Text>

        <TouchableOpacity
          style={consultantFlowStyles.dropdownButton}
          onPress={() => setIsDropdownOpen(true)}
        >
          <Text
            style={[
              consultantFlowStyles.dropdownButtonText,
              !selectedCategory && consultantFlowStyles.dropdownPlaceholderText,
            ]}
          >
            {selectedCategory === 'Other' && customCategory
              ? customCategory
              : selectedCategory || 'Select a category'}
          </Text>
          <LucideIcons.ChevronDown size={20} color="#6B7280" />
        </TouchableOpacity>

        <Modal
          visible={isDropdownOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsDropdownOpen(false)}
        >
          <TouchableOpacity
            style={consultantFlowStyles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsDropdownOpen(false)}
          >
            <View style={consultantFlowStyles.dropdownModal}>
              <View style={consultantFlowStyles.dropdownHeader}>
                <Text style={consultantFlowStyles.dropdownTitle}>
                  Select Category
                </Text>
                <TouchableOpacity onPress={() => setIsDropdownOpen(false)}>
                  <LucideIcons.X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={consultantFlowStyles.dropdownList}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      consultantFlowStyles.dropdownItem,
                      selectedCategory === category &&
                        consultantFlowStyles.dropdownItemSelected,
                    ]}
                    onPress={() => handleCategorySelect(category)}
                  >
                    <Text
                      style={[
                        consultantFlowStyles.dropdownItemText,
                        selectedCategory === category &&
                          consultantFlowStyles.dropdownItemTextSelected,
                      ]}
                    >
                      {category}
                    </Text>
                    {selectedCategory === category && (
                      <LucideIcons.Check
                        size={20}
                        color={
                          consultantFlowStyles.dropdownItemTextSelected.color
                        }
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Custom Category Input for "Other" */}
        {selectedCategory === 'Other' && onCustomCategoryChange && (
          <View style={consultantFlowStyles.customCategoryContainer}>
            <Text style={consultantFlowStyles.customCategoryLabel}>
              Custom Category
            </Text>
            <TextInput
              style={consultantFlowStyles.customCategoryInput}
              value={customCategory}
              onChangeText={onCustomCategoryChange}
              placeholder="Enter your custom category"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        )}

        {error && (
          <Text style={formComponentsStyles.errorText}>
            {sanitizeUserMessage(error)}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={consultantFlowStyles.inputContainer}>
      <Text style={consultantFlowStyles.label}>
        {label} {required && '*'}
      </Text>

      <View style={consultantFlowStyles.scrollContainer}>
        {/* Left scroll indicator */}
        {showScrollIndicators.left && (
          <View style={consultantFlowStyles.scrollIndicatorLeft}>
            <LucideIcons.ChevronLeft size={16} color="#6B7280" />
          </View>
        )}

        {/* Right scroll indicator */}
        {showScrollIndicators.right && (
          <View style={consultantFlowStyles.scrollIndicatorRight}>
            <LucideIcons.ChevronRight size={16} color="#6B7280" />
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={consultantFlowStyles.categoryScrollContainer}
          contentContainerStyle={consultantFlowStyles.categoryContainer}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                consultantFlowStyles.categoryChip,
                selectedCategory === category &&
                  consultantFlowStyles.categoryChipSelected,
              ]}
              onPress={() => onCategorySelect(category)}
            >
              <Text
                style={[
                  consultantFlowStyles.categoryChipText,
                  selectedCategory === category &&
                    consultantFlowStyles.categoryChipTextSelected,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Custom Category Input for "Other" */}
      {selectedCategory === 'Other' && onCustomCategoryChange && (
        <View style={consultantFlowStyles.customCategoryContainer}>
          <Text style={consultantFlowStyles.customCategoryLabel}>
            Custom Category
          </Text>
          <TextInput
            style={consultantFlowStyles.customCategoryInput}
            value={customCategory}
            onChangeText={onCustomCategoryChange}
            placeholder="Enter your custom category"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      )}

      {error && (
        <Text style={formComponentsStyles.errorText}>
          {sanitizeUserMessage(error)}
        </Text>
      )}
    </View>
  );
};

interface SpecialtyManagerProps {
  label: string;
  specialties: string[];
  onAddSpecialty: (specialty: string) => void;
  onRemoveSpecialty: (specialty: string) => void;
}

export const SpecialtyManager: React.FC<SpecialtyManagerProps> = ({
  label,
  specialties,
  onAddSpecialty,
  onRemoveSpecialty,
}) => {
  const [newSpecialty, setNewSpecialty] = React.useState('');

  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      onAddSpecialty(newSpecialty.trim());
      setNewSpecialty('');
    }
  };

  return (
    <View style={consultantFlowStyles.inputContainer}>
      <Text style={consultantFlowStyles.label}>{label}</Text>

      <View style={consultantFlowStyles.specialtyInputContainer}>
        <TextInput
          style={[
            consultantFlowStyles.input,
            consultantFlowStyles.specialtyInput,
          ]}
          value={newSpecialty}
          onChangeText={setNewSpecialty}
          placeholder="e.g., Resume Writing"
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity
          style={consultantFlowStyles.addButton}
          onPress={handleAddSpecialty}
        >
          <Text style={consultantFlowStyles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {specialties.length > 0 && (
        <View style={consultantFlowStyles.specialtiesList}>
          {specialties.map((specialty, index) => (
            <View key={index} style={consultantFlowStyles.specialtyTag}>
              <Text style={consultantFlowStyles.specialtyTagText}>
                {specialty}
              </Text>
              <TouchableOpacity onPress={() => onRemoveSpecialty(specialty)}>
                <Text style={consultantFlowStyles.specialtyTagRemove}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};
