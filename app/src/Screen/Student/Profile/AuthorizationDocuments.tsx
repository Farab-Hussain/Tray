import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/core/colors';
import { studentProfileStyles } from '../../../constants/styles/studentProfileStyles';
import ScreenHeader from '../../../components/shared/ScreenHeader';
import {
  ResumeService,
  WorkEligibilityChecklist,
  WorkEligibilityEvidenceFile,
  WorkEligibilitySectionKey,
  WorkEligibilityVerificationStatus,
} from '../../../services/resume.service';
import UploadService from '../../../services/upload.service';
import { showError, showSuccess } from '../../../utils/toast';
import { Upload, Trash2 } from 'lucide-react-native';

let DocumentPicker: any = null;
try {
  DocumentPicker = require('react-native-document-picker');
} catch (_e) {
  DocumentPicker = null;
}

const checklistDefaults: WorkEligibilityChecklist = {
  selfAttestationAccepted: false,
  selfAttestationAcceptedAt: undefined,
  selfAttestationSource: undefined,
  verificationStatusBySection: {},
  evidenceFiles: [],
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

const sectionLabels: Record<WorkEligibilitySectionKey, string> = {
  drivingTransportation: 'Driving & Transportation',
  workAuthorizationDocumentation: 'Work Authorization & Documentation',
  physicalWorkplaceRequirements: 'Physical & Workplace Requirements',
  schedulingWorkEnvironment: 'Scheduling & Work Environment',
  drugTestingSafetyPolicies: 'Drug Testing & Safety Policies',
  professionalLicensingCertifications: 'Professional Licensing & Certifications',
  roleBasedCompatibilitySensitive: 'Role-Based Compatibility',
};

const statusColors: Record<WorkEligibilityVerificationStatus, string> = {
  self_reported: COLORS.gray,
  pending: COLORS.orange,
  verified: COLORS.green,
  rejected: COLORS.red,
};

const statusLabels: Record<WorkEligibilityVerificationStatus, string> = {
  self_reported: 'Self-Reported',
  pending: 'Pending Review',
  verified: 'Verified',
  rejected: 'Rejected',
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
  const [uploadingSection, setUploadingSection] = useState<WorkEligibilitySectionKey | null>(null);
  const [checklist, setChecklist] = useState<WorkEligibilityChecklist>(checklistDefaults);
  const [docLockerUploading, setDocLockerUploading] = useState(false);
  const [docLockerFiles, setDocLockerFiles] = useState<Array<{ fileUrl: string; publicId?: string; fileName: string; uploadedAt: string; mimeType?: string }>>([]);

  const loadChecklist = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ResumeService.getMyResume();
      const existing = response?.resume?.workEligibilityChecklist as WorkEligibilityChecklist | undefined;
      if (existing) {
        setChecklist({
          ...checklistDefaults,
          ...existing,
          verificationStatusBySection: {
            ...checklistDefaults.verificationStatusBySection,
            ...existing.verificationStatusBySection,
          },
          evidenceFiles: Array.isArray(existing.evidenceFiles) ? existing.evidenceFiles : [],
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

        // Additional documents locker
        if (Array.isArray(response?.resume?.additionalDocuments)) {
          setDocLockerFiles(response.resume.additionalDocuments);
        }
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

  const getSectionEvidence = (section: WorkEligibilitySectionKey): WorkEligibilityEvidenceFile | undefined =>
    checklist.evidenceFiles?.find(file => file.section === section);

  const getSectionStatus = (section: WorkEligibilitySectionKey): WorkEligibilityVerificationStatus => {
    const explicitStatus = checklist.verificationStatusBySection?.[section];
    if (explicitStatus) {
      return explicitStatus;
    }
    return getSectionEvidence(section) ? 'pending' : 'self_reported';
  };

  const handleAttachEvidence = async (section: WorkEligibilitySectionKey) => {
    try {
      if (!DocumentPicker || !DocumentPicker.pick) {
        showError('Document picker is not available. Please rebuild the app to enable upload.');
        return;
      }

      setUploadingSection(section);
      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.doc,
          DocumentPicker.types.docx,
          DocumentPicker.types.images,
        ],
        copyTo: 'cachesDirectory',
      });

      if (!result || result.length === 0) {
        return;
      }

      const file = result[0];
      const uploadResult = await UploadService.uploadFile(
        {
          uri: file.uri,
          type: file.type || 'application/pdf',
          name: file.name || `${section}.pdf`,
          fileName: file.name || `${section}.pdf`,
        },
        'resume',
      );
      const uploadedFileUrl =
        uploadResult.imageUrl || (uploadResult as any).fileUrl || uploadResult.videoUrl || '';
      if (!uploadedFileUrl) {
        throw new Error('Upload completed but no file URL was returned.');
      }

      const uploadedEvidence: WorkEligibilityEvidenceFile = {
        section,
        fileUrl: uploadedFileUrl,
        publicId: uploadResult.publicId,
        fileName: file.name || `${section}.pdf`,
        uploadedAt: new Date().toISOString(),
        status: 'pending',
      };

      const nextChecklist = {
        ...checklist,
        evidenceFiles: [...(checklist.evidenceFiles || []).filter(item => item.section !== section), uploadedEvidence],
        verificationStatusBySection: {
          ...(checklist.verificationStatusBySection || {}),
          [section]: 'pending' as const,
        },
      };

      setChecklist(nextChecklist);

      await ResumeService.updateResume({
        workEligibilityChecklist: nextChecklist,
      });

      showSuccess(`Evidence uploaded and saved for ${sectionLabels[section]}`);
    } catch (error: any) {
      if (DocumentPicker?.isCancel && DocumentPicker.isCancel(error)) {
        return;
      }
      showError(error?.message || 'Failed to attach evidence');
    } finally {
      setUploadingSection(null);
    }
  };

  const handleRemoveEvidence = (section: WorkEligibilitySectionKey) => {
    setChecklist(prev => ({
      ...prev,
      evidenceFiles: (prev.evidenceFiles || []).filter(item => item.section !== section),
      verificationStatusBySection: {
        ...(prev.verificationStatusBySection || {}),
        [section]: 'self_reported',
      },
    }));
  };

  const markPendingReview = (section: WorkEligibilitySectionKey) => {
    if (!getSectionEvidence(section)) {
      Alert.alert('Evidence Required', 'Attach a proof document before submitting this section for review.');
      return;
    }
    setChecklist(prev => ({
      ...prev,
      verificationStatusBySection: {
        ...(prev.verificationStatusBySection || {}),
        [section]: 'pending',
      },
    }));
    showSuccess(`${sectionLabels[section]} submitted for review`);
  };

  const renderSectionMeta = (section: WorkEligibilitySectionKey) => {
    const status = getSectionStatus(section);
    const evidence = getSectionEvidence(section);
    return (
      <View style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text
            style={{
              color: statusColors[status],
              fontSize: 12,
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            {statusLabels[status]}
          </Text>
          <TouchableOpacity
            onPress={() => markPendingReview(section)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: COLORS.lightGray,
            }}
          >
            <Text style={{ fontSize: 12, color: COLORS.black }}>Submit Review</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={() => handleAttachEvidence(section)}
            disabled={uploadingSection === section}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: COLORS.blue,
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 8,
              opacity: uploadingSection === section ? 0.7 : 1,
            }}
          >
            <Upload size={14} color={COLORS.white} />
            <Text style={{ color: COLORS.white, marginLeft: 6, fontSize: 12 }}>
              {uploadingSection === section ? 'Uploading...' : 'Attach Proof'}
            </Text>
          </TouchableOpacity>
          {evidence ? (
            <TouchableOpacity
              onPress={() => handleRemoveEvidence(section)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.lightGray,
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: 8,
              }}
            >
              <Trash2 size={14} color={COLORS.black} />
              <Text style={{ color: COLORS.black, marginLeft: 6, fontSize: 12 }}>Remove</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {evidence ? (
          <Text style={{ marginTop: 8, color: COLORS.gray, fontSize: 12 }}>
            Attached: {evidence.fileName}
          </Text>
        ) : (
          <Text style={{ marginTop: 8, color: COLORS.gray, fontSize: 12 }}>
            No evidence uploaded yet.
          </Text>
        )}
      </View>
    );
  };

  const handleSave = async () => {
    if (!checklist.selfAttestationAccepted) {
      Alert.alert('Confirmation Required', 'Please acknowledge the self-attestation disclaimer before saving.');
      return;
    }

    try {
      setSaving(true);
      const normalizedChecklist: WorkEligibilityChecklist = {
        ...checklist,
        selfAttestationAcceptedAt: checklist.selfAttestationAcceptedAt || new Date().toISOString(),
        selfAttestationSource:
          checklist.selfAttestationSource ||
          (Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'unknown'),
        evidenceFiles: checklist.evidenceFiles || [],
        verificationStatusBySection: checklist.verificationStatusBySection || {},
      };

      await ResumeService.updateResume({
        workEligibilityChecklist: normalizedChecklist,
        additionalDocuments: docLockerFiles,
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
        {/* Additional Document Locker */}
        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>Additional Document Locker</Text>
          <View style={studentProfileStyles.sectionContent}>
            <Text style={{ color: COLORS.gray, marginBottom: 12 }}>
              Upload extra documents (certificates, IDs, letters). These stay private unless you share them in an application.
            </Text>

            <TouchableOpacity
              onPress={async () => {
                try {
                  setDocLockerUploading(true);
                  let DocumentPicker: any = null;
                  DocumentPicker = require('react-native-document-picker');
                  const pickerRes = await DocumentPicker.pick({
                    type: [
                      DocumentPicker.types.pdf,
                      DocumentPicker.types.doc,
                      DocumentPicker.types.docx,
                      DocumentPicker.types.images,
                    ],
                  });
                  const file = pickerRes?.[0] || pickerRes;
                  if (!file) return;

                  const uploadRes = await UploadService.uploadFile(file, 'additional');
                  const newDoc = {
                    fileUrl: uploadRes?.fileUrl || uploadRes?.imageUrl || uploadRes?.url,
                    publicId: uploadRes?.publicId,
                    fileName: uploadRes?.fileName || file?.name || 'document',
                    mimeType: file?.type,
                    uploadedAt: new Date().toISOString(),
                  };

                  setDocLockerFiles(prev => [...prev, newDoc]);
                  await ResumeService.addAdditionalDocument(newDoc);
                  showSuccess('Document uploaded');
                } catch (error: any) {
                  if (error?.message?.includes('cancel')) return;
                  showError(error?.message || 'Failed to upload document');
                } finally {
                  setDocLockerUploading(false);
                }
              }}
              disabled={docLockerUploading}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.blue,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                opacity: docLockerUploading ? 0.6 : 1,
              }}
            >
              <Upload size={16} color={COLORS.white} />
              <Text style={{ color: COLORS.white, marginLeft: 8, fontWeight: '600' }}>
                {docLockerUploading ? 'Uploading...' : 'Add Document'}
              </Text>
            </TouchableOpacity>

            {docLockerFiles.length === 0 ? (
              <Text style={{ color: COLORS.gray, marginTop: 10 }}>No documents uploaded yet.</Text>
            ) : (
              <View style={{ marginTop: 12, gap: 10 }}>
                {docLockerFiles.map((doc, idx) => (
                  <View key={`${doc.fileUrl}-${idx}`} style={studentProfileStyles.quickInfo}>
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => doc.fileUrl && Linking.openURL(doc.fileUrl)}
                    >
                      <Text
                        style={[studentProfileStyles.quickInfoText, { textDecorationLine: 'underline' }]}
                        numberOfLines={1}
                      >
                        {doc.fileName}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={async () => {
                        try {
                          setDocLockerUploading(true);
                          await ResumeService.removeAdditionalDocument({ publicId: doc.publicId, fileUrl: doc.fileUrl });
                          setDocLockerFiles(prev => prev.filter((_, i) => i !== idx));
                          showSuccess('Removed');
                        } catch (error: any) {
                          showError(error?.message || 'Failed to remove document');
                        } finally {
                          setDocLockerUploading(false);
                        }
                      }}
                      style={{ padding: 4 }}
                    >
                      <Trash2 size={16} color={COLORS.red} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
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
              onChange={next =>
                setChecklist(prev => ({
                  ...prev,
                  selfAttestationAccepted: next,
                  selfAttestationAcceptedAt: next ? prev.selfAttestationAcceptedAt : undefined,
                  selfAttestationSource: next ? prev.selfAttestationSource : undefined,
                }))
              }
            />
            {checklist.selfAttestationAcceptedAt ? (
              <Text style={{ color: COLORS.gray, fontSize: 12 }}>
                Last attested: {new Date(checklist.selfAttestationAcceptedAt).toLocaleString()}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={studentProfileStyles.section}>
          <Text style={studentProfileStyles.sectionTitle}>1️⃣ Driving & Transportation</Text>
          <View style={studentProfileStyles.sectionContent}>
            {renderSectionMeta('drivingTransportation')}
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
            {renderSectionMeta('workAuthorizationDocumentation')}
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
            {renderSectionMeta('physicalWorkplaceRequirements')}
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
            {renderSectionMeta('schedulingWorkEnvironment')}
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
            {renderSectionMeta('drugTestingSafetyPolicies')}
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
            {renderSectionMeta('professionalLicensingCertifications')}
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
            {renderSectionMeta('roleBasedCompatibilitySensitive')}
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
