import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../../constants/core/colors';
import { ConsultantService } from '../../../services/consultant.service';
import ServiceCard from '../../../components/ui/ServiceCard';
import { logger } from '../../../utils/logger';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  consultantId: string;
  consultantName: string;
  consultantRating: number;
  consultantTotalReviews: number;
  accessType: 'one-time' | 'weekly' | 'monthly' | 'yearly' | 'lifetime';
  pricing?: {
    weekly?: number;
    monthly?: number;
    yearly?: number;
    lifetime?: number;
  };
  duration?: number;
  createdAt?: string;
}

const CATEGORIES = [
  'All',
  'Business & Career',
  'Technology & Programming',
  'Design & Creative',
  'Marketing & Sales',
  'Health & Wellness',
  'Education & Teaching',
  'Finance & Accounting',
  'Personal Development',
];

const SORT_OPTIONS = [
  { label: 'Most Popular', value: 'popular' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Highest Rated', value: 'rating' },
  { label: 'Newest First', value: 'newest' },
];

export default function ServiceBrowser() {
  const navigation = useNavigation();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ConsultantService.getAllServices();
      if (response?.services) {
        setServices(response.services);
        setFilteredServices(response.services);
      }
    } catch (error) {
      logger.error('Error fetching services:', error);
      Alert.alert('Issue', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    let filtered = [...services];

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(service => 
        service.category === selectedCategory
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service =>
        service.title.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.consultantName.toLowerCase().includes(query) ||
        service.category.toLowerCase().includes(query)
      );
    }

    // Apply price filter
    filtered = filtered.filter(service => {
      const price = service.accessType === 'one-time' 
        ? service.price 
        : Math.min(...Object.values(service.pricing || {}).filter(p => p > 0));
      return price >= priceRange.min && price <= priceRange.max;
    });

    // Apply sorting
    switch (selectedSort) {
      case 'price_asc':
        filtered.sort((a, b) => {
          const priceA = a.accessType === 'one-time' ? a.price : Math.min(...Object.values(a.pricing || {}));
          const priceB = b.accessType === 'one-time' ? b.price : Math.min(...Object.values(b.pricing || {}));
          return priceA - priceB;
        });
        break;
      case 'price_desc':
        filtered.sort((a, b) => {
          const priceA = a.accessType === 'one-time' ? a.price : Math.min(...Object.values(a.pricing || {}));
          const priceB = b.accessType === 'one-time' ? b.price : Math.min(...Object.values(b.pricing || {}));
          return priceB - priceA;
        });
        break;
      case 'rating':
        filtered.sort((a, b) => b.consultantRating - a.consultantRating);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      default: // popular
        filtered.sort((a, b) => b.consultantTotalReviews - a.consultantTotalReviews);
    }

    setFilteredServices(filtered);
  }, [services, searchQuery, selectedCategory, selectedSort, priceRange]);

  const handleServicePress = (service: Service) => {
    // Navigate to booking slots for this service
    navigation.navigate('BookingSlots' as never, {
      consultantId: service.consultantId,
      consultantName: service.consultantName,
      serviceId: service.id,
      serviceTitle: service.title,
      serviceImageUrl: service.imageUrl,
      serviceDuration: service.duration,
      servicePrice: service.accessType === 'one-time' ? service.price : undefined,
      consultantCategory: service.category,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Services</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services, consultants, or categories..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.gray}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.categoryChipTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sort Options */}
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.sortOptionsContainer}
            >
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortChip,
                    selectedSort === option.value && styles.sortChipActive,
                  ]}
                  onPress={() => setSelectedSort(option.value)}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      selectedSort === option.value && styles.sortChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Price Range */}
          <View style={styles.priceRangeContainer}>
            <Text style={styles.priceRangeLabel}>Price Range:</Text>
            <View style={styles.priceInputsContainer}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                value={priceRange.min.toString()}
                onChangeText={(text) => setPriceRange(prev => ({ 
                  ...prev, 
                  min: parseInt(text, 10) || 0 
                }))}
                keyboardType="numeric"
              />
              <Text style={styles.priceSeparator}>-</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                value={priceRange.max.toString()}
                onChangeText={(text) => setPriceRange(prev => ({ 
                  ...prev, 
                  max: parseInt(text, 10) || 1000 
                }))}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Services List */}
      <ScrollView
        style={styles.servicesList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.servicesListContent}
      >
        {filteredServices.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No services found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your filters or search terms
            </Text>
          </View>
        ) : (
          filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              title={service.title}
              description={service.description}
              imageUri={service.imageUrl ? { uri: service.imageUrl } : undefined}
              price={service.accessType === 'one-time' ? service.price : undefined}
              duration={service.duration}
              consultantName={service.consultantName}
              consultantCategory={service.category}
              onBookPress={() => handleServicePress(service)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBackground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: COLORS.lightBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
  },
  filterButton: {
    backgroundColor: COLORS.green,
    borderRadius: 12,
    padding: 10,
  },
  filtersContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: COLORS.lightBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: COLORS.green,
  },
  categoryChipText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  sortContainer: {
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  sortOptionsContainer: {
    flexDirection: 'row' as const,
  },
  sortChip: {
    backgroundColor: COLORS.lightBackground,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  sortChipActive: {
    backgroundColor: COLORS.green,
  },
  sortChipText: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: COLORS.white,
  },
  priceRangeContainer: {
    marginBottom: 8,
  },
  priceRangeLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  priceInputsContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  priceInput: {
    flex: 1,
    backgroundColor: COLORS.lightBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.black,
  },
  priceSeparator: {
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: '500' as const,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  resultsText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  servicesList: {
    flex: 1,
  },
  servicesListContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center' as const,
  },
};