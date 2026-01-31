import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { COLORS } from '../../../constants/core/colors';
import { screenStyles } from '../../../constants/styles/screenStyles';
import { 
  Users, 
  Star, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Filter,
  Search
} from 'lucide-react-native';

interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  resumeId: string;
  coverLetter?: string;
  matchScore: number;
  matchRating: 'gold' | 'silver' | 'bronze' | 'basic';
  matchedSkills: string[];
  missingSkills: string[];
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';
  appliedAt: string;
  user?: {
    uid: string;
    name: string;
    // Note: Private information like email, phone, address are filtered out for employers
  };
  resume?: {
    id: string;
    skills: string[];
    experience: Array<{
      title: string;
      company: string;
      duration: string;
      // Note: Detailed descriptions, achievements, references are filtered out
    }>;
    education: Array<{
      degree: string;
      field: string;
      institution: string;
      // Note: Graduation year, GPA, achievements are filtered out
    }>;
    // Note: resumeFileUrl is filtered out for security
  };
  job?: {
    id: string;
    title: string;
    company: string;
    requiredSkills: string[];
  };
}

interface ApplicationsSummary {
  total: number;
  gold: number;
  silver: number;
  bronze: number;
  basic: number;
}

const JobApplicationsScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const { jobId } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [summary, setSummary] = useState<ApplicationsSummary>({
    total: 0,
    gold: 0,
    silver: 0,
    bronze: 0,
    basic: 0,
  });
  const [jobTitle, setJobTitle] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadApplications();
  }, [jobId]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      
      // TODO: Implement API call to get job applications
      // const response = await jobApplicationService.getJobApplications(jobId);
      // setApplications(response.applications);
      // setSummary(response.summary);
      // setJobTitle(response.applications[0]?.job?.title || 'Job');
      
      // Mock data for demonstration
      const mockApplications: JobApplication[] = [
        {
          id: '1',
          jobId: jobId,
          userId: 'user1',
          resumeId: 'resume1',
          coverLetter: 'I am very interested in this position...',
          matchScore: 4,
          matchRating: 'gold',
          matchedSkills: ['JavaScript', 'React', 'Node.js'],
          missingSkills: [],
          status: 'pending',
          appliedAt: new Date().toISOString(),
          user: {
            uid: 'user1',
            name: 'John Doe',
            // Private information filtered out for security
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
          job: {
            id: jobId,
            title: 'Senior React Developer',
            company: 'Tech Company',
            requiredSkills: ['JavaScript', 'React', 'Node.js'],
          },
        },
        {
          id: '2',
          jobId: jobId,
          userId: 'user2',
          resumeId: 'resume2',
          matchScore: 3,
          matchRating: 'silver',
          matchedSkills: ['JavaScript', 'React'],
          missingSkills: ['Node.js'],
          status: 'reviewing',
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

      setApplications(mockApplications);
      setSummary({
        total: mockApplications.length,
        gold: mockApplications.filter(app => app.matchRating === 'gold').length,
        silver: mockApplications.filter(app => app.matchRating === 'silver').length,
        bronze: mockApplications.filter(app => app.matchRating === 'bronze').length,
        basic: mockApplications.filter(app => app.matchRating === 'basic').length,
      });
      setJobTitle('Senior React Developer');
      
    } catch (error) {
      console.error('Error loading applications:', error);
      Alert.alert('Error', 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadApplications();
    setRefreshing(false);
  };

  const getMatchRatingColor = (rating: string) => {
    switch (rating) {
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#CD7F32';
      case 'basic': return '#808080';
      default: return COLORS.gray;
    }
  };

  const getMatchRatingIcon = (rating: string) => {
    switch (rating) {
      case 'gold': return <Star size={16} color="#FFD700" fill="#FFD700" />;
      case 'silver': return <Star size={16} color="#C0C0C0" fill="#C0C0C0" />;
      case 'bronze': return <Star size={16} color="#CD7F32" fill="#CD7F32" />;
      case 'basic': return <Star size={16} color="#808080" fill="#808080" />;
      default: return <Star size={16} color={COLORS.gray} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return COLORS.orange;
      case 'reviewing': return COLORS.blue;
      case 'shortlisted': return COLORS.purple;
      case 'rejected': return COLORS.red;
      case 'hired': return COLORS.green;
      default: return COLORS.gray;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} color={getStatusColor(status)} />;
      case 'reviewing': return <Users size={16} color={getStatusColor(status)} />;
      case 'shortlisted': return <CheckCircle size={16} color={getStatusColor(status)} />;
      case 'rejected': return <X size={16} color={getStatusColor(status)} />;
      case 'hired': return <CheckCircle size={16} color={getStatusColor(status)} />;
      default: return <Clock size={16} color={getStatusColor(status)} />;
    }
  };

  const handleApplicationPress = (application: JobApplication) => {
    navigation.navigate('ApplicationDetail', { 
      applicationId: application.id,
      jobId: jobId
    });
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      // TODO: Implement API call to update application status
      // await jobApplicationService.updateApplicationStatus(applicationId, newStatus);
      
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: newStatus as any } : app
        )
      );
      
      Alert.alert('Success', 'Application status updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update application status');
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesSearch = !searchQuery || 
      app.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.resume?.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
        <ScreenHeader title="Applications" onBackPress={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={{ marginTop: 10, color: COLORS.gray }}>Loading applications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader title={jobTitle || 'Applications'} onBackPress={() => navigation.goBack()} />
      
      <ScrollView 
        style={{ flex: 1 }} 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Security Notice */}
        <View style={{
          backgroundColor: '#F0F9FF',
          borderLeftWidth: 4,
          borderLeftColor: COLORS.blue,
          padding: 12,
          margin: 16,
          marginBottom: 8,
          borderRadius: 4,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Shield size={16} color={COLORS.blue} style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={{ fontSize: 12, color: COLORS.blue, flex: 1 }}>
              Private client documents and sensitive information have been filtered for employer access. You can see skills and match scores for hiring decisions.
            </Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 }}>
          <View style={{ 
            backgroundColor: COLORS.green, 
            borderRadius: 8, 
            padding: 12, 
            flex: 1, 
            marginRight: 8,
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.white }}>
              {summary.total}
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.white }}>Total</Text>
          </View>
          
          <View style={{ 
            backgroundColor: '#FFD700', 
            borderRadius: 8, 
            padding: 12, 
            flex: 1,
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black }}>
              {summary.gold}
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.black }}>Gold</Text>
          </View>
          
          <View style={{ 
            backgroundColor: '#C0C0C0', 
            borderRadius: 8, 
            padding: 12, 
            flex: 1,
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.black }}>
              {summary.silver}
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.black }}>Silver</Text>
          </View>
        </View>

        {/* Search and Filter */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#F5F5F5',
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
            alignItems: 'center',
          }}>
            <Search size={20} color={COLORS.gray} style={{ marginRight: 8 }} />
            <TextInput
              style={{ flex: 1, fontSize: 16, color: COLORS.black }}
              placeholder="Search by name or skills..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.gray}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={{
                backgroundColor: filterStatus === 'all' ? COLORS.green : '#F5F5F5',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginRight: 8,
              }}
              onPress={() => setFilterStatus('all')}
            >
              <Text style={{ 
                color: filterStatus === 'all' ? COLORS.white : COLORS.black,
                fontSize: 14,
                fontWeight: '500'
              }}>
                All ({summary.total})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: filterStatus === 'pending' ? COLORS.orange : '#F5F5F5',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginRight: 8,
              }}
              onPress={() => setFilterStatus('pending')}
            >
              <Text style={{ 
                color: filterStatus === 'pending' ? COLORS.white : COLORS.black,
                fontSize: 14,
                fontWeight: '500'
              }}>
                Pending
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: filterStatus === 'reviewing' ? COLORS.blue : '#F5F5F5',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginRight: 8,
              }}
              onPress={() => setFilterStatus('reviewing')}
            >
              <Text style={{ 
                color: filterStatus === 'reviewing' ? COLORS.white : COLORS.black,
                fontSize: 14,
                fontWeight: '500'
              }}>
                Reviewing
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: filterStatus === 'shortlisted' ? COLORS.purple : '#F5F5F5',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginRight: 8,
              }}
              onPress={() => setFilterStatus('shortlisted')}
            >
              <Text style={{ 
                color: filterStatus === 'shortlisted' ? COLORS.white : COLORS.black,
                fontSize: 14,
                fontWeight: '500'
              }}>
                Shortlisted
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Applications List */}
        <View style={{ paddingHorizontal: 16 }}>
          {filteredApplications.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Users size={48} color={COLORS.gray} />
              <Text style={{ fontSize: 16, color: COLORS.gray, marginTop: 12 }}>
                No applications found
              </Text>
            </View>
          ) : (
            filteredApplications.map((application) => (
              <TouchableOpacity
                key={application.id}
                style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  shadowColor: COLORS.black,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                onPress={() => handleApplicationPress(application)}
                activeOpacity={0.7}
              >
                {/* Header with match rating and status */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {getMatchRatingIcon(application.matchRating)}
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: '600', 
                      color: COLORS.black,
                      marginLeft: 8,
                      textTransform: 'capitalize'
                    }}>
                      {application.matchRating} Match
                    </Text>
                    <Text style={{ 
                      fontSize: 14, 
                      color: COLORS.gray,
                      marginLeft: 8
                    }}>
                      ({application.matchScore}/{application.resume?.skills?.length || 0})
                    </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {getStatusIcon(application.status)}
                    <Text style={{ 
                      fontSize: 12, 
                      color: getStatusColor(application.status),
                      marginLeft: 4,
                      textTransform: 'capitalize'
                    }}>
                      {application.status}
                    </Text>
                  </View>
                </View>

                {/* Applicant Name */}
                <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.black, marginBottom: 8 }}>
                  {application.user?.name || 'Unknown Applicant'}
                </Text>

                {/* Skills */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 6 }}>
                    Matched Skills ({application.matchedSkills.length}):
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {application.matchedSkills.slice(0, 5).map((skill, index) => (
                      <View
                        key={index}
                        style={{
                          backgroundColor: COLORS.green,
                          borderRadius: 12,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          marginRight: 6,
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: COLORS.white, fontWeight: '500' }}>
                          {skill}
                        </Text>
                      </View>
                    ))}
                    {application.matchedSkills.length > 5 && (
                      <Text style={{ fontSize: 12, color: COLORS.gray, marginTop: 6 }}>
                        +{application.matchedSkills.length - 5} more
                      </Text>
                    )}
                  </View>
                </View>

                {/* Missing Skills */}
                {application.missingSkills.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 6 }}>
                      Missing Skills ({application.missingSkills.length}):
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      {application.missingSkills.slice(0, 3).map((skill, index) => (
                        <View
                          key={index}
                          style={{
                            backgroundColor: COLORS.red,
                            borderRadius: 12,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            marginRight: 6,
                            marginBottom: 4,
                          }}
                        >
                          <Text style={{ fontSize: 12, color: COLORS.white, fontWeight: '500' }}>
                            {skill}
                          </Text>
                        </View>
                      ))}
                      {application.missingSkills.length > 3 && (
                        <Text style={{ fontSize: 12, color: COLORS.gray, marginTop: 6 }}>
                          +{application.missingSkills.length - 3} more
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Applied Date */}
                <Text style={{ fontSize: 12, color: COLORS.gray }}>
                  Applied: {new Date(application.appliedAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default JobApplicationsScreen;
