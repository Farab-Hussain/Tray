import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { COLORS } from '../../constants/core/colors';

interface ProfileSectionCardProps {
  title: string;
  icon: LucideIcon;
  items: ProfileItem[];
  style?: any;
}

interface ProfileItem {
  label: string;
  value?: string | number | null;
  subtext?: string;
  icon?: LucideIcon;
  iconColor?: string;
  onPress?: () => void;
  rightIcon?: LucideIcon;
  rightIconColor?: string;
  showSeparator?: boolean;
}

const ProfileSectionCard: React.FC<ProfileSectionCardProps> = ({
  title,
  icon: TitleIcon,
  items,
  style,
}) => {
  return (
    <View style={[styles.section, style]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <TitleIcon size={20} color={COLORS.green} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      </View>

      <View style={styles.sectionContent}>
        {items.map((item, index) => (
          <View key={`${item.label}-${index}`}>
            <TouchableOpacity
              style={styles.infoItem}
              onPress={item.onPress}
              activeOpacity={item.onPress ? 0.7 : 1}
              disabled={!item.onPress}
            >
              <View style={styles.infoItemLeft}>
                {item.icon && (
                  <View style={styles.iconContainer}>
                    <item.icon size={20} color={item.iconColor || COLORS.green} />
                  </View>
                )}
                <View style={styles.infoItemText}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  {item.value !== undefined && item.value !== null && (
                    <Text style={styles.infoValue}>
                      {typeof item.value === 'string' || typeof item.value === 'number' 
                        ? item.value.toString() 
                        : 'Invalid data format'
                      }
                    </Text>
                  )}
                  {item.subtext && (
                    <Text style={styles.infoSubtext}>{item.subtext}</Text>
                  )}
                </View>
              </View>
              {item.rightIcon && (
                <item.rightIcon size={18} color={item.rightIconColor || COLORS.gray} />
              )}
            </TouchableOpacity>
            {item.showSeparator && <View style={styles.separator} />}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginLeft: 12,
  },
  sectionContent: {
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoItemText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.gray,
  },
  infoSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 12,
  },
});

export default ProfileSectionCard;
