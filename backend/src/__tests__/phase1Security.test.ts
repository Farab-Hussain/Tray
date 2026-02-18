// src/__tests__/phase1Security.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { db } from '../config/firebase';
import { FileSecurityService } from '../services/fileSecurity.service';
import { jobApplicationServices } from '../services/jobApplication.service';
import { CompanyService } from '../services/company.service';
import { calculatePayoutBreakdown, transferPaymentToConsultant } from '../services/payment.service';

jest.setTimeout(120000);

describe('Phase 1 Security Tests', () => {
  // Test data
  let testStudentId: string;
  let testConsultantId: string;
  let testEmployerId: string;
  let testAdminId: string;
  let testCompanyId: string;
  let testJobId: string;
  let testFileId: string;
  let testApplicationId: string;

  beforeAll(async () => {
    console.log('🧪 Setting up Phase 1 Security Test Environment...');
    
    // Create test users
    const studentRef = await db.collection('users').add({
      uid: 'test-student-security',
      email: 'student@test.com',
      name: 'Test Student',
      role: 'student',
      createdAt: new Date(),
    });
    testStudentId = studentRef.id;

    const consultantRef = await db.collection('users').add({
      uid: 'test-consultant-security',
      email: 'consultant@test.com',
      name: 'Test Consultant',
      role: 'consultant',
      createdAt: new Date(),
    });
    testConsultantId = consultantRef.id;

    const employerRef = await db.collection('users').add({
      uid: 'test-employer-security',
      email: 'employer@test.com',
      name: 'Test Employer',
      role: 'employer',
      createdAt: new Date(),
    });
    testEmployerId = employerRef.id;

    const adminRef = await db.collection('users').add({
      uid: 'test-admin-security',
      email: 'admin@test.com',
      name: 'Test Admin',
      role: 'admin',
      createdAt: new Date(),
    });
    testAdminId = adminRef.id;

    // Create test company
    const companyData = {
      name: 'Test Security Company',
      industry: 'Technology',
      size: '51-200' as const,
      locations: [{
        id: 'loc1',
        name: 'Headquarters',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        country: 'USA',
        postalCode: '12345',
        isHeadquarters: true,
        shiftTypes: ['full-time', 'part-time'],
        locationType: 'office' as const,
      }],
      headquarters: {
        id: 'loc1',
        name: 'Headquarters',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        country: 'USA',
        postalCode: '12345',
        isHeadquarters: true,
        shiftTypes: ['full-time', 'part-time'],
        locationType: 'office' as const,
      },
      contactInfo: {
        email: 'hr@testcompany.com',
      },
      socialLinks: {}, // Add missing socialLinks
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
      postedBy: testEmployerId,
    };

    const company = await CompanyService.create(companyData);
    testCompanyId = company.id;

    // Create test job
    const jobRef = await db.collection('jobs').add({
      title: 'Test Security Position',
      company: 'Test Security Company',
      description: 'Test job for security testing',
      location: 'Test City, TS',
      jobType: 'full-time',
      requiredSkills: ['JavaScript', 'React', 'Node.js'],
      preferredSkills: ['TypeScript', 'MongoDB'],
      salaryRange: { min: 50000, max: 80000, currency: 'USD' },
      postedBy: testEmployerId,
      companyId: testCompanyId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testJobId = jobRef.id;

    // Create test resume for student
    const resumeRef = await db.collection('resumes').add({
      userId: testStudentId,
      skills: ['JavaScript', 'React', 'Node.js', 'Python'],
      experience: [{
        title: 'Software Developer',
        company: 'Previous Company',
        duration: '2 years',
        description: 'Developed web applications',
        achievements: ['Built 5 major features'],
        references: ['John Doe - john@example.com'],
      }],
      education: [{
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        institution: 'Test University',
        graduationYear: 2020,
        gpa: 3.8,
        achievements: ['Dean\'s List'],
      }],
      workRestrictions: ['No heavy lifting'],
      transportation: 'Car',
      workAuthorization: 'US Citizen',
      resumeFileUrl: 'https://example.com/resume.pdf',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create test file for student
    const fileData = {
      fileName: 'test-resume.pdf',
      originalName: 'resume.pdf',
      mimeType: 'application/pdf',
      size: 1024000,
      uploadedBy: testStudentId,
      uploadedByRole: 'student' as const,
      visibility: 'private' as const,
      associatedEntityType: 'resume' as const,
      associatedEntityId: resumeRef.id,
      studentId: testStudentId,
      storagePath: 'files/resumes/test-resume.pdf',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const fileRef = await db.collection('files').add(fileData);
    testFileId = fileRef.id;

    // Create test job application
    const applicationData = {
      jobId: testJobId,
      resumeId: resumeRef.id,
      coverLetter: 'Test cover letter for security testing',
    };

    const matchResult = {
      score: 3,
      rating: 'gold' as const,
      matchedSkills: ['JavaScript', 'React', 'Node.js'],
      missingSkills: [],
    };

    const application = await jobApplicationServices.create(applicationData, testStudentId, matchResult);
    testApplicationId = application.id;

    console.log('✅ Test environment setup complete');
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up Phase 1 Security Test Environment...');

    const deleteIfExists = async (collection: string, id?: string) => {
      if (!id) return;
      try {
        await db.collection(collection).doc(id).delete();
      } catch {
        // ignore cleanup failures for already-removed docs
      }
    };

    await Promise.all([
      deleteIfExists('jobApplications', testApplicationId),
      deleteIfExists('files', testFileId),
      deleteIfExists('jobs', testJobId),
      deleteIfExists('companies', testCompanyId),
      deleteIfExists('users', testStudentId),
      deleteIfExists('users', testConsultantId),
      deleteIfExists('users', testEmployerId),
      deleteIfExists('users', testAdminId),
    ]);

    console.log('✅ Cleanup complete');
  });

  describe('🔒 File Access Control Security', () => {
    it('should allow students to access their own files', async () => {
      const permission = await FileSecurityService.checkFileAccess({
        fileId: testFileId,
        userId: testStudentId,
        userRole: 'student',
        action: 'read',
      });

      expect(permission.canRead).toBe(true);
      expect(permission.canWrite).toBe(true);
      expect(permission.canDelete).toBe(true);
      expect(permission.reason).toBeUndefined();
    });

    it('should block employers from accessing student files', async () => {
      const permission = await FileSecurityService.checkFileAccess({
        fileId: testFileId,
        userId: testEmployerId,
        userRole: 'employer',
        action: 'read',
      });

      expect(permission.canRead).toBe(false);
      expect(permission.canWrite).toBe(false);
      expect(permission.canDelete).toBe(false);
      expect(permission.reason).toContain('Employers are not permitted to access private client documents');
    });

    it('should allow admins to access any files', async () => {
      const permission = await FileSecurityService.checkFileAccess({
        fileId: testFileId,
        userId: testAdminId,
        userRole: 'admin',
        action: 'read',
      });

      expect(permission.canRead).toBe(true);
      expect(permission.canWrite).toBe(true);
      expect(permission.canDelete).toBe(true);
    });

    it('should allow consultants to access client files with active bookings', async () => {
      // Create a booking first
      const bookingRef = await db.collection('bookings').add({
        consultantId: testConsultantId,
        studentId: testStudentId,
        status: 'confirmed',
        paymentStatus: 'paid',
        amount: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const permission = await FileSecurityService.checkFileAccess({
        fileId: testFileId,
        userId: testConsultantId,
        userRole: 'consultant',
        action: 'read',
      });

      expect(permission.canRead).toBe(true);
      expect(permission.canWrite).toBe(false); // Consultants can't modify student files
      expect(permission.canDelete).toBe(false);

      // Clean up booking
      await bookingRef.delete();
    });
  });

  describe('💰 Payment Integration Security', () => {
    it('should calculate correct 90/10 payout split', () => {
      const testAmount = 100;
      const payout = calculatePayoutBreakdown(testAmount);

      expect(payout.totalAmount).toBe(100);
      expect(payout.platformFee).toBe(10); // 10%
      expect(payout.consultantAmount).toBe(90); // 90%
      expect(payout.platformFeePercentage).toBe(10);
      expect(payout.consultantPayoutPercentage).toBe(90);
    });

    it('should handle edge cases in payout calculation', () => {
      // Test with odd amounts
      const oddAmount = 99.99;
      const payout = calculatePayoutBreakdown(oddAmount);

      expect(payout.platformFee).toBe(10); // Rounded
      expect(payout.consultantAmount).toBe(89.99); // Rounded
      expect(payout.platformFee + payout.consultantAmount).toBeLessThanOrEqual(oddAmount);
    });

    it('should prevent negative transfer amounts', () => {
      const smallAmount = 5;
      const payout = calculatePayoutBreakdown(smallAmount);

      expect(payout.consultantAmount).toBeGreaterThanOrEqual(0);
      expect(payout.platformFee).toBeGreaterThanOrEqual(0);
    });
  });

  describe('🏢 Company Profile Security', () => {
    it('should allow employers to manage their own companies', async () => {
      const companies = await CompanyService.getByUserId(testEmployerId);
      expect(companies).toHaveLength(1);
      expect(companies[0].id).toBe(testCompanyId);
      expect(companies[0].postedBy).toBe(testEmployerId);
    });

    it('should block unauthorized users from accessing company data', async () => {
      const companies = await CompanyService.getByUserId(testStudentId);
      expect(companies).toHaveLength(0);
    });

    it('should include fair-chance hiring settings', async () => {
      const company = await CompanyService.getById(testCompanyId);
      expect(company?.fairChanceHiring.enabled).toBe(true);
      expect(company?.fairChanceHiring.banTheBoxCompliant).toBe(true);
      expect(company?.fairChanceHiring.felonyFriendly).toBe(false);
    });

    it('should allow admin to access all companies', async () => {
      const allCompanies = await CompanyService.getAll();
      expect(allCompanies.length).toBeGreaterThan(0);
      
      const testCompany = allCompanies.find(c => c.id === testCompanyId);
      expect(testCompany).toBeDefined();
      expect(testCompany?.name).toBe('Test Security Company');
    });
  });

  describe('👥 Applicant Review Security', () => {
    it('should block employers from accessing private applicant data', async () => {
      const applications = await jobApplicationServices.getSecureApplicationsForEmployer(testJobId, testEmployerId);
      expect(applications).toHaveLength(1);

      const application = applications[0];
      
      // Should have basic info for matching
      expect(application.matchScore).toBe(3);
      expect(application.matchRating).toBe('gold');
      expect(application.resume?.skills).toContain('JavaScript');

      // Should NOT have private information
      expect(application.user?.email).toBeUndefined();
      // Note: phone and address are not in the user type, so we check what's actually available
      expect((application.resume as any)?.resumeFileUrl).toBeUndefined();
    });

    it('should allow admins to see full applicant data', async () => {
      const applications = await jobApplicationServices.getByJobIdWithDetails(testJobId, testAdminId, 'admin');
      expect(applications).toHaveLength(1);

      const application = applications[0];
      
      // Admin should see everything
      expect(application.user?.email).toBeDefined();
      expect(application.resume?.skills).toBeDefined();
      expect((application.resume as any)?.resumeFileUrl).toBeDefined();
    });

    it('should provide proper match ratings and sorting', async () => {
      const applications = await jobApplicationServices.getSecureApplicationsForEmployer(testJobId, testEmployerId);
      expect(applications).toHaveLength(1);

      const application = applications[0];
      expect(['gold', 'silver', 'bronze', 'basic']).toContain(application.matchRating);
      expect(application.matchScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('🔍 Security Integration Test', () => {
    it('should demonstrate complete security workflow', async () => {
      console.log('🔄 Running complete security workflow test...');

      // 1. Student uploads file
      const filePermission = await FileSecurityService.checkFileAccess({
        fileId: testFileId,
        userId: testStudentId,
        userRole: 'student',
        action: 'read',
      });
      expect(filePermission.canRead).toBe(true);

      // 2. Student applies for job
      const applications = await jobApplicationServices.getByUserId(testStudentId);
      expect(applications).toHaveLength(1);

      // 3. Employer reviews applications (securely)
      const employerApplications = await jobApplicationServices.getSecureApplicationsForEmployer(testJobId, testEmployerId);
      expect(employerApplications).toHaveLength(1);
      
      // Verify employer can't see private data
      const employerApp = employerApplications[0];
      expect(employerApp.user?.email).toBeUndefined();
      expect((employerApp.resume as any)?.resumeFileUrl).toBeUndefined();

      // 4. Admin can see everything
      const adminApplications = await jobApplicationServices.getByJobIdWithDetails(testJobId, testAdminId, 'admin');
      expect(adminApplications).toHaveLength(1);
      
      const adminApp = adminApplications[0];
      expect(adminApp.user?.email).toBeDefined();
      expect((adminApp.resume as any)?.resumeFileUrl).toBeDefined();

      // 5. Payment split calculation
      const payout = calculatePayoutBreakdown(100);
      expect(payout.consultantAmount).toBe(90);
      expect(payout.platformFee).toBe(10);

      console.log('✅ Complete security workflow test passed');
    });
  });

  describe('🚨 Security Breach Detection', () => {
    it('should detect and log security violations', async () => {
      // Test employer trying to access student file
      const permission = await FileSecurityService.checkFileAccess({
        fileId: testFileId,
        userId: testEmployerId,
        userRole: 'employer',
        action: 'read',
      });

      expect(permission.canRead).toBe(false);
      expect(permission.reason).toContain('Employers are not permitted');

      // Log the security test
      await FileSecurityService.logFileAccess({
        fileId: testFileId,
        userId: testEmployerId,
        userRole: 'employer',
        action: 'read',
        success: false,
        reason: permission.reason,
      });
    });

    it('should prevent unauthorized company access', async () => {
      // Try to access company as student
      const studentCompanies = await CompanyService.getByUserId(testStudentId);
      expect(studentCompanies).toHaveLength(0);

      // Try to access company as wrong employer
      const wrongEmployerRef = await db.collection('users').add({
        uid: 'wrong-employer',
        email: 'wrong@test.com',
        name: 'Wrong Employer',
        role: 'employer',
        createdAt: new Date(),
      });

      const wrongEmployerCompanies = await CompanyService.getByUserId(wrongEmployerRef.id);
      expect(wrongEmployerCompanies).toHaveLength(0);

      await wrongEmployerRef.delete();
    });
  });
});
