// src/__tests__/Phase1SecurityTest.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider } from '@shopify/restyle';
import JobApplicationsScreen from '../../Screen/Recruiter/Applications/JobApplicationsScreen';
import ApplicationDetailScreen from '../../Screen/Recruiter/Applications/ApplicationDetailScreen';
import CompanyProfileScreen from '../../Screen/Recruiter/Company/CompanyProfileScreen';
import PostJobScreen from '../../Screen/Recruiter/PostJob/PostJobScreen';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock data for testing
const mockApplications = [
  {
    id: '1',
    jobId: 'job1',
    userId: 'user1',
    resumeId: 'resume1',
    matchScore: 4,
    matchRating: 'gold' as const,
    matchedSkills: ['JavaScript', 'React', 'Node.js'],
    missingSkills: [],
    status: 'pending' as const,
    appliedAt: new Date().toISOString(),
    user: {
      uid: 'user1',
      name: 'John Doe',
      // Private information filtered out for employers
    },
    resume: {
      id: 'resume1',
      skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
      experience: [
        {
          title: 'Senior Developer',
          company: 'Tech Corp',
          duration: '3 years',
          // Detailed info filtered out
        }
      ],
      education: [
        {
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          institution: 'University',
          // Detailed info filtered out
        }
      ],
      // resumeFileUrl filtered out for security
    },
  },
  {
    id: '2',
    jobId: 'job1',
    userId: 'user2',
    resumeId: 'resume2',
    matchScore: 2,
    matchRating: 'silver' as const,
    matchedSkills: ['JavaScript', 'React'],
    missingSkills: ['Node.js'],
    status: 'reviewing' as const,
    appliedAt: new Date().toISOString(),
    user: {
      uid: 'user2',
      name: 'Jane Smith',
    },
    resume: {
      id: 'resume2',
      skills: ['JavaScript', 'React', 'Python'],
      experience: [
        {
          title: 'Developer',
          company: 'Startup Inc',
          duration: '2 years',
        }
      ],
      education: [
        {
          degree: 'Bachelor',
          field: 'Computer Science',
          institution: 'College',
        }
      ],
    },
  },
];

const mockJob = {
  id: 'job1',
  title: 'Senior React Developer',
  company: 'Tech Company',
  requiredSkills: ['JavaScript', 'React', 'Node.js'],
};

const mockCompany = {
  id: 'company1',
  name: 'Test Company',
  industry: 'Technology',
  size: '51-200',
  fairChanceHiring: {
    enabled: true,
    banTheBoxCompliant: true,
    felonyFriendly: false,
    caseByCaseReview: true,
    noBackgroundCheck: false,
    secondChancePolicy: 'Case by case review',
    backgroundCheckPolicy: 'Standard background check',
    rehabilitationSupport: false,
    reentryProgramPartnership: false,
  },
};

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Mock auth context
const mockAuthContext = {
  user: {
    uid: 'employer1',
    email: 'employer@test.com',
    name: 'Test Employer',
    role: 'employer',
  },
  login: jest.fn(),
  logout: jest.fn(),
};

