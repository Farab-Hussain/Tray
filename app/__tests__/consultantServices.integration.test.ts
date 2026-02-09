// app/__tests__/consultantServices.integration.test.ts
// Integration test for ConsultantServices with course creation functionality

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import ConsultantServices from '../src/Screen/Consultant/Services/ConsultantServices';
import { courseService } from '../src/services/course.service';
import { ConsultantService } from '../src/services/consultant.service';
import { getConsultantVerificationStatus } from '../src/services/consultantFlow.service';
import { AuthProvider } from '../src/contexts/AuthContext';

// Mock the services
jest.mock('../src/services/course.service');
jest.mock('../src/services/consultant.service');
jest.mock('../src/services/consultantFlow.service');

const mockedCourseService = courseService as jest.Mocked<typeof courseService>;
const mockedConsultantService = ConsultantService as jest.Mocked<typeof ConsultantService>;
const mockedGetConsultantVerificationStatus = getConsultantVerificationStatus as jest.MockedFunction<typeof getConsultantVerificationStatus>;

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: jest.fn(),
}));

const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
};

const mockServices: ConsultantService[] = [
  {
    id: 'service-1',
    title: 'Web Development',
    description: 'Learn web development',
    duration: 60,
    price: 100,
    imageUrl: 'https://example.com/image.jpg',
    rating: 4.5,
    approvalStatus: 'approved',
  },
  {
    id: 'service-2',
    title: 'Mobile Development',
    description: 'Learn mobile development',
    duration: 90,
    price: 150,
    rating: 4.8,
    approvalStatus: 'approved',
  },
];

