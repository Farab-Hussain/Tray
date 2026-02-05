// app/__tests__/courseManagement.frontend.test.ts
// Comprehensive test suite for Course Management Frontend Interface

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { CourseManagementScreen } from '../src/Screen/Consultant/CourseManagement/CourseManagementScreen';
import { courseService } from '../src/services/course.service';

// Mock the course service
jest.mock('../src/services/course.service');
const mockedCourseService = courseService as jest.Mocked<typeof courseService>;

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: {
    add: 'AddIcon',
    create: 'CreateIcon',
    rocket: 'RocketIcon',
    trash: 'TrashIcon',
    search: 'SearchIcon',
    book: 'BookIcon',
  },
}));

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockCourses = [
  {
    id: 'course-1',
    title: 'Advanced React Development',
    description: 'Master React with advanced concepts',
    shortDescription: 'Advanced React course',
    category: 'Technology',
    level: 'advanced' as const,
    price: 9999,
    currency: 'USD',
    isFree: false,
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    duration: 7200,
    durationText: '2 hours',
    lessonsCount: 12,
    status: 'draft' as const,
    objectives: ['Master React hooks', 'Build scalable applications'],
    prerequisites: ['Basic React knowledge'],
    targetAudience: ['React developers'],
    difficultyScore: 8,
    timeCommitment: '10 hours per week',
    certificateAvailable: true,
    tags: ['react', 'javascript', 'frontend'],
    enrollmentCount: 0,
    completionCount: 0,
    averageRating: 0,
    ratingCount: 0,
    isLaunched: false,
    pricingOptions: {
      monthly: 1999,
      yearly: 19999,
      lifetime: 49999,
    },
  },
  {
    id: 'course-2',
    title: 'Node.js Fundamentals',
    description: 'Learn Node.js from scratch',
    shortDescription: 'Node.js basics',
    category: 'Technology',
    level: 'beginner' as const,
    price: 4999,
    currency: 'USD',
    isFree: false,
    thumbnailUrl: 'https://example.com/thumbnail2.jpg',
    duration: 5400,
    durationText: '1.5 hours',
    lessonsCount: 8,
    status: 'published' as const,
    objectives: ['Understand Node.js', 'Build basic servers'],
    prerequisites: ['JavaScript knowledge'],
    targetAudience: ['Beginners'],
    difficultyScore: 3,
    timeCommitment: '5 hours per week',
    certificateAvailable: true,
    tags: ['nodejs', 'javascript', 'backend'],
    enrollmentCount: 25,
    completionCount: 12,
    averageRating: 4.5,
    ratingCount: 8,
    isLaunched: true,
    pricingOptions: {
      monthly: 999,
      yearly: 9999,
      lifetime: 19999,
    },
  },
];

