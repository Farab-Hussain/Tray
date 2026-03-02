import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { consultantFlowService } from '../services/consultantFlow.service';
import { CompanyService } from '../services/company.service';
import { Logger } from '../utils/logger';

// Helper: safely pick fields from an object
const pick = (obj: any, keys: string[]) =>
  keys.reduce((acc: any, key) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});

const toArray = (value: any) => (Array.isArray(value) ? value : []);

const normalizeExternalProfiles = (externalProfiles: any) => {
  const links = toArray(externalProfiles?.links)
    .filter((item: any) => item?.url && item?.platform)
    .map((item: any, index: number) => ({
      id: item.id || `${item.platform}-${index}`,
      platform: String(item.platform).toLowerCase(),
      url: item.url,
    }));

  if (links.length > 0) return links;

  const fallback: Array<{ id: string; platform: string; url: string }> = [];
  const candidates = [
    { id: 'linkedin', platform: 'linkedin', url: externalProfiles?.linkedin || externalProfiles?.linkedIn },
    { id: 'github', platform: 'github', url: externalProfiles?.github },
    { id: 'portfolio', platform: 'portfolio', url: externalProfiles?.portfolio },
    { id: 'website', platform: 'website', url: externalProfiles?.website },
  ];

  candidates.forEach(item => {
    if (item.url) fallback.push(item as any);
  });
  return fallback;
};

// GET /public/students/:uid
export const getPublicStudentProfile = async (req: Request, res: Response) => {
  const { uid } = req.params;
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const userData = userDoc.data() || {};

    // Optional related collections (best-effort; empty if missing)
    const collections = [
      { name: 'work_preferences', field: 'workPreferences' },
      { name: 'career_goals', field: 'careerGoals' },
      { name: 'education', field: 'education' },
      { name: 'certifications', field: 'certifications' },
      { name: 'external_profiles', field: 'externalProfiles' },
    ];

    const related: Record<string, any> = {};
    for (const col of collections) {
      try {
        const snap = await db.collection(col.name).doc(uid).get();
        related[col.field] = snap.exists ? snap.data() : null;
      } catch (err) {
        related[col.field] = null;
      }
    }

    // Resume (primary structured source for student profile details)
    let resume: any = null;
    try {
      const resumeSnap = await db
        .collection('resumes')
        .where('userId', '==', uid)
        .limit(1)
        .get();
      if (!resumeSnap.empty) {
        resume = resumeSnap.docs[0].data();
      }
    } catch {
      resume = null;
    }

    const resumePersonalInfo = resume?.personalInfo || {};
    const normalizedExternalProfiles = normalizeExternalProfiles(
      userData?.externalProfiles || resume?.externalProfiles || related.externalProfiles,
    );

    const publicProfile = {
      uid,
      ...pick(userData, ['name', 'email', 'profileImage', 'location', 'bio']),
      headline: userData?.headline || '',
      summary: resume?.backgroundInformation || '',
      skills: toArray(resume?.skills),
      experience: toArray(resume?.experience),
      education:
        toArray(resume?.education).length > 0
          ? toArray(resume?.education)
          : toArray(related.education?.items || related.education),
      certifications:
        toArray(resume?.certifications).length > 0
          ? toArray(resume?.certifications)
          : toArray(related.certifications?.items || related.certifications),
      workPreferences: {
        preferredWorkTypes: toArray(resume?.preferredWorkTypes),
        shiftFlexibility: resume?.shiftFlexibility || null,
        transportationStatus: resume?.transportationStatus || null,
        workRestrictions: toArray(resume?.workRestrictions),
      },
      careerGoals: {
        careerInterests:
          toArray(resume?.careerInterests).length > 0
            ? toArray(resume?.careerInterests)
            : toArray(related.careerGoals?.careerInterests),
        targetIndustries:
          toArray(resume?.targetIndustries).length > 0
            ? toArray(resume?.targetIndustries)
            : toArray(related.careerGoals?.targetIndustries),
        salaryExpectation: resume?.salaryExpectation || related.careerGoals?.salaryExpectation || null,
      },
      externalProfiles: normalizedExternalProfiles,
      contact: {
        email: userData?.email || resumePersonalInfo?.email || '',
        location: userData?.location || resumePersonalInfo?.location || '',
      },
    };

    res.json({ profile: publicProfile });
  } catch (error: any) {
    Logger.error('PublicProfile', uid, `Failed to fetch student profile: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch student profile' });
  }
};

// GET /public/consultants/:uid
export const getPublicConsultantProfile = async (req: Request, res: Response) => {
  const { uid } = req.params;
  try {
    const profile = await consultantFlowService.getProfileByUid(uid);
    if (!profile) {
      return res.status(404).json({ error: 'Consultant not found' });
    }

    const personal = profile.personalInfo || {};
    const professional = profile.professionalInfo || {};

    const publicProfile = {
      uid,
      ...pick(personal, ['fullName', 'email', 'profileImage', 'bio', 'experience']),
      status: profile.status,
      qualifications: toArray(personal?.qualifications),
      professionalInfo: pick(professional, [
        'experience',
        'category',
        'customCategory',
        'title',
        'specialties',
        'hourlyRate',
        'availabilitySlots',
        'availabilityWindows',
        'maxCaseload',
        'placementRate',
        'retentionRate',
        'revenueGenerated',
        'clientSatisfactionRating',
      ]),
    };

    res.json({ profile: publicProfile });
  } catch (error: any) {
    Logger.error('PublicProfile', uid, `Failed to fetch consultant profile: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch consultant profile' });
  }
};

// GET /public/recruiters/:uid
export const getPublicRecruiterProfile = async (req: Request, res: Response) => {
  const { uid } = req.params;
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Recruiter not found' });
    }
    const userData = userDoc.data() || {};

    // Fetch first company posted by this recruiter (or all, but return first)
    const companies = await CompanyService.getByUserId(uid);
    const rawCompany = Array.isArray(companies) && companies.length ? companies[0] : null;
    const company = rawCompany
      ? {
          ...pick(rawCompany, [
            'id',
            'name',
            'description',
            'industry',
            'website',
            'logoUrl',
            'size',
            'foundedYear',
            'headquarters',
            'locations',
            'contactInfo',
            'socialLinks',
            'fairChanceHiring',
            'hiringVolumeMonthly',
            'hiringRequirements',
            'backgroundPolicyType',
            'drugTestingPolicy',
            'requiredCertifications',
            'shiftRequirements',
            'transportationRequired',
            'payRange',
            'benefitsOffered',
            'retention90DayRate',
            'subscriptionTier',
            'workforcePartnerLevel',
            'verificationStatus',
          ]),
        }
      : null;

    const publicProfile = {
      uid,
      ...pick(userData, ['name', 'email', 'profileImage']),
      company,
    };

    res.json({ profile: publicProfile });
  } catch (error: any) {
    Logger.error('PublicProfile', uid, `Failed to fetch recruiter profile: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch recruiter profile' });
  }
};