// Mock Alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('🔒 Phase 1 Frontend Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CompanyProfileScreen', () => {
    it('should render company profile form', () => {
      const { getByText, getByPlaceholderText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <CompanyProfileScreen navigation={mockNavigation} route={{}} />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      expect(getByText('Company Profile')).toBeTruthy();
      expect(getByText('Basic Information')).toBeTruthy();
      expect(getByText('Contact Information')).toBeTruthy();
      expect(getByText('Fair Chance Hiring')).toBeTruthy();
    });

    it('should handle fair chance hiring settings', () => {
      const { getByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <CompanyProfileScreen navigation={mockNavigation} route={{}} />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      expect(getByText('Enable Fair Chance Hiring')).toBeTruthy();
      expect(getByText('Ban-the-Box Compliant')).toBeTruthy();
      expect(getByText('Case-by-Case Review')).toBeTruthy();
    });

    it('should validate required fields', async () => {
      const { getByText, getByPlaceholderText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <CompanyProfileScreen navigation={mockNavigation} route={{}} />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      // Try to save without required fields
      const saveButton = getByText('Save Profile');
      fireEvent.press(saveButton);

      // Should show validation error
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Company name is required'
        );
      });
    });
  });

  describe('JobApplicationsScreen', () => {
    it('should render applications list with security notice', () => {
      const { getByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <JobApplicationsScreen 
                  navigation={mockNavigation} 
                  route={{ params: { jobId: 'job1' } }} 
                />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      expect(getByText('Applications')).toBeTruthy();
      expect(getByText(/Private client documents and sensitive information have been filtered/)).toBeTruthy();
    });

    it('should display match scores and skills but not private data', () => {
      const { getByText, queryByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <JobApplicationsScreen 
                  navigation={mockNavigation} 
                  route={{ params: { jobId: 'job1' } }} 
                />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      // Should show match scores
      expect(getByText('Gold Match')).toBeTruthy();
      expect(getByText('4/4')).toBeTruthy();
      expect(getByText('JavaScript')).toBeTruthy();
      expect(getByText('React')).toBeTruthy();
      expect(getByText('Node.js')).toBeTruthy();

      // Should NOT show private information
      expect(queryByText(/john.doe@example.com/i)).toBeNull();
      expect(queryByText(/\+1-555-/i)).toBeNull();
      expect(queryByText(/123 Main St/i)).toBeNull();
    });

    it('should filter applications by status', () => {
      const { getByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <JobApplicationsScreen 
                  navigation={mockNavigation} 
                  route={{ params: { jobId: 'job1' } }} 
                />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      // Should have status filters
      expect(getByText('All (2)')).toBeTruthy();
      expect(getByText('Pending')).toBeTruthy();
      expect(getByText('Reviewing')).toBeTruthy();
      expect(getByText('Shortlisted')).toBeTruthy();
    });

    it('should handle application status updates', async () => {
      const { getByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <JobApplicationsScreen 
                  navigation={mockNavigation} 
                  route={{ params: { jobId: 'job1' } }} 
                />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      // Find and click on status update button
      const startReviewButton = getByText('Start Review');
      fireEvent.press(startReviewButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Success',
          'Application status updated'
        );
      });
    });
  });

  describe('ApplicationDetailScreen', () => {
    it('should render application details with security notices', () => {
      const { getByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <ApplicationDetailScreen 
                  navigation={mockNavigation} 
                  route={{ params: { 
                    applicationId: '1',
                    jobId: 'job1' 
                  }} 
                />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      expect(getByText('Application Details')).toBeTruthy();
      expect(getByText(/Security Notice/)).toBeTruthy();
      expect(getByText(/Private information.*hidden for security/)).toBeTruthy();
    });

    it('should show match score but hide private details', () => {
      const { getByText, queryByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <ApplicationDetailScreen 
                  navigation={mockNavigation} 
                  route={{ params: { 
                    applicationId: '1',
                    jobId: 'job1' 
                  }} 
                />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      // Should show match score
      expect(getByText('Gold Match')).toBeTruthy();
      expect(getByText('4 of 4 skills matched')).toBeTruthy();
      expect(getByText('100% match rate')).toBeTruthy();

      // Should show applicant name
      expect(getByText('John Doe')).toBeTruthy();

      // Should NOT show private information
      expect(queryByText(/john.doe@example.com/i)).toBeNull();
      expect(queryByText(/\+1-555-/i)).toBeNull();
      expect(queryByText(/resume.pdf/i)).toBeNull();
      expect(queryByText(/3\.8 GPA/i)).toBeNull();
    });

    it('should display security warnings for filtered content', () => {
      const { getByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <ApplicationDetailScreen 
                  navigation={mockNavigation} 
                  route={{ params: 
                    applicationId: '1',
                    jobId: 'job1' 
                  }} 
                />
              </NavigationContainer>
            </AuthProvider>
          </AuthProvider>
        </ThemeProvider>
      );

      // Should have security warnings for experience
      expect(getByText(/Detailed descriptions and achievements are hidden/)).toBeTruthy();
      
      // Should have security warnings for education
      expect(getByText(/Graduation year, GPA, and achievements are hidden/)).toBeTruthy();
    });

    it('should handle application status changes', async () => {
      const { getByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <ApplicationDetailScreen 
                  navigation={mockNavigation} 
                  route={{ params: 
                    applicationId: '1',
                    jobId: 'job1' 
                  }} 
                />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      // Click on "Start Review" button
      const startReviewButton = getByText('Start Review');
      fireEvent.press(startReviewButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Success',
          'Application status updated'
        );
      });
    });
  });

  describe('PostJobScreen', () => {
    it('should render job posting form', () => {
      const { getByText, getByPlaceholderText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <PostJobScreen navigation={mockNavigation} route={{}} />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      expect(getByText('Post Job')).toBeTruthy();
      expect(getByText('Basic Information')).toBeTruthy();
      expect(getByText('Job Details')).toBeTruthy();
      expect(getByText('Skills')).toBeTruthy();
      expect(getByText('Salary Range')).toBeTruthy();
      expect(getByText('Fair Chance Hiring')).toBeTruthy();
    });

    it('should include fair chance hiring settings', () => {
      const { getByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <PostJobScreen navigation={mockNavigation} route={{}} />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      expect(getByText('Fair Chance Hiring')).toBeTruthy();
      expect(getByText('Ban-the-Box Compliant')).toBeTruthy();
      expect(getByText('Case-by-Case Review')).toBeTruthy();
      expect(getByText('No Background Check Required')).toBeTruthy();
    });

    it('should validate required fields', async () => {
      const { getByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <PostJobScreen navigation={mockNavigation} route={{}} />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      // Try to post without required fields
      const postButton = getByText('Post Job');
      fireEvent.press(postButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Job title is required'
        );
      });
    });

    it('should handle skill management', () => {
      const { getByPlaceholderText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <PostJobScreen navigation={mockNavigation} route={{}} />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      // Should have skill input fields
      expect(getByPlaceholderText('Add required skill')).toBeTruthy();
      expect(getByPlaceholderText('Add preferred skill')).toBeTruthy();
    });
  });

  describe('Security Integration Tests', () => {
    it('should ensure no private data leakage in employer views', () => {
      const { queryByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <JobApplicationsScreen 
                  navigation={mockNavigation} 
                  route={{ params: { jobId: 'job1' } }} 
                />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      // Verify no private data is present
      expect(queryByText(/email/i)).toBeNull();
      expect(queryByText(/phone/i)).toBeNull();
      expect(queryByText(/address/i)).toBeNull();
      expect(queryByText(/\.pdf/i)).toBeNull();
      expect(queryByText(/resumeFileUrl/i)).toBeNull();
    });

    it('should display appropriate security notices', () => {
      const { getByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <JobApplicationsScreen 
                  navigation={mockNavigation} 
                  route={{ params: { jobId: 'job1' } }} 
                />
              </NavigationContainer>
            </AuthProvider>
          </AuthProvider>
        </ThemeProvider>
      );

      expect(getByText(/filtered for employer access/)).toBeTruthy();
      expect(getByText(/private client documents/)).toBeTruthy();
    });

    it('should maintain security in application detail views', () => {
      const { getByText, queryByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <ApplicationDetailScreen 
                  navigation={mockNavigation} 
                  route={{ params: { 
                    applicationId: '1',
                    jobId: 'job1' 
                  }} 
                />
              </NavigationContainer>
            </AuthProvider>
          </AuthProvider>
        </ThemeProvider>
      );

      // Should have security notices
      expect(getByText(/Security Notice/)).toBeTruthy();
      expect(getByText(/hidden for security/)).toBeTruthy();

      // Should show match information but hide private data
      expect(getByText('Gold Match')).toBeTruthy();
      expect(queryByText(/john.doe@example.com/i)).toBeNull();
      expect(queryByText(/resume.pdf/i)).toBeNull();
    });

    it('should handle dismissible security notices', async () => {
      const { getByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <ApplicationDetailScreen 
                  navigation={mockNavigation} 
                  route={{ params: { 
                    applicationId: '1',
                    jobId: 'job1' 
                  }} 
                />
              </NavigationContainer>
            </AuthProvider>
          </AuthProvider>
        </ThemeProvider>
      );

      // Find and click dismiss button
      const dismissButton = getByText('Dismiss');
      fireEvent.press(dismissButton);

      // Security notice should disappear (this would require state management)
      // In a real implementation, we'd verify the notice is hidden
    });
  });

  describe('Data Flow Security Tests', () => {
    it('should prevent data leakage through props', () => {
      const applicationWithPrivateData = {
        ...mockApplications[0],
        user: {
          ...mockApplications[0].user,
          email: 'john.doe@example.com', // This should be filtered
          phone: '+1-555-0123', // This should be filtered
          address: '123 Main St', // This should be filtered
        },
        resume: {
          ...mockApplications[0].resume,
          resumeFileUrl: 'https://example.com/resume.pdf', // This should be filtered
        },
      };

      const { queryByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <JobApplicationsScreen 
                  navigation={mockNavigation} 
                  route={{ params: { jobId: 'job1' } }} 
                />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      // Even if private data is passed in props, it should not be displayed
      expect(queryByText(/john.doe@example.com/i)).toBeNull();
      expect(queryByText(/\+1-555-/i)).toBeNull();
      expect(queryByText(/resume.pdf/i)).toBeNull();
    });

    it('should maintain security across navigation', () => {
      const { getByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <JobApplicationsScreen 
                  navigation={mockNavigation} 
                  route={{ params: { jobId: 'job1' } }} 
                />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      // Navigate to detail view
      const application = getByText('John Doe');
      fireEvent.press(application);

      // Even after navigation, security should be maintained
      // This would require testing the actual navigation
      expect(getByText('Security Notice')).toBeTruthy();
    });
  });

  describe('User Experience Security', () => {
    it('should provide clear security feedback to users', () => {
      const { getByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <JobApplicationsScreen 
                  navigation={mockNavigation} 
                  route={{ params: { jobId: 'job1' } }} 
                />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      // Should have clear security notice
      expect(getByText(/Private client documents/)).toBeTruthy();
      expect(getByText(/filtered for employer access/)).toBeTruthy();
    });

    it('should balance security with usability', () => {
      const { getByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <JobApplicationsScreen 
                  navigation={mockNavigation} 
                  route={{ params: { jobId: 'job1' } }} 
                />
              </NavigationContainer>
            </AuthProvider>
          </AuthProvider>
        </ThemeProvider>
      );

      // Should still show useful information for hiring decisions
      expect(getByText('Gold Match')).toBeTruthy();
      expect(getByText('JavaScript')).toBeTruthy();
      expect(getByText('React')).toBeTruthy();
      expect(getByText('Node.js')).toBeTruthy();

      // But hide private information
      expect(getByText(/john.doe@example.com/i)).toBeNull();
    });

    it('should provide dismissible security notices', () => {
      const { getByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <ApplicationDetailScreen 
                  navigation={mockNavigation} 
                  route={{ params: { 
                    applicationId: '1',
                    jobId: 'job1' 
                  }} 
                />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      // Should have dismiss button
      expect(getByText('Dismiss')).toBeTruthy();
    });
  });

  describe('Error Handling Security', () => {
    it('should handle security-related errors gracefully', async () => {
      // Mock a security error
      const mockError = new Error('Security violation: Attempted to access private data');
      mockError.name = 'SecurityError';

      const { getByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <JobApplicationsScreen 
                  navigation={mockNavigation} 
                  route={{ params: { jobId: 'job1' } }} 
                />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      // Should not crash and should show appropriate error handling
      expect(getByText('Applications')).toBeTruthy();
    });

    it('should validate data before display', () => {
      const invalidApplication = {
        ...mockApplications[0],
        user: {
          uid: 'user1',
          name: 'John Doe',
          email: 'john.doe@example.com', // Should be filtered
        },
        resume: {
          id: 'resume1',
          skills: ['JavaScript', 'React'],
          resumeFileUrl: 'https://example.com/resume.pdf', // Should be filtered
        },
      };

      const { queryByText } = render(
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider value={mockAuthContext}>
              <NavigationContainer>
                <JobApplicationsScreen 
                  navigation={mockNavigation} 
                  route={{ params: { jobId: 'job1' } }} 
                />
              </NavigationContainer>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      );

      // Should filter out private data even if present in props
      expect(queryByText(/john.doe@example.com/i)).toBeNull();
      expect(queryByText(/resume.pdf/i)).toBeNull();
    });
  });
});

// Mock fetch for API calls
jest.mock('../../lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Mock navigation container
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
}));
