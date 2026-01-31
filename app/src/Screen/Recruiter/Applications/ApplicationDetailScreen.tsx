import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
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
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Share2,
  Download,
  Eye,
  EyeOff
} from 'lucide-react-native';

interface ApplicationDetail {
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

const ApplicationDetailScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const { applicationId, jobId } = route.params;
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [showPrivateInfoWarning, setShowPrivateInfoWarning] = useState(true);

  useEffect(() => {
    loadApplicationDetail();
  }, [applicationId]);

  const loadApplicationDetail = async () => {
    try {
      setLoading(true);
      
      // TODO: Implement API call to get application detail
      // const response = await jobApplicationService.getApplicationById(applicationId);
      // setApplication(response.application);
      
      // Mock data for demonstration
      const mockApplication: ApplicationDetail = {
        id: applicationId,
        jobId: jobId,
        userId: 'user1',
        resumeId: 'resume1',
        coverLetter: 'I am very interested in this position and believe my skills in JavaScript, React, and Node.js make me a strong candidate. I have 3 years of experience developing web applications and am excited about the opportunity to contribute to your team.',
        matchScore: 4,
        matchRating: 'gold',
        matchedSkills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
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
          skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python', 'MongoDB'],
          experience: [
            {
              title: 'Senior Developer',
              company: 'Tech Corp',
              duration: '3 years',
              // Detailed descriptions, achievements, references filtered out
            },
            {
              title: 'Developer',
              company: 'Startup Inc',
              duration: '2 years',
            }
          ],
          education: [
            {
              degree: 'Bachelor of Science',
              field: 'Computer Science',
              institution: 'University of Technology',
              // Graduation year, GPA, achievements filtered out
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
      };
      
      setApplication(mockApplication);
      
    } catch (error) {
      console.error('Error loading application detail:', error);
      Alert.alert('Error', 'Failed to load application detail');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      // TODO: Implement API call to update application status
      // await jobApplicationService.updateApplicationStatus(applicationId, newStatus);
      
      setApplication(prev => prev ? { ...prev, status: newStatus as any } : null);
      
      Alert.alert('Success', 'Application status updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update application status');
    }
  };

  const handleShare = async () => {
    try {
      const shareContent = `
Candidate: ${application?.user?.name}
Position: ${application?.job?.title}
Match Rating: ${application?.matchRating} (${application?.matchScore}/${application?.resume?.skills?.length})
Skills: ${application?.matchedSkills?.join(', ')}
Status: ${application?.status}
      `.trim();

      await Share.share({
        message: shareContent,
        title: 'Application Details',
      });
    } catch (error) {
      console.error('Error sharing application:', error);
    }
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

  if (loading) {
    return (
      <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
        <ScreenHeader title="Application Details" onBackPress={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={{ marginTop: 10, color: COLORS.gray }}>Loading application details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!application) {
    return (
      <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
        <ScreenHeader title="Application Details" onBackPress={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: COLORS.gray }}>Application not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.safeAreaWhite} edges={['top']}>
      <ScreenHeader 
        title="Application Details" 
        onBackPress={() => navigation.goBack()} 
        rightComponent={
          <TouchableOpacity onPress={handleShare} style={{ marginRight: 16 }}>
            <Share2 size={24} color={COLORS.black} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Security Notice */}
        {showPrivateInfoWarning && (
          <View style={{
            backgroundColor: '#FEF3C7',
            borderLeftWidth: 4,
            borderLeftColor: COLORS.orange,
            padding: 12,
            margin: 16,
            marginBottom: 8,
            borderRadius: 4,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Shield size={16} color={COLORS.orange} style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: COLORS.black, fontWeight: '600', marginBottom: 4 }}>
                  Security Notice
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.black }}>
                  Private information (email, phone, address, detailed experience, resume downloads) is hidden for security and privacy compliance. You can see skills and match scores for hiring decisions.
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowPrivateInfoWarning(false)}
                  style={{ marginTop: 8 }}
                >
                  <Text style={{ fontSize: 12, color: COLORS.orange, fontWeight: '500' }}>
                    Dismiss
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Match Score Header */}
        <View style={{
          backgroundColor: COLORS.green,
          padding: 20,
          margin: 16,
          borderRadius: 12,
          alignItems: 'center',
        }}>
          <Star size={32} color="#FFD700" fill="#FFD700" />
          <Text style={{ 
            fontSize: 24, 
            fontWeight: 'bold', 
            color: COLORS.white,
            marginTop: 8,
            textTransform: 'capitalize'
          }}>
            {application.matchRating} Match
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: COLORS.white,
            marginTop: 4
          }}>
            {application.matchScore} of {application.resume?.skills?.length || 0} skills matched
          </Text>
          <Text style={{ 
            fontSize: 14, 
            color: 'rgba(255, 255, 255, 0.8)',
            marginTop: 4
          }}>
            {Math.round((application.matchScore / (application.resume?.skills?.length || 1)) * 100)}% match rate
          </Text>
        </View>

        {/* Applicant Info */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: COLORS.black }}>
            Applicant Information
          </Text>
          
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Users size={20} color={COLORS.green} style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.black }}>
                {application.user?.name || 'Unknown Applicant'}
              </Text>
            </View>

            {/* Private Info Notice */}
            <View style={{
              backgroundColor: '#F5F5F5',
              borderRadius: 8,
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <EyeOff size={16} color={COLORS.gray} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 12, color: COLORS.gray, flex: 1 }}>
                Contact information and private details are hidden for security compliance
              </Text>
            </View>
          </View>
        </View>

        {/* Skills Analysis */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: COLORS.black }}>
            Skills Analysis
          </Text>
          
          {/* Matched Skills */}
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            marginBottom: 12,
          }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: COLORS.black }}>
              ✅ Matched Skills ({application.matchedSkills.length})
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {application.matchedSkills.map((skill, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: COLORS.green,
                    borderRadius: 16,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    marginRight: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 14, color: COLORS.white, fontWeight: '500' }}>
                    {skill}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Missing Skills */}
          {application.missingSkills.length > 0 && (
            <View style={{
              backgroundColor: COLORS.white,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}>
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: COLORS.black }}>
                ❌ Missing Skills ({application.missingSkills.length})
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {application.missingSkills.map((skill, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: COLORS.red,
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      marginRight: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: COLORS.white, fontWeight: '500' }}>
                      {skill}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Experience */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: COLORS.black }}>
            Experience
          </Text>
          
          {application.resume?.experience?.map((exp, index) => (
            <View
              key={index}
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Briefcase size={20} color={COLORS.green} style={{ marginRight: 12, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 4 }}>
                    {exp.title}
                  </Text>
                  <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 4 }}>
                    {exp.company}
                  </Text>
                  <Text style={{ fontSize: 14, color: COLORS.gray }}>
                    {exp.duration}
                  </Text>
                  
                  {/* Security Notice for Experience */}
                  <View style={{
                    backgroundColor: '#F0F9FF',
                    borderRadius: 6,
                    padding: 8,
                    marginTop: 8,
                  }}>
                    <Text style={{ fontSize: 11, color: COLORS.blue }}>
                      ℹ️ Detailed descriptions and achievements are hidden for privacy
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Education */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: COLORS.black }}>
            Education
          </Text>
          
          {application.resume?.education?.map((edu, index) => (
            <View
              key={index}
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <GraduationCap size={20} color={COLORS.green} style={{ marginRight: 12, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 4 }}>
                    {edu.degree}
                  </Text>
                  <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 4 }}>
                    {edu.field}
                  </Text>
                  <Text style={{ fontSize: 14, color: COLORS.gray }}>
                    {edu.institution}
                  </Text>
                  
                  {/* Security Notice for Education */}
                  <View style={{
                    backgroundColor: '#F0F9FF',
                    borderRadius: 6,
                    padding: 8,
                    marginTop: 8,
                  }}>
                    <Text style={{ fontSize: 11, color: COLORS.blue }}>
                      ℹ️ Graduation year, GPA, and achievements are hidden for privacy
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Cover Letter */}
        {application.coverLetter && (
          <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: COLORS.black }}>
              Cover Letter
            </Text>
            
            <View style={{
              backgroundColor: COLORS.white,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}>
              <Text style={{ fontSize: 14, color: COLORS.black, lineHeight: 20 }}>
                {application.coverLetter}
              </Text>
            </View>
          </View>
        )}

        {/* Application Actions */}
        <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: COLORS.black }}>
            Application Status
          </Text>
          
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            marginBottom: 16,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Clock size={20} color={getStatusColor(application.status)} style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.black }}>
                Current Status
              </Text>
            </View>
            
            <View style={{
              backgroundColor: getStatusColor(application.status),
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              alignSelf: 'flex-start',
            }}>
              <Text style={{ 
                fontSize: 14, 
                color: COLORS.white, 
                fontWeight: '600',
                textTransform: 'capitalize'
              }}>
                {application.status}
              </Text>
            </View>
            
            <Text style={{ fontSize: 12, color: COLORS.gray, marginTop: 8 }}>
              Applied: {new Date(application.appliedAt).toLocaleDateString()} at {new Date(application.appliedAt).toLocaleTimeString()}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {application.status === 'pending' && (
              <>
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.blue,
                    borderRadius: 8,
                    padding: 12,
                    flex: 1,
                    alignItems: 'center',
                  }}
                  onPress={() => handleStatusUpdate('reviewing')}
                >
                  <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: '600' }}>
                    Start Review
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.red,
                    borderRadius: 8,
                    padding: 12,
                    flex: 1,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    Alert.alert(
                      'Reject Application',
                      'Are you sure you want to reject this application?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Reject',
                          style: 'destructive',
                          onPress: () => handleStatusUpdate('rejected'),
                        },
                      ]
                    );
                  }}
                >
                  <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: '600' }}>
                    Reject
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {application.status === 'reviewing' && (
              <>
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.purple,
                    borderRadius: 8,
                    padding: 12,
                    flex: 1,
                    alignItems: 'center',
                  }}
                  onPress={() => handleStatusUpdate('shortlisted')}
                >
                  <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: '600' }}>
                    Shortlist
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.red,
                    borderRadius: 8,
                    padding: 12,
                    flex: 1,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    Alert.alert(
                      'Reject Application',
                      'Are you sure you want to reject this application?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Reject',
                          style: 'destructive',
                          onPress: () => handleStatusUpdate('rejected'),
                        },
                      ]
                    );
                  }}
                >
                  <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: '600' }}>
                    Reject
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {application.status === 'shortlisted' && (
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.green,
                  borderRadius: 8,
                  padding: 12,
                  flex: 1,
                  alignItems: 'center',
                }}
                onPress={() => {
                  Alert.alert(
                    'Hire Candidate',
                    'Are you sure you want to hire this candidate?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Hire',
                        style: 'default',
                        onPress: () => handleStatusUpdate('hired'),
                      },
                    ]
                  );
                }}
              >
                <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: '600' }}>
                  Hire Candidate
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ApplicationDetailScreen;
