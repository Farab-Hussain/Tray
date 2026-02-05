// __tests__/courseLibrary.simple.test.ts
// Simple test for course library frontend

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CourseLibraryScreen } from '../src/Screen/Student/Course/CourseLibraryScreen';

// Mock the course service
jest.mock('../src/services/course.service');

describe('Course Library Simple Test', () => {
  test('renders without crashing', () => {
    const { getByTestId } = render(<CourseLibraryScreen />);
    
    // Should render the main container
    expect(getByTestId('course-library-container')).toBeTruthy();
  });

  test('displays search input', () => {
    const { getByPlaceholderText } = render(<CourseLibraryScreen />);
    
    expect(getByPlaceholderText('Search courses...')).toBeTruthy();
  });

  test('displays course sections', () => {
    const { getByText } = render(<CourseLibraryScreen />);
    
    // Should display main sections
    expect(getByText('Featured Courses')).toBeTruthy();
    expect(getByText('Trending Courses')).toBeTruthy();
    expect(getByText('Bestseller Courses')).toBeTruthy();
  });
});

console.log('✅ Course Library Simple Test Completed');
