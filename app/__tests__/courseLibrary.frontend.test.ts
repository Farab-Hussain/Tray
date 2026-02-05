// __tests__/courseLibrary.frontend.test.ts
// Frontend tests for Course Library functionality

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CourseLibraryScreen } from '../src/Screen/Student/Course/CourseLibraryScreen';
import { courseService } from '../src/services/course.service';

// Mock the course service
jest.mock('../src/services/course.service');
const mockedCourseService = courseService as jest.Mocked<typeof courseService>;

describe('Course Library Frontend Tests', () => {
  const mockCourses = [
    {
      id: '1',
      title: 'Introduction to React Native',
      description: 'A comprehensive introduction to React Native development',
      shortDescription: 'Learn the basics of React Native',
      instructorId: 'instructor-1',
      instructorName: 'John Doe',
      instructorBio: 'Experienced React Native developer',
      instructorAvatar: 'https://example.com/avatar.jpg',
      category: 'Technology',
      subcategory: 'Mobile Development',
      tags: ['React Native', 'Mobile', 'Beginner'],
      level: 'beginner',
      language: 'English',
      price: 0,
      currency: 'USD',
      isFree: true,
      thumbnailUrl: 'https://example.com/thumbnail.jpg',
      previewVideoUrl: 'https://example.com/preview.mp4',
      duration: 3600,
      durationText: '1 hour',
      lessonsCount: 10,
      status: 'published',
      objectives: ['Learn React Native basics', 'Build simple apps'],
      prerequisites: ['Basic JavaScript knowledge'],
      targetAudience: ['Beginners to mobile development'],
      difficultyScore: 2,
      timeCommitment: '2 hours per week',
      certificateAvailable: true,
      enrollmentCount: 150,
      completionCount: 120,
      averageRating: 4.5,
      ratingCount: 30,
      reviewCount: 25,
      featured: true,
      trending: false,
      bestseller: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Advanced TypeScript',
      description: 'Master advanced TypeScript concepts and patterns',
      shortDescription: 'Master TypeScript concepts',
      instructorId: 'instructor-2',
      instructorName: 'Jane Smith',
      instructorBio: 'TypeScript expert and educator',
      instructorAvatar: 'https://example.com/ts-avatar.jpg',
      category: 'Technology',
      subcategory: 'Programming Languages',
      tags: ['TypeScript', 'Advanced', 'Programming'],
      level: 'advanced',
      language: 'English',
      price: 4999,
      currency: 'USD',
      isFree: false,
      thumbnailUrl: 'https://example.com/ts-thumbnail.jpg',
      previewVideoUrl: 'https://example.com/ts-preview.mp4',
      duration: 7200,
      durationText: '2 hours',
      lessonsCount: 20,
      status: 'published',
      objectives: ['Master TypeScript', 'Learn advanced patterns'],
      prerequisites: ['JavaScript knowledge required'],
      targetAudience: ['Experienced developers'],
      difficultyScore: 8,
      timeCommitment: '4 hours per week',
      certificateAvailable: true,
      enrollmentCount: 75,
      completionCount: 60,
      averageRating: 4.8,
      ratingCount: 25,
      reviewCount: 20,
      featured: false,
      trending: true,
      bestseller: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ] as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders course library screen correctly', async () => {
    mockedCourseService.searchCourses.mockResolvedValue({
      courses: mockCourses,
      total: 2,
      page: 1,
      limit: 20,
      hasMore: false,
    } as any);

    const { getByText, getByPlaceholderText } = render(<CourseLibraryScreen />););

    await waitFor(() => {
      expect(getByText('Course Library')).toBeTruthy();
      expect(getByText('Introduction to React Native')).toBeTruthy();
      expect(getByText('Advanced TypeScript')).toBeTruthy();
    });
  });

  test('displays search functionality', async () => {
    mockedCourseService.searchCourses.mockResolvedValue({
      courses: mockCourses,
      total: 2,
      page: 1,
      limit: 20,
      hasMore: false,
    } as any);

    const { getByPlaceholderText } = render(<CourseLibraryScreen />);

    await waitFor(() => {
      expect(getByPlaceholderText('Search courses...')).toBeTruthy();
    });
  });

  test('handles course search', async () => {
    const searchResult = {
      courses: [mockCourses[0]],
      total: 1,
      page: 1,
      limit: 20,
      hasMore: false,
    } as any;

    mockedCourseService.searchCourses.mockResolvedValue(searchResult);

    const { getByPlaceholderText } = render(<CourseLibraryScreen />);
    const searchInput = getByPlaceholderText('Search courses...');

    await waitFor(() => {
      fireEvent.changeText(searchInput, 'React Native');
      fireEvent(searchInput, 'submitEditing');
    });

    expect(mockedCourseService.searchCourses).toHaveBeenCalledWith({
      search: 'React Native',
      page: 1,
      limit: 20,
    });
  });

  test('displays filter options', async () => {
    mockedCourseService.searchCourses.mockResolvedValue({
      courses: mockCourses,
      total: 2,
      page: 1,
      limit: 20,
      hasMore: false,
    } as any);

    const { getByText } = render(<CourseLibraryScreen />);

    await waitFor(() => {
      expect(getByText('All Categories')).toBeTruthy();
      expect(getByText('All Levels')).toBeTruthy();
      expect(getByText('Price')).toBeTruthy();
    });
  });

  test('handles category filtering', async () => {
    const filteredResult = {
      courses: [mockCourses[1]], // Only TypeScript course
      total: 1,
      page: 1,
      limit: 20,
      hasMore: false,
    };

    mockedCourseService.searchCourses.mockResolvedValue(filteredResult);

    const { getByText } = render(<CourseLibraryScreen />);

    await waitFor(() => {
      fireEvent.press(getByText('All Categories'));
      fireEvent.press(getByText('Technology'));
    });

    expect(mockedCourseService.searchCourses).toHaveBeenCalledWith({
      category: 'Technology',
      page: 1,
      limit: 20,
    });
  });

  test('handles level filtering', async () => {
    const filteredResult = {
      courses: [mockCourses[1]], // Only advanced course
      total: 1,
      page: 1,
      limit: 20,
      hasMore: false,
    };

    mockedCourseService.searchCourses.mockResolvedValue(filteredResult);

    const { getByText } = render(<CourseLibraryScreen />);

    await waitFor(() => {
      fireEvent.press(getByText('All Levels'));
      fireEvent.press(getByText('Advanced'));
    });

    expect(mockedCourseService.searchCourses).toHaveBeenCalledWith({
      level: 'advanced',
      page: 1,
      limit: 20,
    });
  });

  test('handles price filtering', async () => {
    const filteredResult = {
      courses: [mockCourses[0]], // Only free course
      total: 1,
      page: 1,
      limit: 20,
      hasMore: false,
    };

    mockedCourseService.searchCourses.mockResolvedValue(filteredResult);

    const { getByText } = render(<CourseLibraryScreen />);

    await waitFor(() => {
      fireEvent.press(getByText('Price'));
      fireEvent.press(getByText('Free'));
    });

    expect(mockedCourseService.searchCourses).toHaveBeenCalledWith({
      isFree: true,
      page: 1,
      limit: 20,
    });
  });

  test('displays course cards with correct information', async () => {
    mockedCourseService.searchCourses.mockResolvedValue({
      courses: mockCourses,
      total: 2,
      page: 1,
      limit: 20,
      hasMore: false,
    } as any);

    const { getByText } = render(<CourseLibraryScreen />);

    await waitFor(() => {
      // Check first course
      expect(getByText('Introduction to React Native')).toBeTruthy();
      expect(getByText('Learn the basics of React Native')).toBeTruthy();
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('Technology')).toBeTruthy();
      expect(getByText('beginner')).toBeTruthy();
      expect(getByText('Free')).toBeTruthy();
      expect(getByText('1 hour')).toBeTruthy();
      expect(getByText('10 lessons')).toBeTruthy();
      expect(getByText('4.5')).toBeTruthy(); // Rating
      expect(getByText('150 enrolled')).toBeTruthy();

      // Check second course
      expect(getByText('Advanced TypeScript')).toBeTruthy();
      expect(getByText('Master TypeScript concepts')).toBeTruthy();
      expect(getByText('Jane Smith')).toBeTruthy();
      expect(getByText('Advanced')).toBeTruthy();
      expect(getByText('$49.99')).toBeTruthy();
      expect(getByText('2 hours')).toBeTruthy();
      expect(getByText('20 lessons')).toBeTruthy();
      expect(getByText('4.8')).toBeTruthy(); // Rating
      expect(getByText('75 enrolled')).toBeTruthy();
    });
  });

  test('handles course card press', async () => {
    mockedCourseService.getCourseById.mockResolvedValue(mockCourses[0] as any);

    const { getByText } = render(<CourseLibraryScreen />);

    await waitFor(() => {
      const courseCard = getByText('Introduction to React Native').parent;
      if (courseCard) {
        fireEvent.press(courseCard);
      }
    });

    // Verify navigation to course details
    await waitFor(() => {
      expect(mockedCourseService.getCourseById).toHaveBeenCalledWith('1');
    });
  });

  test('displays loading state', async () => {
    // Mock delayed response
    mockedCourseService.searchCourses.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        courses: mockCourses,
        total: 2,
        page: 1,
        limit: 20,
        hasMore: false,
      }), 100))
    );

    const { getByTestId } = render(<CourseLibraryScreen />);

    // Should show loading indicator
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  test('displays empty state when no courses', async () => {
    mockedCourseService.searchCourses.mockResolvedValue({
      courses: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false,
    });

    const { getByText } = render(<CourseLibraryScreen />);

    await waitFor(() => {
      expect(getByText('No courses found')).toBeTruthy();
      expect(getByText('Try adjusting your filters or search terms')).toBeTruthy();
    });
  });

  test('handles pull-to-refresh', async () => {
    const refreshResult = {
      courses: mockCourses,
      total: 2,
      page: 1,
      limit: 20,
      hasMore: false,
    };

    mockedCourseService.searchCourses.mockResolvedValue(refreshResult);

    const { getByTestId } = render(<CourseLibraryScreen />);

    await waitFor(() => {
      const refreshControl = getByTestId('refresh-control');
      if (refreshControl) {
        fireEvent(refreshControl, 'refresh');
      }
    });

    // Should call search again with current filters
    await waitFor(() => {
      expect(mockedCourseService.searchCourses).toHaveBeenCalledTimes(2); // Initial load + refresh
    });
  });

  test('handles pagination', async () => {
    const firstPageResult = {
      courses: [mockCourses[0]],
      total: 2,
      page: 1,
      limit: 1,
      hasMore: true,
    };

    const secondPageResult = {
      courses: [mockCourses[1]],
      total: 2,
      page: 2,
      limit: 1,
      hasMore: false,
    };

    mockedCourseService.searchCourses
      .mockResolvedValueOnce(firstPageResult)
      .mockResolvedValueOnce(secondPageResult);

    const { getByText } = render(<CourseLibraryScreen />);

    await waitFor(() => {
      expect(getByText('Load More')).toBeTruthy();
    });

    // Load more courses
    fireEvent.press(getByText('Load More'));

    await waitFor(() => {
      expect(mockedCourseService.searchCourses).toHaveBeenCalledWith({
        page: 2,
        limit: 1,
      });
      expect(getByText('Advanced TypeScript')).toBeTruthy(); // Second course should appear
    });
  });

  test('displays featured courses section', async () => {
    const featuredCourses = [mockCourses[0]]; // First course is featured

    mockedCourseService.getFeaturedCourses.mockResolvedValue(featuredCourses as any);

    const { getByText } = render(<CourseLibraryScreen />);

    await waitFor(() => {
      expect(getByText('Featured Courses')).toBeTruthy();
      expect(getByText('Introduction to React Native')).toBeTruthy();
    });
  });

  test('displays trending courses section', async () => {
    const trendingCourses = [mockCourses[1]]; // Second course is trending

    mockedCourseService.getTrendingCourses.mockResolvedValue(trendingCourses as any);

    const { getByText } = render(<CourseLibraryScreen />);

    await waitFor(() => {
      expect(getByText('Trending Courses')).toBeTruthy();
      expect(getByText('Advanced TypeScript')).toBeTruthy();
    });
  });

  test('displays bestseller courses section', async () => {
    const bestsellerCourses = [mockCourses[1]]; // Second course is bestseller

    mockedCourseService.getBestsellerCourses.mockResolvedValue(bestsellerCourses as any);

    const { getByText } = render(<CourseLibraryScreen />);

    await waitFor(() => {
      expect(getByText('Bestseller Courses')).toBeTruthy();
      expect(getByText('Advanced TypeScript')).toBeTruthy();
    });
  });

  test('handles error states gracefully', async () => {
    mockedCourseService.searchCourses.mockRejectedValue(new Error('Network error'));

    const { getByText } = render(<CourseLibraryScreen />);

    await waitFor(() => {
      expect(getByText('Failed to load courses')).toBeTruthy();
      expect(getByText('Please try again later')).toBeTruthy();
    });
  });
});

console.log('✅ Course Library Frontend Tests Completed');
