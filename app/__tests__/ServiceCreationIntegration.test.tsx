/**
 * Service Creation Integration Tests
 * Tests the complete flow from frontend to backend
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ConsultantApplicationsScreen from '../src/Screen/Consultant/Applications/ConsultantApplicationsScreen';
import { createConsultantApplication } from '../src/services/consultantFlow.service';

// Mock the services
jest.mock('../src/services/consultantFlow.service');
jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id', email: 'test@example.com' },
    refreshConsultantStatus: jest.fn(),
  }),
}));

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

const mockCreateConsultantApplication = createConsultantApplication as jest.MockedFunction<typeof createConsultantApplication>;

describe('Service Creation Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Service Creation Flow', () => {
    it('should create a one-time service successfully', async () => {
      mockCreateConsultantApplication.mockResolvedValue({
        id: 'test-app-id',
        status: 'pending',
        customService: {
          title: 'Test Career Service',
          description: 'This is a comprehensive career mentorship service that provides personalized guidance',
          price: 150,
          accessType: 'one-time',
          category: 'Business & Career',
        },
      });

      render(<ConsultantApplicationsScreen />);

      // Open the service creation form
      await waitFor(() => {
        const plusButton = screen.getByTestId('header-plus-button');
        fireEvent.press(plusButton);
      });

      // Fill in the form
      await waitFor(() => {
        // Title
        const titleInput = screen.getByPlaceholderText('e.g., Career Mentorship Session');
        fireEvent.changeText(titleInput, 'Test Career Service');

        // Description
        const descriptionInput = screen.getByPlaceholderText('Describe your service in detail...');
        fireEvent.changeText(descriptionInput, 'This is a comprehensive career mentorship service that provides personalized guidance');

        // Category
        const categoryButton = screen.getByText('Business & Career');
        fireEvent.press(categoryButton);

        // Submit
        const submitButton = screen.getByText('Create Service');
        fireEvent.press(submitButton);
      });

      // Verify the API call
      await waitFor(() => {
        expect(mockCreateConsultantApplication).toHaveBeenCalledWith({
          consultantId: 'test-user-id',
          type: 'new',
          customService: {
            title: 'Test Career Service',
            description: 'This is a comprehensive career mentorship service that provides personalized guidance',
            price: 150,
            accessType: 'one-time',
            category: 'Business & Career',
            imageUrl: undefined,
            imagePublicId: undefined,
          },
        });
      });

      // Verify success message
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Success',
          'Application submitted! It will be reviewed by admin.'
        );
      });
    });

    it('should create a weekly subscription service', async () => {
      mockCreateConsultantApplication.mockResolvedValue({
        id: 'test-app-id',
        status: 'pending',
        customService: {
          title: 'Weekly Programming Service',
          description: 'Weekly programming mentorship with code reviews and guidance',
          accessType: 'weekly',
          pricing: { weekly: 29.99 },
        },
      });

      render(<ConsultantApplicationsScreen />);

      // Open the service creation form
      await waitFor(() => {
        const plusButton = screen.getByTestId('header-plus-button');
        fireEvent.press(plusButton);
      });

      // Fill in the form
      await waitFor(() => {
        // Title
        const titleInput = screen.getByPlaceholderText('e.g., Career Mentorship Session');
        fireEvent.changeText(titleInput, 'Weekly Programming Service');

        // Description
        const descriptionInput = screen.getByPlaceholderText('Describe your service in detail...');
        fireEvent.changeText(descriptionInput, 'Weekly programming mentorship with code reviews and guidance');

        // Access Type
        const weeklyButton = screen.getByText('Weekly');
        fireEvent.press(weeklyButton);

        // Weekly Price
        const weeklyPriceInput = screen.getByPlaceholderText('0.00');
        fireEvent.changeText(weeklyPriceInput, '29.99');

        // Category
        const categoryButton = screen.getByText('Technology & Programming');
        fireEvent.press(categoryButton);

        // Submit
        const submitButton = screen.getByText('Create Service');
        fireEvent.press(submitButton);
      });

      // Verify the API call
      await waitFor(() => {
        expect(mockCreateConsultantApplication).toHaveBeenCalledWith({
          consultantId: 'test-user-id',
          type: 'new',
          customService: {
            title: 'Weekly Programming Service',
            description: 'Weekly programming mentorship with code reviews and guidance',
            price: 0,
            accessType: 'weekly',
            pricing: { weekly: 29.99 },
            category: 'Technology & Programming',
            imageUrl: undefined,
            imagePublicId: undefined,
          },
        });
      });
    });

    it('should handle custom category creation', async () => {
      mockCreateConsultantApplication.mockResolvedValue({
        id: 'test-app-id',
        status: 'pending',
        customService: {
          title: 'Custom Service',
          description: 'Service with custom category',
          price: 100,
          accessType: 'one-time',
          category: 'Custom Test Category',
        },
      });

      render(<ConsultantApplicationsScreen />);

      // Open the service creation form
      await waitFor(() => {
        const plusButton = screen.getByTestId('header-plus-button');
        fireEvent.press(plusButton);
      });

      // Fill in the form with custom category
      await waitFor(() => {
        // Title
        const titleInput = screen.getByPlaceholderText('e.g., Career Mentorship Session');
        fireEvent.changeText(titleInput, 'Custom Service');

        // Description
        const descriptionInput = screen.getByPlaceholderText('Describe your service in detail...');
        fireEvent.changeText(descriptionInput, 'Service with custom category');

        // Add Custom Category
        const addCategoryButton = screen.getByTestId('add-category-button');
        fireEvent.press(addCategoryButton);

        // Enter custom category name
        const customCategoryInput = screen.getByPlaceholderText('Enter your custom category');
        fireEvent.changeText(customCategoryInput, 'Custom Test Category');

        // Add the category
        const addButton = screen.getByText('Add');
        fireEvent.press(addButton);

        // Submit
        const submitButton = screen.getByText('Create Service');
        fireEvent.press(submitButton);
      });

      // Verify the API call includes the custom category
      await waitFor(() => {
        expect(mockCreateConsultantApplication).toHaveBeenCalledWith({
          consultantId: 'test-user-id',
          type: 'new',
          customService: {
            title: 'Custom Service',
            description: 'Service with custom category',
            price: 150,
            accessType: 'one-time',
            category: 'Custom Test Category',
            imageUrl: undefined,
            imagePublicId: undefined,
          },
        });
      });
    });

    it('should validate form and show errors', async () => {
      mockCreateConsultantApplication.mockRejectedValue({
        response: {
          data: {
            errors: ['Title is required', 'Description must be at least 20 characters']
          }
        }
      });

      render(<ConsultantApplicationsScreen />);

      // Open the service creation form
      await waitFor(() => {
        const plusButton = screen.getByTestId('header-plus-button');
        fireEvent.press(plusButton);
      });

      // Try to submit without filling required fields
      await waitFor(() => {
        const submitButton = screen.getByText('Create Service');
        fireEvent.press(submitButton);
      });

      // Verify error message
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('', 'Please fix the errors before submitting');
      });
    });

    it('should handle API errors gracefully', async () => {
      mockCreateConsultantApplication.mockRejectedValue(new Error('Network error'));

      render(<ConsultantApplicationsScreen />);

      // Open the service creation form
      await waitFor(() => {
        const plusButton = screen.getByTestId('header-plus-button');
        fireEvent.press(plusButton);
      });

      // Fill and submit form
      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('e.g., Career Mentorship Session');
        fireEvent.changeText(titleInput, 'Test Service');

        const descriptionInput = screen.getByPlaceholderText('Describe your service in detail...');
        fireEvent.changeText(descriptionInput, 'This is a valid service description that is at least 20 characters long');

        const submitButton = screen.getByText('Create Service');
        fireEvent.press(submitButton);
      });

      // Verify error handling
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to submit application. Please try again.'
        );
      });
    });
  });

  describe('Dynamic Pricing Integration', () => {
    it('should handle all access types correctly', async () => {
      const accessTypes = [
        { type: 'monthly', price: 49.99, expectedPricing: { monthly: 49.99 } },
        { type: 'yearly', price: 499.99, expectedPricing: { yearly: 499.99 } },
        { type: 'lifetime', price: 999.99, expectedPricing: { lifetime: 999.99 } },
      ];

      for (const accessType of accessTypes) {
        // Reset mock
        jest.clearAllMocks();
        mockCreateConsultantApplication.mockResolvedValue({
          id: 'test-app-id',
          status: 'pending',
        });

        render(<ConsultantApplicationsScreen />);

        // Open form
        await waitFor(() => {
          const plusButton = screen.getByTestId('header-plus-button');
          fireEvent.press(plusButton);
        });

        // Fill form with specific access type
        await waitFor(() => {
          const titleInput = screen.getByPlaceholderText('e.g., Career Mentorship Session');
          fireEvent.changeText(titleInput, `${accessType.type} Service`);

          const descriptionInput = screen.getByPlaceholderText('Describe your service in detail...');
          fireEvent.changeText(descriptionInput, `This is a ${accessType.type} service description that is at least 20 characters long`);

          const accessTypeButton = screen.getByText(accessType.type.charAt(0).toUpperCase() + accessType.type.slice(1));
          fireEvent.press(accessTypeButton);

          // Set price based on access type
          const priceInput = screen.getByPlaceholderText('0.00');
          fireEvent.changeText(priceInput, accessType.price.toString());

          const submitButton = screen.getByText('Create Service');
          fireEvent.press(submitButton);
        });

        // Verify correct pricing structure
        await waitFor(() => {
          expect(mockCreateConsultantApplication).toHaveBeenCalledWith({
            consultantId: 'test-user-id',
            type: 'new',
            customService: {
              title: `${accessType.type} Service`,
              description: `This is a ${accessType.type} service description that is at least 20 characters long`,
              price: 0,
              accessType: accessType.type,
              pricing: accessType.expectedPricing,
              imageUrl: undefined,
              imagePublicId: undefined,
            },
          });
        });
      }
    });
  });
});
