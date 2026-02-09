// app/__tests__/consultantServices.basic.test.ts
// Basic test for ConsultantServices integration

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ConsultantServices from '../src/Screen/Consultant/Services/ConsultantServices';

// Mock the services
jest.mock('../src/services/course.service');
jest.mock('../src/services/consultant.service');
jest.mock('../src/services/consultantFlow.service');

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: jest.fn(),
}));

describe('ConsultantServices Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    const navigation = { navigate: jest.fn() };
    
    expect(() => {
      render(
        <ConsultantServices navigation={navigation as any} />
      );
    }).not.toThrow();
  });

  it('should display loading state initially', () => {
    const navigation = { navigate: jest.fn() };
    
    render(
      <ConsultantServices navigation={navigation as any} />
    );

    expect(screen.getByText('Loading your services...')).toBeTruthy();
  });

  it('should display Add New Service button', async () => {
    // Mock successful responses
    const mockGetConsultantVerificationStatus = require('../src/services/consultantFlow.service').getConsultantVerificationStatus;
    const mockGetConsultantServices = require('../src/services/consultant.service').ConsultantService.getConsultantServices;
    
    mockGetConsultantVerificationStatus.mockResolvedValue({
      hasProfile: true,
      status: 'approved',
      message: 'Profile approved',
      nextStep: 'completed',
      profile: { uid: 'test-consultant-uid' },
    });

    mockGetConsultantServices.mockResolvedValue({
      services: [],
    });

    const navigation = { navigate: jest.fn() };
    
    render(
      <ConsultantServices navigation={navigation as any} />
    );

    await waitFor(() => {
      expect(screen.getByText('+ Add New Service')).toBeTruthy();
    });
  });

  it('should open modal when Add New Service is pressed', async () => {
    // Mock successful responses
    const mockGetConsultantVerificationStatus = require('../src/services/consultantFlow.service').getConsultantVerificationStatus;
    const mockGetConsultantServices = require('../src/services/consultant.service').ConsultantService.getConsultantServices;
    
    mockGetConsultantVerificationStatus.mockResolvedValue({
      hasProfile: true,
      status: 'approved',
      message: 'Profile approved',
      nextStep: 'completed',
      profile: { uid: 'test-consultant-uid' },
    });

    mockGetConsultantServices.mockResolvedValue({
      services: [],
    });

    const navigation = { navigate: jest.fn() };
    
    render(
      <ConsultantServices navigation={navigation as any} />
    );

    await waitFor(() => {
      const addButton = screen.getByText('+ Add New Service');
      fireEvent.press(addButton);
      
      expect(screen.getByText('Create New Service')).toBeTruthy();
    });
  });
});