describe('Course Management Frontend Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <NavigationContainer>
        <CourseManagementScreen navigation={{} as any} />
      </NavigationContainer>
    );
  };

  describe('Course List Display', () => {
    it('should display loading state initially', async () => {
      mockedCourseService.getMyCourses.mockImplementation(() => new Promise(() => {}));

      renderComponent();

      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    });

    it('should display courses after loading', async () => {
      mockedCourseService.getMyCourses.mockResolvedValue(mockCourses);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Advanced React Development')).toBeTruthy();
        expect(screen.getByText('Node.js Fundamentals')).toBeTruthy();
      });
    });

    it('should display empty state when no courses', async () => {
      mockedCourseService.getMyCourses.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No courses found')).toBeTruthy();
      });
    });

    it('should filter courses by status tabs', async () => {
      mockedCourseService.getMyCourses.mockResolvedValue(mockCourses);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Advanced React Development')).toBeTruthy();
        expect(screen.getByText('Node.js Fundamentals')).toBeTruthy();
      });

      // Click on Published tab
      fireEvent.press(screen.getByText('Published'));

      await waitFor(() => {
        expect(screen.queryByText('Advanced React Development')).toBeFalsy();
        expect(screen.getByText('Node.js Fundamentals')).toBeTruthy();
      });

      // Click on Draft tab
      fireEvent.press(screen.getByText('Draft'));

      await waitFor(() => {
        expect(screen.getByText('Advanced React Development')).toBeTruthy();
        expect(screen.queryByText('Node.js Fundamentals')).toBeFalsy();
      });
    });

    it('should search courses by title and description', async () => {
      mockedCourseService.getMyCourses.mockResolvedValue(mockCourses);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Advanced React Development')).toBeTruthy();
        expect(screen.getByText('Node.js Fundamentals')).toBeTruthy();
      });

      // Search for "React"
      const searchInput = screen.getByPlaceholderText('Search courses...');
      fireEvent.changeText(searchInput, 'React');

      await waitFor(() => {
        expect(screen.getByText('Advanced React Development')).toBeTruthy();
        expect(screen.queryByText('Node.js Fundamentals')).toBeFalsy();
      });

      // Search for "Node"
      fireEvent.changeText(searchInput, 'Node');

      await waitFor(() => {
        expect(screen.queryByText('Advanced React Development')).toBeFalsy();
        expect(screen.getByText('Node.js Fundamentals')).toBeTruthy();
      });
    });
  });

  describe('Course Creation', () => {
    it('should open create course modal when add button is pressed', async () => {
      mockedCourseService.getMyCourses.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No courses found')).toBeTruthy();
      });

      // Press add button
      fireEvent.press(screen.getByTestId('add-course-button'));

      await waitFor(() => {
        expect(screen.getByText('Create New Course')).toBeTruthy();
      });
    });

    it('should validate required fields in create form', async () => {
      mockedCourseService.getMyCourses.mockResolvedValue([]);
      mockedCourseService.createCourse.mockRejectedValue(
        new Error('Title and description are required')
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No courses found')).toBeTruthy();
      });

      // Open create modal
      fireEvent.press(screen.getByTestId('add-course-button'));

      await waitFor(() => {
        expect(screen.getByText('Create New Course')).toBeTruthy();
      });

      // Try to proceed without filling required fields
      fireEvent.press(screen.getByText('Set Pricing'));

      await waitFor(() => {
        expect(screen.getByText('Title and description are required')).toBeTruthy();
      });
    });

    it('should create course with valid data', async () => {
      mockedCourseService.getMyCourses.mockResolvedValue([]);
      mockedCourseService.createCourse.mockResolvedValue({
        id: 'new-course-123',
        ...mockCourses[0],
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No courses found')).toBeTruthy();
      });

      // Open create modal
      fireEvent.press(screen.getByTestId('add-course-button'));

      await waitFor(() => {
        expect(screen.getByText('Create New Course')).toBeTruthy();
      });

      // Fill in course details
      fireEvent.changeText(screen.getByPlaceholderText('Course Title'), 'New Test Course');
      fireEvent.changeText(screen.getByPlaceholderText('Short Description'), 'A test course');
      fireEvent.changeText(screen.getByPlaceholderText('Full Description'), 'This is a detailed description of the test course');

      // Select category
      fireEvent.press(screen.getByText('Technology'));

      // Select level
      fireEvent.press(screen.getByText('beginner'));

      // Set price
      fireEvent.changeText(screen.getByPlaceholderText('0'), '9999');

      // Set duration
      fireEvent.changeText(screen.getByPlaceholderText('0'), '3600');
      fireEvent.changeText(screen.getByPlaceholderText('e.g., 2 hours 30 minutes'), '1 hour');

      // Set lessons count
      fireEvent.changeText(screen.getByPlaceholderText('0'), '10');

      // Proceed to pricing
      fireEvent.press(screen.getByText('Set Pricing'));

      await waitFor(() => {
        expect(screen.getByText('Course Pricing Options')).toBeTruthy();
      });

      // Set pricing options
      fireEvent.changeText(screen.getByPlaceholderText('Price in cents'), '1999'); // Monthly
      fireEvent.changeText(screen.getByPlaceholderText('Price in cents'), '19999'); // Yearly
      fireEvent.changeText(screen.getByPlaceholderText('Price in cents'), '49999'); // Lifetime

      // Create course
      fireEvent.press(screen.getByText('Create Course'));

      await waitFor(() => {
        expect(mockedCourseService.createCourse).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'New Test Course',
            description: 'This is a detailed description of the test course',
            category: 'Technology',
            level: 'beginner',
            price: 9999,
            pricingOptions: {
              monthly: 1999,
              yearly: 19999,
              lifetime: 49999,
            },
          })
        );
      });
    });
  });

  describe('Course Actions', () => {
    it('should open edit modal when edit button is pressed', async () => {
      mockedCourseService.getMyCourses.mockResolvedValue(mockCourses);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Advanced React Development')).toBeTruthy();
      });

      // Press edit button
      fireEvent.press(screen.getByTestId('edit-course-course-1'));

      await waitFor(() => {
        expect(screen.getByText('Course Pricing Options')).toBeTruthy();
      });
    });

    it('should launch course when launch button is pressed', async () => {
      mockedCourseService.getMyCourses.mockResolvedValue(mockCourses);
      mockedCourseService.launchCourse.mockResolvedValue({
        ...mockCourses[0],
        isLaunched: true,
        status: 'published',
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Advanced React Development')).toBeTruthy();
      });

      // Press launch button
      fireEvent.press(screen.getByTestId('launch-course-course-1'));

      await waitFor(() => {
        expect(mockedCourseService.launchCourse).toHaveBeenCalledWith('course-1');
      });
    });

    it('should show confirmation dialog when delete button is pressed', async () => {
      mockedCourseService.getMyCourses.mockResolvedValue(mockCourses);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Advanced React Development')).toBeTruthy();
      });

      // Press delete button
      fireEvent.press(screen.getByTestId('delete-course-course-1'));

      await waitFor(() => {
        expect(screen.getByText('Delete Course')).toBeTruthy();
        expect(screen.getByText('Are you sure you want to delete "Advanced React Development"?')).toBeTruthy();
      });
    });

    it('should delete course when confirmed', async () => {
      mockedCourseService.getMyCourses.mockResolvedValue(mockCourses);
      mockedCourseService.deleteCourse.mockResolvedValue();

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Advanced React Development')).toBeTruthy();
      });

      // Press delete button
      fireEvent.press(screen.getByTestId('delete-course-course-1'));

      await waitFor(() => {
        expect(screen.getByText('Delete Course')).toBeTruthy();
      });

      // Confirm deletion
      fireEvent.press(screen.getByText('Delete'));

      await waitFor(() => {
        expect(mockedCourseService.deleteCourse).toHaveBeenCalledWith('course-1');
      });
    });
  });

  describe('Course Status Display', () => {
    it('should show correct status badges', async () => {
      mockedCourseService.getMyCourses.mockResolvedValue(mockCourses);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('DRAFT')).toBeTruthy();
        expect(screen.getByText('PUBLISHED')).toBeTruthy();
      });
    });

    it('should show launched badge for launched courses', async () => {
      mockedCourseService.getMyCourses.mockResolvedValue(mockCourses);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('LAUNCHED')).toBeTruthy();
      });
    });

    it('should show course metadata', async () => {
      mockedCourseService.getMyCourses.mockResolvedValue(mockCourses);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Technology')).toBeTruthy();
        expect(screen.getByText('advanced')).toBeTruthy();
        expect(screen.getByText('0 students')).toBeTruthy();
        expect(screen.getByText('⭐ 0.0 (0)')).toBeTruthy();

        expect(screen.getByText('Technology')).toBeTruthy();
        expect(screen.getByText('beginner')).toBeTruthy();
        expect(screen.getByText('25 students')).toBeTruthy();
        expect(screen.getByText('⭐ 4.5 (8)')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when course loading fails', async () => {
      mockedCourseService.getMyCourses.mockRejectedValue(
        new Error('Failed to load courses')
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Failed to load courses')).toBeTruthy();
      });
    });

    it('should display error message when course creation fails', async () => {
      mockedCourseService.getMyCourses.mockResolvedValue([]);
      mockedCourseService.createCourse.mockRejectedValue(
        new Error('Failed to create course')
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No courses found')).toBeTruthy();
      });

      // Open create modal
      fireEvent.press(screen.getByTestId('add-course-button'));

      await waitFor(() => {
        expect(screen.getByText('Create New Course')).toBeTruthy();
      });

      // Fill form and try to create
      fireEvent.changeText(screen.getByPlaceholderText('Course Title'), 'Test Course');
      fireEvent.changeText(screen.getByPlaceholderText('Full Description'), 'Test Description');
      fireEvent.press(screen.getByText('Set Pricing'));

      await waitFor(() => {
        expect(screen.getByText('Course Pricing Options')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Create Course'));

      await waitFor(() => {
        expect(screen.getByText('Failed to create course')).toBeTruthy();
      });
    });
  });

  describe('Pull to Refresh', () => {
    it('should refresh courses when pulled to refresh', async () => {
      const { rerender } = renderComponent();
      
      mockedCourseService.getMyCourses.mockResolvedValue(mockCourses);

      // Simulate pull to refresh
      const refreshControl = screen.getByTestId('refresh-control');
      fireEvent(refreshControl, 'refresh');

      await waitFor(() => {
        expect(mockedCourseService.getMyCourses).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Form Interactions', () => {
    it('should toggle free course switch', async () => {
      mockedCourseService.getMyCourses.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No courses found')).toBeTruthy();
      });

      // Open create modal
      fireEvent.press(screen.getByTestId('add-course-button'));

      await waitFor(() => {
        expect(screen.getByText('Create New Course')).toBeTruthy();
      });

      // Toggle free course switch
      const freeSwitch = screen.getByTestId('free-course-switch');
      fireEvent(freeSwitch, 'valueChange', true);

      await waitFor(() => {
        expect(screen.getByText('Free Course')).toBeTruthy();
      });
    });

    it('should allow category selection', async () => {
      mockedCourseService.getMyCourses.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No courses found')).toBeTruthy();
      });

      // Open create modal
      fireEvent.press(screen.getByTestId('add-course-button'));

      await waitFor(() => {
        expect(screen.getByText('Create New Course')).toBeTruthy();
      });

      // Select different categories
      fireEvent.press(screen.getByText('Business'));
      fireEvent.press(screen.getByText('Design'));
      fireEvent.press(screen.getByText('Marketing'));

      await waitFor(() => {
        expect(screen.getByText('Business')).toBeTruthy();
        expect(screen.getByText('Design')).toBeTruthy();
        expect(screen.getByText('Marketing')).toBeTruthy();
      });
    });

    it('should allow level selection', async () => {
      mockedCourseService.getMyCourses.mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No courses found')).toBeTruthy();
      });

      // Open create modal
      fireEvent.press(screen.getByTestId('add-course-button'));

      await waitFor(() => {
        expect(screen.getByText('Create New Course')).toBeTruthy();
      });

      // Select different levels
      fireEvent.press(screen.getByText('intermediate'));
      fireEvent.press(screen.getByText('advanced'));

      await waitFor(() => {
        expect(screen.getByText('intermediate')).toBeTruthy();
        expect(screen.getByText('advanced')).toBeTruthy();
      });
    });
  });
});
