/**
 * Service Creation Form Frontend Tests
 * Tests for the new service creation form functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ConsultantApplicationsScreen } from '../src/Screen/Consultant/Applications/ConsultantApplicationsScreen';
import { useAuth } from '../src/contexts/AuthContext';
import { createConsultantApplication, getConsultantApplications } from '../src/services/consultantFlow.service';

// Mock dependencies
jest.mock('../src/contexts/AuthContext');
jest.mock('../src/services/consultantFlow.service');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
    navigate: jest.fn(),
    setParams: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockCreateConsultantApplication = createConsultantApplication as jest.MockedFunction<typeof createConsultantApplication>;
const mockGetConsultantApplications = getConsultantApplications as jest.MockedFunction<typeof getConsultantApplications>;

describe('ServiceCreationForm', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      refreshConsultantStatus: jest.fn(),
    } as any);
    
    mockGetConsultantApplications.mockResolvedValue([]);
  });

  describe('Form Rendering', () => {
    it('should render all form fields', async () => {
      render(<ConsultantApplicationsScreen />);
      
      await waitFor(() => {
        expect(screen.getByText('My Applications')).toBeTruthy();
        expect(screen.getByDisplayValue('')).toBeTruthy(); // Service title input
      });
    });

    it('should show service creation form when + is pressed', async () => {
      render(<ConsultantApplicationsScreen />);
      
      await waitFor(() => {
        // Find and press the + button to open creation form
        const plusButton = screen.getByTestId('header-plus-button');
        fireEvent.press(plusButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Create New Service')).toBeTruthy();
        expect(screen.getByText('Service Title')).toBeTruthy();
        expect(screen.getByText('Service Media')).toBeTruthy();
        expect(screen.getByText('Service Category')).toBeTruthy();
        expect(screen.getByText('Access Type')).toBeTruthy();
        expect(screen.getByText('Pricing')).toBeTruthy();
      });
    });
  });

  describe('Access Type Selection', () => {
    it('should show one-time pricing when one-time is selected', async () => {
      render(<ConsultantApplicationsScreen />);
      
      // Open creation form
      await waitFor(() => {
        const plusButton = screen.getByTestId('header-plus-button');
        fireEvent.press(plusButton);
      });

      // Select one-time access type
      await waitFor(() => {
        const oneTimeButton = screen.getByText('One-time');
        fireEvent.press(oneTimeButton);
      });

      await waitFor(() => {
        // Should show single price input for one-time
        expect(screen.getByDisplayValue('150')).toBeTruthy(); // Default price
      });
    });

    it('should show weekly pricing when weekly is selected', async () => {
      render(<ConsultantApplicationsScreen />);
      
      // Open creation form
      await waitFor(() => {
        const plusButton = screen.getByTestId('header-plus-button');
        fireEvent.press(plusButton);
      });

      // Select weekly access type
      await waitFor(() => {
        const weeklyButton = screen.getByText('Weekly');
        fireEvent.press(weeklyButton);
      });

      await waitFor(() => {
        // Should show weekly price input
        expect(screen.getByText('Weekly Price')).toBeTruthy();
      });
    });

    it('should show monthly pricing when monthly is selected', async () => {
      render(<ConsultantApplicationsScreen />);
      
      // Open creation form
      await waitFor(() => {
        const plusButton = screen.getByTestId('header-plus-button');
        fireEvent.press(plusButton);
      });

      // Select monthly access type
      await waitFor(() => {
        const monthlyButton = screen.getByText('Monthly');
        fireEvent.press(monthlyButton);
      });

      await waitFor(() => {
        // Should show monthly price input
        expect(screen.getByText('Monthly Price')).toBeTruthy();
      });
    });
  });

  describe('Category Selection', () => {
    it('should show predefined categories', async () => {
      render(<ConsultantApplicationsScreen />);
      
      // Open creation form
      await waitFor(() => {
        const plusButton = screen.getByTestId('header-plus-button');
        fireEvent.press(plusButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Business & Career')).toBeTruthy();
        expect(screen.getByText('Technology & Programming')).toBeTruthy();
        expect(screen.getByText('Design & Creative')).toBeTruthy();
        expect(screen.getByText('Marketing & Sales')).toBeTruthy();
      });
    });

    it('should allow adding custom category', async () => {
      render(<ConsultantApplicationsScreen />);
      
      // Open creation form
      await waitFor(() => {
        const plusButton = screen.getByTestId('header-plus-button');
        fireEvent.press(plusButton);
      });

      // Press the + category button
      await waitFor(() => {
        const addCategoryButton = screen.getByTestId('add-category-button');
        fireEvent.press(addCategoryButton);
      });

      // Enter custom category
      await waitFor(() => {
        const customCategoryInput = screen.getByPlaceholderText('Enter your custom category');
        fireEvent.changeText(customCategoryInput, 'Custom Test Category');
        
        const addButton = screen.getByText('Add');
        fireEvent.press(addButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Custom Test Category')).toBeTruthy();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      mockCreateConsultantApplication.mockRejectedValue({
        response: {
          data: {
            errors: ['Title is required', 'Description must be at least 20 characters']
          }
        }
      });

      render(<ConsultantApplicationsScreen />);
      
      // Open creation form
      await waitFor(() => {
        const plusButton = screen.getByTestId('header-plus-button');
        fireEvent.press(plusButton);
      });

      // Try to submit without filling required fields
      await waitFor(() => {
        const submitButton = screen.getByText('Create Service');
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('', 'Please fix the errors before submitting');
      });
    });

    it('should validate pricing based on access type', async () => {
      render(<ConsultantApplicationsScreen />);
      
      // Open creation form
      await waitFor(() => {
        const plusButton = screen.getByTestId('header-plus-button');
        fireEvent.press(plusButton);
      });

      // Select one-time and set price to 0
      await waitFor(() => {
        const oneTimeButton = screen.getByText('One-time');
        fireEvent.press(oneTimeButton);
      });

      await waitFor(() => {
        const priceInput = screen.getByDisplayValue('150');
        fireEvent.changeText(priceInput, '0');
        
        const submitButton = screen.getByText('Create Service');
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('', 'Please fix the errors before submitting');
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit one-time service successfully', async () => {
      mockCreateConsultantApplication.mockResolvedValue({
        id: 'test-application-id',
        customService: {
          title: 'Test Service',
          description: 'Test description that is at least 20 characters',
          price: 150,
          accessType: 'one-time',
          category: 'Business & Career',
        },
      });

      render(<ConsultantApplicationsScreen />);
      
      // Open creation form
      await waitFor(() => {
        const plusButton = screen.getByTestId('header-plus-button');
        fireEvent.press(plusButton);
      });

      // Fill form fields
      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('e.g., Career Mentorship Session');
        fireEvent.changeText(titleInput, 'Test Service');

        const descriptionInput = screen.getByPlaceholderText('Describe your service in detail...');
        fireEvent.changeText(descriptionInput, 'Test description that is at least 20 characters long');

        const categoryButton = screen.getByText('Business & Career');
        fireEvent.press(categoryButton);

        const submitButton = screen.getByText('Create Service');
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(mockCreateConsultantApplication).toHaveBeenCalledWith({
          consultantId: 'test-user-id',
          type: 'new',
          customService: {
            title: 'Test Service',
            description: 'Test description that is at least 20 characters long',
            price: 150,
            accessType: 'one-time',
            category: 'Business & Career',
            imageUrl: undefined,
            imagePublicId: undefined,
          },
        });
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Success',
          'Application submitted! It will be reviewed by admin.'
        );
      });
    });

    it('should submit weekly subscription service successfully', async () => {
      mockCreateConsultantApplication.mockResolvedValue({
        id: 'test-application-id',
        customService: {
          title: 'Weekly Test Service',
          description: 'Test description that is at least 20 characters',
          accessType: 'weekly',
          pricing: { weekly: 29.99 },
        },
      });

      render(<ConsultantApplicationsScreen />);
      
      // Open creation form
      await waitFor(() => {
        const plusButton = screen.getByTestId('header-plus-button');
        fireEvent.press(plusButton);
      });

      // Fill form fields
      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('e.g., Career Mentorship Session');
        fireEvent.changeText(titleInput, 'Weekly Test Service');

        const descriptionInput = screen.getByPlaceholderText('Describe your service in detail...');
        fireEvent.changeText(descriptionInput, 'Test description that is at least 20 characters');

        const weeklyButton = screen.getByText('Weekly');
        fireEvent.press(weeklyButton);

        const weeklyPriceInput = screen.getByPlaceholderText('0.00');
        fireEvent.changeText(weeklyPriceInput, '29.99');

        const submitButton = screen.getByText('Create Service');
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(mockCreateConsultantApplication).toHaveBeenCalledWith({
          consultantId: 'test-user-id',
          type: 'new',
          customService: {
            title: 'Weekly Test Service',
            description: 'Test description that is at least 20 characters',
            price: 0,
            accessType: 'weekly',
            pricing: { weekly: 29.99 },
            imageUrl: undefined,
            imagePublicId: undefined,
          },
        });
      });
    });
  });

  describe('Service Editing', () => {
    it('should populate form with existing service data', async () => {
      const mockApplications = [
        {
          id: 'test-app-id',
          linkedServiceId: 'test-service-id',
          status: 'approved',
          customService: {
            title: 'Existing Service',
            description: 'Existing description that is at least 20 characters',
            price: 200,
            accessType: 'monthly',
            pricing: { monthly: 49.99 },
            category: 'Technology & Programming',
          },
        },
      ];

      mockGetConsultantApplications.mockResolvedValue(mockApplications);

      render(<ConsultantApplicationsScreen />);
      
      await waitFor(() => {
        // Find and press edit button for the service
        const editButton = screen.getByTestId(`edit-service-test-app-id`);
        fireEvent.press(editButton);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Existing Service')).toBeTruthy();
        expect(screen.getByDisplayValue('Existing description that is at least 20 characters')).toBeTruthy();
        expect(screen.getByText('Technology & Programming')).toBeTruthy();
      });
    });
  });
});