describe('ConsultantServices Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful consultant status
    mockedGetConsultantVerificationStatus.mockResolvedValue({
      hasProfile: true,
      status: 'approved',
      message: 'Profile approved',
      nextStep: 'completed',
      profile: {
        uid: 'test-consultant-uid',
      },
    });

    // Mock existing services
    mockedConsultantService.getConsultantServices.mockResolvedValue({
      services: mockServices,
    });

    // Mock course creation
    mockedCourseService.createCourse.mockResolvedValue({
      id: 'new-course-123',
      title: 'Test Service',
      description: 'Test Description',
    } as any);
  });

  const renderComponent = () => {
    return render(
      <AuthProvider>
        <NavigationContainer>
          <ConsultantServices navigation={{ navigate: jest.fn() } as any} />
        </NavigationContainer>
      </AuthProvider>
    );
  };

  describe('Service Display', () => {
    it('should display existing services', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Web Development')).toBeTruthy();
        expect(screen.getByText('Mobile Development')).toBeTruthy();
        expect(screen.getByText('2 Services in Your Catalog')).toBeTruthy();
      });
    });

    it('should display search functionality', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search your services')).toBeTruthy();
      });
    });

    it('should filter services based on search', async () => {
      renderComponent();

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search your services');
        fireEvent.changeText(searchInput, 'Web');
        
        expect(screen.getByText('Web Development')).toBeTruthy();
        expect(screen.queryByText('Mobile Development')).toBeNull();
      });
    });
  });

  describe('Course Creation Modal', () => {
    it('should open modal when Add New Service is pressed', async () => {
      renderComponent();

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Service');
        expect(addButton).toBeTruthy();
        
        fireEvent.press(addButton);
        
        expect(screen.getByText('Create New Service')).toBeTruthy();
        expect(screen.getByText('Basic Information')).toBeTruthy();
      });
    });

    it('should display all form fields in modal', async () => {
      renderComponent();

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Service');
        fireEvent.press(addButton);
        
        // Check basic information fields
        expect(screen.getByText('Title *')).toBeTruthy();
        expect(screen.getByText('Description *')).toBeTruthy();
        expect(screen.getByText('Short Description')).toBeTruthy();
        
        // Check category and level fields
        expect(screen.getByText('Category & Level')).toBeTruthy();
        expect(screen.getByText('Category')).toBeTruthy();
        expect(screen.getByText('Level')).toBeTruthy();
        
        // Check pricing fields
        expect(screen.getByText('Pricing')).toBeTruthy();
        expect(screen.getByText('Free Service')).toBeTruthy();
        
        // Check duration fields
        expect(screen.getByText('Duration')).toBeTruthy();
        expect(screen.getByText('Duration (minutes)')).toBeTruthy();
        expect(screen.getByText('Duration Text')).toBeTruthy();
        
        // Check action buttons
        expect(screen.getByText('Cancel')).toBeTruthy();
        expect(screen.getByText('Create Service')).toBeTruthy();
      });
    });

    it('should allow form input', async () => {
      renderComponent();

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Service');
        fireEvent.press(addButton);
        
        // Fill in title
        const titleInput = screen.getByPlaceholderText('Enter service title');
        fireEvent.changeText(titleInput, 'New Test Service');
        
        // Fill in description
        const descriptionInput = screen.getByPlaceholderText('Describe your service');
        fireEvent.changeText(descriptionInput, 'This is a test service description');
        
        // Toggle free service
        const freeSwitch = screen.getByText('Free Service');
        fireEvent.press(freeSwitch);
        
        // Verify values are entered
        expect(titleInput.props.value).toBe('New Test Service');
        expect(descriptionInput.props.value).toBe('This is a test service description');
      });
    });

    it('should select category and level', async () => {
      renderComponent();

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Service');
        fireEvent.press(addButton);
        
        // Select category
        const businessCategory = screen.getByText('Business');
        fireEvent.press(businessCategory);
        
        // Select level
        const intermediateLevel = screen.getByText('intermediate');
        fireEvent.press(intermediateLevel);
        
        expect(screen.getByText('Business')).toBeTruthy();
        expect(screen.getByText('intermediate')).toBeTruthy();
      });
    });

    it('should validate required fields', async () => {
      // Mock alert to capture validation errors
      const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation();
      
      renderComponent();

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Service');
        fireEvent.press(addButton);
        
        // Try to create without required fields
        const createButton = screen.getByText('Create Service');
        fireEvent.press(createButton);
        
        // Should show validation error
        expect(mockAlert).toHaveBeenCalledWith('Error', 'Title and description are required');
      });
      
      mockAlert.mockRestore();
    });

    it('should create service successfully', async () => {
      const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation();
      
      renderComponent();

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Service');
        fireEvent.press(addButton);
        
        // Fill in required fields
        const titleInput = screen.getByPlaceholderText('Enter service title');
        fireEvent.changeText(titleInput, 'Valid Service Title');
        
        const descriptionInput = screen.getByPlaceholderText('Describe your service');
        fireEvent.changeText(descriptionInput, 'Valid service description');
        
        // Create service
        const createButton = screen.getByText('Create Service');
        fireEvent.press(createButton);
        
        // Should call course service
        expect(mockedCourseService.createCourse).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Valid Service Title',
            description: 'Valid service description',
            pricingOptions: {
              monthly: 0,
              yearly: 0,
              lifetime: 0,
            },
            language: 'English',
            currency: 'USD',
            slug: 'valid-service-title',
          })
        );
        
        // Should show success message
        expect(mockAlert).toHaveBeenCalledWith('Success', 'Service created successfully!');
      });
      
      mockAlert.mockRestore();
    });

    it('should close modal on cancel', async () => {
      renderComponent();

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Service');
        fireEvent.press(addButton);
        
        // Cancel should close modal
        const cancelButton = screen.getByText('Cancel');
        fireEvent.press(cancelButton);
        
        // Modal should be closed (title should not be visible)
        expect(screen.queryByText('Create New Service')).toBeNull();
      });
    });

    it('should handle creation errors gracefully', async () => {
      const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation();
      
      // Mock creation error
      mockedCourseService.createCourse.mockRejectedValue(new Error('Network error'));
      
      renderComponent();

      await waitFor(() => {
        const addButton = screen.getByText('+ Add New Service');
        fireEvent.press(addButton);
        
        // Fill in required fields
        const titleInput = screen.getByPlaceholderText('Enter service title');
        fireEvent.changeText(titleInput, 'Test Service');
        
        const descriptionInput = screen.getByPlaceholderText('Describe your service');
        fireEvent.changeText(descriptionInput, 'Test description');
        
        // Try to create
        const createButton = screen.getByText('Create Service');
        fireEvent.press(createButton);
        
        // Should show error message
        expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to create service');
      });
      
      mockAlert.mockRestore();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no services', async () => {
      // Mock empty services response
      mockedConsultantService.getConsultantServices.mockResolvedValue({
        services: [],
      });
      
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No services yet')).toBeTruthy();
        expect(screen.getByText('Apply for services or create your own to get started')).toBeTruthy();
        expect(screen.getByText('📋')).toBeTruthy();
      });
    });

    it('should display search empty state', async () => {
      renderComponent();

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search your services');
        fireEvent.changeText(searchInput, 'nonexistent');
        
        expect(screen.getByText('No services found')).toBeTruthy();
        expect(screen.getByText('Try adjusting your search terms')).toBeTruthy();
      });
    });
  });

  describe('Error States', () => {
    it('should display error when services fail to load', async () => {
      // Mock error response
      mockedConsultantService.getConsultantServices.mockRejectedValue(new Error('Network error'));
      
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Failed to load services. Please try again.')).toBeTruthy();
      });
    });
  });

  describe('Loading States', () => {
    it('should display loading state initially', async () => {
      // Mock pending request
      mockedConsultantService.getConsultantServices.mockImplementation(() => new Promise(() => {}));
      
      renderComponent();

      expect(screen.getByText('Loading your services...')).toBeTruthy();
    });
  });
});
