import { db } from '../config/firebase';
import { Student, StudentInput, ResumeToStudentMigration } from '../models/student.model';

export const studentService = {
  // Get student by user ID
  async getByUserId(uid: string): Promise<Student | null> {
    const doc = await db.collection('students').doc(uid).get();
    return doc.exists ? (doc.data() as Student) : null;
  },

  // Create new student
  async create(studentData: StudentInput): Promise<Student> {
    const docRef = await db.collection('students').doc(studentData.uid);
    await docRef.set(studentData);
    const doc = await docRef.get();
    return doc.data() as Student;
  },

  // Update student
  async update(uid: string, updates: Partial<Student>): Promise<Student> {
    const docRef = db.collection('students').doc(uid);
    await docRef.update(updates);
    const doc = await docRef.get();
    return doc.data() as Student;
  },

  // Delete student
  async delete(uid: string): Promise<void> {
    await db.collection('students').doc(uid).delete();
  },

  // Migrate from resume format
  async migrateFromResume(resumeData: any): Promise<StudentInput> {
    // Convert resume data to student format
    return {
      uid: resumeData.uid,
      personalInfo: {
        name: resumeData.name || resumeData.personalInfo?.name,
        email: resumeData.email || resumeData.personalInfo?.email,
        phone: resumeData.phone || resumeData.personalInfo?.phone,
        location: resumeData.location || resumeData.personalInfo?.location,
        profileImage: resumeData.profileImage || resumeData.personalInfo?.profileImage
      },
      academicInfo: {
        education: resumeData.education || [],
        certifications: resumeData.certifications || []
      },
      workPreferences: {
        workRestrictions: resumeData.workRestrictions || [],
        transportationStatus: resumeData.transportationStatus || null,
        shiftFlexibility: resumeData.shiftFlexibility ? {
          days: resumeData.shiftFlexibility.days || [],
          shifts: resumeData.shiftFlexibility.shifts || []
        } : undefined,
        preferredWorkTypes: resumeData.preferredWorkTypes || [],
        jobsToAvoid: resumeData.jobsToAvoid || []
      },
      authorization: {
        workAuthorized: resumeData.workAuthorized || false,
        authorizationDocuments: resumeData.authorizationDocuments || [],
        backgroundCheckRequired: resumeData.backgroundCheckRequired || false
      },
      careerGoals: {
        careerInterests: resumeData.careerInterests || [],
        targetIndustries: resumeData.targetIndustries || [],
        salaryExpectation: resumeData.salaryExpectation ? {
          min: resumeData.salaryExpectation.min || 0,
          max: resumeData.salaryExpectation.max || 0
        } : undefined
      },
      skills: resumeData.skills || [],
      experience: resumeData.experience || [],
      externalProfiles: resumeData.externalProfiles || {}
    };
  },

  // Check if student exists
  async exists(uid: string): Promise<boolean> {
    const doc = await db.collection('students').doc(uid).get();
    return doc.exists;
  }
};