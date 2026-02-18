// Certificate Service
// Simplified certificate management system

import { db } from '../config/firebase';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  templateUrl: string;
  thumbnailUrl: string;
  fields: CertificateField[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificateField {
  id: string;
  name: string;
  type: 'text' | 'date' | 'image';
  position: { x: number; y: number };
  size: { width: number; height: number };
  styling: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    alignment?: 'left' | 'center' | 'right';
  };
  required: boolean;
}

export interface GeneratedCertificate {
  id: string;
  enrollmentId: string;
  courseId: string;
  studentId: string;
  templateId: string;
  verificationCode: string;
  issuedAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  revokeReason?: string;
  pdfUrl: string;
}

export interface CertificateData {
  studentName: string;
  courseTitle: string;
  instructorName: string;
  completionDate: Date;
  totalDuration: string;
  videosCompleted: number;
  totalVideos: number;
  verificationCode: string;
  issuerName: string;
  issuerTitle: string;
}

export class CertificateService {
  private templatesCollection = db.collection('certificateTemplates');
  private certificatesCollection = db.collection('courseCertificates');

  /**
   * Create a new certificate template
   */
  async createTemplate(templateData: Partial<CertificateTemplate>, createdBy: string): Promise<CertificateTemplate> {
    const template: Partial<CertificateTemplate> = {
      id: '',
      name: templateData.name || 'Default Template',
      description: templateData.description || '',
      templateUrl: templateData.templateUrl || '',
      thumbnailUrl: templateData.thumbnailUrl || '',
      fields: templateData.fields || this.getDefaultFields(),
      isActive: templateData.isActive ?? true,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await this.templatesCollection.add(template);
    return { ...template, id: docRef.id } as CertificateTemplate;
  }

  /**
   * Get default certificate fields
   */
  private getDefaultFields(): CertificateField[] {
    return [
      {
        id: 'studentName',
        name: 'Student Name',
        type: 'text',
        position: { x: 100, y: 200 },
        size: { width: 400, height: 50 },
        styling: { fontSize: 24, fontFamily: 'Arial', color: '#000000' },
        required: true,
      },
      {
        id: 'courseTitle',
        name: 'Course Title',
        type: 'text',
        position: { x: 100, y: 300 },
        size: { width: 400, height: 50 },
        styling: { fontSize: 18, fontFamily: 'Arial', color: '#000000' },
        required: true,
      },
      {
        id: 'completionDate',
        name: 'Completion Date',
        type: 'date',
        position: { x: 100, y: 400 },
        size: { width: 200, height: 30 },
        styling: { fontSize: 14, fontFamily: 'Arial', color: '#000000' },
        required: true,
      },
      {
        id: 'verificationCode',
        name: 'Verification Code',
        type: 'text',
        position: { x: 100, y: 500 },
        size: { width: 300, height: 30 },
        styling: { fontSize: 12, fontFamily: 'Arial', color: '#000000' },
        required: true,
      },
    ];
  }

  /**
   * Get all active certificate templates
   */
  async getActiveTemplates(): Promise<CertificateTemplate[]> {
    const snapshot = await this.templatesCollection
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CertificateTemplate));
  }

  /**
   * Get certificate template by ID
   */
  async getTemplateById(templateId: string): Promise<CertificateTemplate | null> {
    const doc = await this.templatesCollection.doc(templateId).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as CertificateTemplate) : null;
  }

  /**
   * Update certificate template
   */
  async updateTemplate(templateId: string, updates: Partial<CertificateTemplate>): Promise<CertificateTemplate> {
    await this.templatesCollection.doc(templateId).update({
      ...updates,
      updatedAt: new Date(),
    });

    const doc = await this.templatesCollection.doc(templateId).get();
    return { id: doc.id, ...doc.data() } as CertificateTemplate;
  }

  /**
   * Delete certificate template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    await this.templatesCollection.doc(templateId).delete();
  }

  /**
   * Generate a certificate PDF
   */
  async generateCertificate(templateId: string, data: CertificateData): Promise<Buffer> {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size

    // Load fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Draw fields
    for (const field of template.fields) {
      const value = this.getFieldValue(field, data);
      if (value) {
        await this.drawField(page, field, value, font, boldFont);
      }
    }

    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Get field value from certificate data
   */
  private getFieldValue(field: CertificateField, data: CertificateData): string {
    switch (field.name) {
      case 'Student Name':
        return data.studentName;
      case 'Course Title':
        return data.courseTitle;
      case 'Completion Date':
        return data.completionDate.toLocaleDateString();
      case 'Verification Code':
        return data.verificationCode;
      case 'Instructor Name':
        return data.instructorName;
      case 'Issuer Name':
        return data.issuerName;
      case 'Issuer Title':
        return data.issuerTitle;
      default:
        return '';
    }
  }

  /**
   * Draw a field on the PDF page
   */
  private async drawField(
    page: any,
    field: CertificateField,
    value: string,
    font: any,
    boldFont: any
  ): Promise<void> {
    const selectedFont = field.styling.fontFamily?.includes('Bold') ? boldFont : font;
    const color = this.parseColor(field.styling.color || '#000000');

    page.drawText(value, {
      x: field.position.x,
      y: 841.89 - field.position.y, // Convert from top-left to bottom-left coordinates
      size: field.styling.fontSize || 14,
      font: selectedFont,
      color,
      maxWidth: field.size.width,
    });
  }

  /**
   * Parse hex color to RGB
   */
  private parseColor(hex: string): any {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? rgb(
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255
        )
      : rgb(0, 0, 0);
  }

  /**
   * Save a generated certificate
   */
  async saveCertificate(
    enrollmentId: string,
    courseId: string,
    studentId: string,
    templateId: string,
    pdfBuffer: Buffer,
    verificationCode: string
  ): Promise<GeneratedCertificate> {
    const certificate: Partial<GeneratedCertificate> = {
      id: '',
      enrollmentId,
      courseId,
      studentId,
      templateId,
      verificationCode,
      issuedAt: new Date(),
      isRevoked: false,
      pdfUrl: '', // Will be updated after upload to storage
    };

    const docRef = await this.certificatesCollection.add(certificate);
    return { ...certificate, id: docRef.id } as GeneratedCertificate;
  }

  /**
   * Get student certificates
   */
  async getStudentCertificates(studentId: string): Promise<GeneratedCertificate[]> {
    const snapshot = await this.certificatesCollection
      .where('studentId', '==', studentId)
      .orderBy('issuedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GeneratedCertificate));
  }

  /**
   * Get certificate by verification code
   */
  async getCertificateByVerificationCode(verificationCode: string): Promise<GeneratedCertificate | null> {
    const snapshot = await this.certificatesCollection
      .where('verificationCode', '==', verificationCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as GeneratedCertificate;
  }

  /**
   * Revoke a certificate
   */
  async revokeCertificate(certificateId: string, reason: string): Promise<void> {
    await this.certificatesCollection.doc(certificateId).update({
      isRevoked: true,
      revokedAt: new Date(),
      revokeReason: reason,
    });
  }

  /**
   * Get certificate statistics
   */
  async getCertificateStats(instructorId?: string): Promise<{
    totalIssued: number;
    totalRevoked: number;
    issuedThisMonth: number;
    issuedThisYear: number;
    byCourse: Array<{ courseId: string; courseTitle: string; count: number }>;
  }> {
    let query: any = this.certificatesCollection;

    if (instructorId) {
      // Filter by instructor's courses
      query = query.where('instructorId', '==', instructorId);
    }

    const snapshot = await query.get();
    const certificates = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as GeneratedCertificate));

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    const totalIssued = certificates.length;
    const totalRevoked = certificates.filter((c: GeneratedCertificate) => c.isRevoked).length;
    const issuedThisMonth = certificates.filter((c: GeneratedCertificate) => c.issuedAt >= thisMonth).length;
    const issuedThisYear = certificates.filter((c: GeneratedCertificate) => c.issuedAt >= thisYear).length;

    // Group by course
    const byCourseMap = new Map<string, { courseTitle: string; count: number }>();
    for (const cert of certificates) {
      const existing = byCourseMap.get(cert.courseId) || { courseTitle: '', count: 0 };
      byCourseMap.set(cert.courseId, {
        ...existing,
        count: existing.count + 1,
      });
    }

    // Fetch course titles
    const byCourse = await Promise.all(
      Array.from(byCourseMap.entries()).map(async (entry) => {
        const [courseId, data] = entry as [string, { courseTitle: string; count: number }];
        const courseDoc = await db.collection('courses').doc(courseId).get();
        const courseTitle = courseDoc.exists ? courseDoc.data()?.title : 'Unknown Course';
        return {
          courseId,
          courseTitle,
          count: data.count,
        };
      })
    );

    return {
      totalIssued,
      totalRevoked,
      issuedThisMonth,
      issuedThisYear,
      byCourse,
    };
  }

  /**
   * Generate a unique verification code
   */
  generateVerificationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate a preview certificate
   */
  async generatePreview(templateId: string): Promise<Buffer> {
    const sampleData: CertificateData = {
      studentName: 'John Doe',
      courseTitle: 'Sample Course',
      instructorName: 'Dr. Jane Smith',
      completionDate: new Date(),
      totalDuration: '2 hours',
      videosCompleted: 10,
      totalVideos: 10,
      verificationCode: 'SAMPLE123',
      issuerName: 'Sample Platform',
      issuerTitle: 'Certificate of Completion',
    };

    return this.generateCertificate(templateId, sampleData);
  }
}

export const certificateService = new CertificateService();
