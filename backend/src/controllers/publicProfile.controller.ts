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

    const publicProfile = {
      uid,
      ...pick(userData, ['name', 'email']),
      ...related,
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
      ...pick(personal, ['fullName', 'email', 'profileImage']),
      professionalInfo: pick(professional, [
        'experience',
        'category',
        'title',
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
    const company = Array.isArray(companies) && companies.length ? companies[0] : null;

    const publicProfile = {
      uid,
      ...pick(userData, ['name', 'email']),
      company,
    };

    res.json({ profile: publicProfile });
  } catch (error: any) {
    Logger.error('PublicProfile', uid, `Failed to fetch recruiter profile: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch recruiter profile' });
  }
};

