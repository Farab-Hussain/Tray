export interface ComplianceEvaluation {
  enabled: boolean;
  pass: boolean;
  failedChecks: string[];
  summary: string;
}

const asBool = (value: unknown): boolean => value === true;

const hasAnyRequirement = (requirements: any): boolean => {
  if (!requirements || typeof requirements !== "object") return false;
  return Object.values(requirements).some(section => {
    if (!section || typeof section !== "object") return false;
    return Object.values(section).some(value => value === true || (Array.isArray(value) && value.length > 0));
  });
};

export const evaluateComplianceForJob = (resumeData: any, jobData: any): ComplianceEvaluation => {
  const requirements = jobData?.complianceRequirements;
  const checklist = resumeData?.workEligibilityChecklist;

  if (!hasAnyRequirement(requirements)) {
    return {
      enabled: false,
      pass: true,
      failedChecks: [],
      summary: "No compliance requirements configured for this role.",
    };
  }

  const failedChecks: string[] = [];

  const drivingReq = requirements?.drivingTransportation || {};
  const driving = checklist?.drivingTransportation || {};
  if (asBool(drivingReq.requiresValidDriversLicense) && !asBool(driving.hasValidDriversLicense)) {
    failedChecks.push("Requires valid driver's license");
  }
  if (asBool(drivingReq.requiresMvrStandards) && !asBool(driving.canMeetMvrRequirements)) {
    failedChecks.push("Requires MVR standards eligibility");
  }
  if (asBool(drivingReq.requiresReliableTransportation) && !asBool(driving.hasReliableTransportation)) {
    failedChecks.push("Requires reliable transportation");
  }
  if (asBool(drivingReq.requiresDrivingEssentialDuty) && !asBool(driving.canPerformDrivingDuties)) {
    failedChecks.push("Requires ability to perform driving duties");
  }

  const authReq = requirements?.workAuthorization || {};
  const auth = checklist?.workAuthorizationDocumentation || {};
  if (asBool(authReq.requiresValidEmploymentAuthorization) && !asBool(auth.hasValidI9Identification)) {
    failedChecks.push("Requires valid employment authorization documentation");
  }
  if (asBool(authReq.employerUsesEverify) && !asBool(auth.canMeetEverifyRequirements)) {
    failedChecks.push("Requires E-Verify compatibility");
  }

  const physReq = requirements?.physicalEnvironmental || {};
  const phys = checklist?.physicalWorkplaceRequirements || {};
  const env = checklist?.schedulingWorkEnvironment || {};
  if (asBool(physReq.requiresEssentialPhysicalDuties) && !asBool(phys.canPerformEssentialPhysicalFunctions)) {
    failedChecks.push("Requires essential physical duties capability");
  }
  if (asBool(physReq.safetySensitiveRole) && !asBool(env.canWorkSafetySensitiveEnvironments)) {
    failedChecks.push("Requires safety-sensitive environment compatibility");
  }
  if (asBool(physReq.regulatedEnvironment) && !asBool(env.canWorkRegulatedEnvironments)) {
    failedChecks.push("Requires regulated environment compatibility");
  }

  const drugReq = requirements?.drugTestingWorkplacePolicy || {};
  const drug = checklist?.drugTestingSafetyPolicies || {};
  if (asBool(drugReq.requiresPreEmploymentDrugScreening) && !asBool(drug.canPassDrugScreening)) {
    failedChecks.push("Requires pre-employment drug screening compatibility");
  }
  if (asBool(drugReq.subjectToRandomDrugTesting) && !asBool(drug.canComplyRandomDrugTesting)) {
    failedChecks.push("Requires random drug testing compatibility");
  }

  const licenseReq = requirements?.professionalLicensing || {};
  const license = checklist?.professionalLicensingCertifications || {};
  if (asBool(licenseReq.requiresProfessionalLicense) && !asBool(license.eligibleToObtainRequiredLicenses)) {
    failedChecks.push("Requires ability to obtain required professional license");
  }

  const roleReq = requirements?.roleBasedCompatibility || {};
  const role = checklist?.roleBasedCompatibilitySensitive || {};
  if (asBool(roleReq.mustBeEligibleForMinors) && !asBool(role.noRestrictionsForWorkWithMinors)) {
    failedChecks.push("Requires eligibility for roles involving minors");
  }
  if (asBool(roleReq.mustBeEligibleForVulnerableAdults) && !asBool(role.noRestrictionsForVulnerableAdultsPatients)) {
    failedChecks.push("Requires eligibility for vulnerable adults/patients roles");
  }
  if (asBool(roleReq.mustBeEligibleForFinancialHandling) && !asBool(role.noRestrictionsForFinancialHandlingRoles)) {
    failedChecks.push("Requires eligibility for financial-handling roles");
  }
  if (asBool(roleReq.mustBeEligibleForSecureFacilityAccess) && !asBool(role.noRestrictionsForSecureFacilities)) {
    failedChecks.push("Requires eligibility for secure facility access");
  }

  const pass = failedChecks.length === 0;
  return {
    enabled: true,
    pass,
    failedChecks,
    summary: pass
      ? "Meets configured role-based compliance requirements."
      : `Missing ${failedChecks.length} role-based compliance requirement(s).`,
  };
};

