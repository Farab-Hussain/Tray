import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/core/colors';
import { studentProfileStyles } from '../../../constants/styles/studentProfileStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import { ResumeService, WorkEligibilityChecklist } from '../../../services/resume.service';
import { showError, showSuccess } from '../../../utils/toast';

const checklistDefaults: WorkEligibilityChecklist = {
  selfAttestationAccepted: false,
  drivingTransportation: {},
  workAuthorizationDocumentation: {},
  physicalWorkplaceRequirements: {},
  schedulingWorkEnvironment: {},
  drugTestingSafetyPolicies: {},
  professionalLicensingCertifications: {
    licenseExamplesNote:
      'Examples may include: CDL, Real Estate, Insurance, Security, Healthcare credentials, etc.',
  },
  roleBasedCompatibilitySensitive: {},
};

const Row = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: boolean;
  onChange: (next: boolean) => void;
}) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
      gap: 12,
    }}
  >
    <Text style={{ flex: 1, color: COLORS.black }}>{label}</Text>
    <Switch value={!!value} onValueChange={onChange} />
  </View>
);

const AuthorizationDocuments = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checklist, setChecklist] = useState<WorkEligibilityChecklist>(checklistDefaults);

  const loadChecklist = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ResumeService.getMyResume();
      const existing = response?.resume?.workEligibilityChecklist as WorkEligibilityChecklist | undefined;
      if (existing) {
        setChecklist({
          ...checklistDefaults,
          ...existing,
          drivingTransportation: { ...checklistDefaults.drivingTransportation, ...existing.drivingTransportation },
          workAuthorizationDocumentation: {
            ...checklistDefaults.workAuthorizationDocumentation,
            ...existing.workAuthorizationDocumentation,
          },
          physicalWorkplaceRequirements: {
            ...checklistDefaults.physicalWorkplaceRequirements,
            ...existing.physicalWorkplaceRequirements,
          },
          schedulingWorkEnvironment: {
            ...checklistDefaults.schedulingWorkEnvironment,
            ...existing.schedulingWorkEnvironment,
          },
          drugTestingSafetyPolicies: {
            ...checklistDefaults.drugTestingSafetyPolicies,
            ...existing.drugTestingSafetyPolicies,
          },
          professionalLicensingCertifications: {
            ...checklistDefaults.professionalLicensingCertifications,
            ...existing.professionalLicensingCertifications,
          },
          roleBasedCompatibilitySensitive: {
            ...checklistDefaults.roleBasedCompatibilitySensitive,
            ...existing.roleBasedCompatibilitySensitive,
          },
        });
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        Alert.alert(
          'Resume Required',
          'Please create your resume first, then complete this private checklist.',
          [
            { text: 'Back', onPress: () => navigation.goBack() },
            { text: 'Create Resume', onPress: () => navigation.navigate('Resume') },
          ],
        );
        return;
      }
      showError(error?.response?.data?.error || 'Failed to load checklist');
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  const handleSave = async () => {
    if (!checklist.selfAttestationAccepted) {
      Alert.alert('Confirmation Required', 'Please acknowledge the self-attestation disclaimer before saving.');
      return;
    }

    try {
      setSaving(true);
      await ResumeService.updateResume({
        workEligibilityChecklist: checklist,
      });
      showSuccess('Private checklist saved');
      navigation.goBack();
    } catch (error: any) {
      showError(error?.response?.data?.error || 'Failed to save checklist');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={studentProfileStyles.container}>
        <ScreenHeader title="Work Eligibility (Private)" onBackPress={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.blue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={studentProfileStyles.container}>
      <ScreenHeader title="Work Eligibility (Private)" onBackPress={() => navigation.goBack()} />

      <ScrollView style={studentProfileStyles.scrollView}>
        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>
            Client side: Work Eligibility & Role Compatibility (Private)
          </Text>
          <View style={studentProfileStyles.sectionContent}>
            <Text style={{ color: COLORS.gray, marginBottom: 12 }}>
              This information is used only to match you with appropriate job opportunities.
              It is not displayed to employers. All responses are self-attested.
            </Text>

            <Text style={{ fontWeight: '700', color: COLORS.black, marginBottom: 8 }}>
              Required Disclaimer (Client-Side)
            </Text>
            <Text style={{ color: COLORS.gray, marginBottom: 12 }}>
              This platform does not verify criminal history or licensing status. All responses are self-attested.
              Employers conduct independent screening and make final hiring decisions.
              Your responses are used only for opportunity matching and are not displayed directly to employers.
            </Text>

            <Row
              label="I understand and accept this self-attestation disclaimer"
              value={checklist.selfAttestationAccepted}
              onChange={next => setChecklist(prev => ({ ...prev, selfAttestationAccepted: next }))}
            />
          </View>
        </View>

        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>1️⃣ Driving & Transportation</Text>
          <View style={studentProfileStyles.sectionContent}>
            <Row
              label="I have a valid driver’s license"
              value={checklist.drivingTransportation?.hasValidDriversLicense}
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  drivingTransportation: { ...prev.drivingTransportation, hasValidDriversLicense: next },
                }))
              }
            />
            <Row
              label="I can meet motor vehicle record (MVR) requirements if the role requires driving"
              value={checklist.drivingTransportation?.canMeetMvrRequirements}
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  drivingTransportation: { ...prev.drivingTransportation, canMeetMvrRequirements: next },
                }))
              }
            />
            <Row
              label="I have reliable transportation for required shifts"
              value={checklist.drivingTransportation?.hasReliableTransportation}
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  drivingTransportation: { ...prev.drivingTransportation, hasReliableTransportation: next },
                }))
              }
            />
            <Row
              label="I can perform driving-related job duties (deliveries, routes, client visits)"
              value={checklist.drivingTransportation?.canPerformDrivingDuties}
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  drivingTransportation: { ...prev.drivingTransportation, canPerformDrivingDuties: next },
                }))
              }
            />
          </View>
        </View>

        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>2️⃣ Work Authorization & Documentation</Text>
          <View style={studentProfileStyles.sectionContent}>
            <Row
              label="I have valid identification required for employment (I-9 compliant)"
              value={checklist.workAuthorizationDocumentation?.hasValidI9Identification}
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  workAuthorizationDocumentation: {
                    ...prev.workAuthorizationDocumentation,
                    hasValidI9Identification: next,
                  },
                }))
              }
            />
            <Row
              label="I can meet E-Verify requirements if required by the employer"
              value={checklist.workAuthorizationDocumentation?.canMeetEverifyRequirements}
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  workAuthorizationDocumentation: {
                    ...prev.workAuthorizationDocumentation,
                    canMeetEverifyRequirements: next,
                  },
                }))
              }
            />
          </View>
        </View>

        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>3️⃣ Physical & Workplace Requirements</Text>
          <View style={studentProfileStyles.sectionContent}>
            <Row
              label="I can perform essential physical job functions (standing, lifting, repetitive tasks)"
              value={checklist.physicalWorkplaceRequirements?.canPerformEssentialPhysicalFunctions}
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  physicalWorkplaceRequirements: {
                    ...prev.physicalWorkplaceRequirements,
                    canPerformEssentialPhysicalFunctions: next,
                  },
                }))
              }
            />
            <Row
              label="I may request workplace accommodations to perform essential job functions (Optional — not disclosed to employers unless I choose)"
              value={checklist.physicalWorkplaceRequirements?.mayRequestWorkplaceAccommodations}
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  physicalWorkplaceRequirements: {
                    ...prev.physicalWorkplaceRequirements,
                    mayRequestWorkplaceAccommodations: next,
                  },
                }))
              }
            />
          </View>
        </View>

        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>4️⃣ Scheduling & Work Environment</Text>
          <View style={studentProfileStyles.sectionContent}>
            <Row
              label="I can work nights / weekends / rotating shifts"
              value={checklist.schedulingWorkEnvironment?.canWorkNightsWeekendsRotating}
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  schedulingWorkEnvironment: {
                    ...prev.schedulingWorkEnvironment,
                    canWorkNightsWeekendsRotating: next,
                  },
                }))
              }
            />
            <Row
              label="I can work in safety-sensitive environments (warehouse, construction, heavy equipment)"
              value={checklist.schedulingWorkEnvironment?.canWorkSafetySensitiveEnvironments}
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  schedulingWorkEnvironment: {
                    ...prev.schedulingWorkEnvironment,
                    canWorkSafetySensitiveEnvironments: next,
                  },
                }))
              }
            />
            <Row
              label="I can work in regulated environments (healthcare, education, government facilities)"
              value={checklist.schedulingWorkEnvironment?.canWorkRegulatedEnvironments}
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  schedulingWorkEnvironment: {
                    ...prev.schedulingWorkEnvironment,
                    canWorkRegulatedEnvironments: next,
                  },
                }))
              }
            />
          </View>
        </View>

        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>5️⃣ Drug Testing & Safety Policies</Text>
          <View style={studentProfileStyles.sectionContent}>
            <Row
              label="I can pass a drug screening if required"
              value={checklist.drugTestingSafetyPolicies?.canPassDrugScreening}
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  drugTestingSafetyPolicies: {
                    ...prev.drugTestingSafetyPolicies,
                    canPassDrugScreening: next,
                  },
                }))
              }
            />
            <Row
              label="I can comply with random drug testing policies if required"
              value={checklist.drugTestingSafetyPolicies?.canComplyRandomDrugTesting}
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  drugTestingSafetyPolicies: {
                    ...prev.drugTestingSafetyPolicies,
                    canComplyRandomDrugTesting: next,
                  },
                }))
              }
            />
          </View>
        </View>

        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>6️⃣ Professional Licensing & Certifications</Text>
          <View style={studentProfileStyles.sectionContent}>
            <Row
              label="I am eligible to hold or obtain required professional licenses"
              value={checklist.professionalLicensingCertifications?.eligibleToObtainRequiredLicenses}
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  professionalLicensingCertifications: {
                    ...prev.professionalLicensingCertifications,
                    eligibleToObtainRequiredLicenses: next,
                  },
                }))
              }
            />
            <Row
              label="I currently hold required licenses or certifications (if applicable)"
              value={checklist.professionalLicensingCertifications?.currentlyHoldsRequiredLicensesCertifications}
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  professionalLicensingCertifications: {
                    ...prev.professionalLicensingCertifications,
                    currentlyHoldsRequiredLicensesCertifications: next,
                  },
                }))
              }
            />
            <Text style={{ color: COLORS.gray, fontSize: 12 }}>
              {checklist.professionalLicensingCertifications?.licenseExamplesNote}
            </Text>
          </View>
        </View>

        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>7️⃣ Role-Based Compatibility (Private & Sensitive)</Text>
          <View style={studentProfileStyles.sectionContent}>
            <Row
              label="I have no active restrictions that would prevent work involving minors"
              value={checklist.roleBasedCompatibilitySensitive?.noRestrictionsForWorkWithMinors}
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  roleBasedCompatibilitySensitive: {
                    ...prev.roleBasedCompatibilitySensitive,
                    noRestrictionsForWorkWithMinors: next,
                  },
                }))
              }
            />
            <Row
              label="I have no active restrictions that would prevent work involving vulnerable adults/patients"
              value={checklist.roleBasedCompatibilitySensitive?.noRestrictionsForVulnerableAdultsPatients}
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  roleBasedCompatibilitySensitive: {
                    ...prev.roleBasedCompatibilitySensitive,
                    noRestrictionsForVulnerableAdultsPatients: next,
                  },
                }))
              }
            />
            <Row
              label="I have no active restrictions that would prevent financial handling roles"
              value={checklist.roleBasedCompatibilitySensitive?.noRestrictionsForFinancialHandlingRoles}
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  roleBasedCompatibilitySensitive: {
                    ...prev.roleBasedCompatibilitySensitive,
                    noRestrictionsForFinancialHandlingRoles: next,
                  },
                }))
              }
            />
            <Row
              label="I have no active restrictions that would prevent work in secure facilities"
              value={checklist.roleBasedCompatibilitySensitive?.noRestrictionsForSecureFacilities}
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  roleBasedCompatibilitySensitive: {
                    ...prev.roleBasedCompatibilitySensitive,
                    noRestrictionsForSecureFacilities: next,
                  },
                }))
              }
            />
            <Row
              label="I have pending legal matters that may affect certain employment types (Optional disclosure)"
              value={checklist.roleBasedCompatibilitySensitive?.hasPendingLegalMattersAffectingEmploymentTypes}
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  roleBasedCompatibilitySensitive: {
                    ...prev.roleBasedCompatibilitySensitive,
                    hasPendingLegalMattersAffectingEmploymentTypes: next,
                  },
                }))
              }
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, margin: 20 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: COLORS.lightGray,
              padding: 16,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: COLORS.blue,
              padding: 16,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: saving ? 0.7 : 1,
            }}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '600' }}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AuthorizationDocuments;
