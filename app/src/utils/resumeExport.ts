/**
 * Resume Export Utility
 * Generates ATS-friendly resume formats and PDF exports
 */

import { Platform, Share, Linking } from 'react-native';
import { ResumeData } from '../services/resume.service';
import RNFS from 'react-native-fs';

// Import PDF library - use the correct API
let generatePDF: ((options: any) => Promise<any>) | null = null;
let HtmlToPdfNative: any = null;
try {
  const pdfModule = require('react-native-html-to-pdf');
  // Try generatePDF function first (preferred API)
  if (pdfModule.generatePDF) {
    generatePDF = pdfModule.generatePDF;
  }
  // Fallback to default export (TurboModule)
  else if (pdfModule.default && pdfModule.default.convert) {
    HtmlToPdfNative = pdfModule.default;
  }
  // Try direct import
  else if (pdfModule.convert) {
    HtmlToPdfNative = pdfModule;
  }
} catch (e) {
  if (__DEV__) {
    console.warn('react-native-html-to-pdf not available:', e);
  }
}

/**
 * Export format - flattened version of ResumeData for easier export handling
 */
type ResumeExportData = {
  name: string;
  email: string;
  phone: string;
  location: string;
  skills: ResumeData['skills'];
  experience: ResumeData['experience'];
  education: ResumeData['education'];
  certifications: NonNullable<ResumeData['certifications']>;
  backgroundInformation?: ResumeData['backgroundInformation'];
};

/**
 * Format date from YYYY-MM format to readable format
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.match(/^\d{4}-\d{2}$/)) {
    const [year, month] = dateStr.split('-');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
  }
  return dateStr;
}

/**
 * Format date range for experience/education
 */
function formatDateRange(startDate: string, endDate?: string, current?: boolean): string {
  const start = formatDate(startDate);
  if (current) {
    return `${start} - Present`;
  }
  if (endDate) {
    return `${start} - ${formatDate(endDate)}`;
  }
  return start;
}

/**
 * Generate ATS-friendly plain text resume
 * ATS format requirements:
 * - Plain text with simple formatting
 * - Standard sections
 * - No complex layouts or graphics
 * - Easy to parse by ATS systems
 */
export function generateATSResume(resumeData: ResumeExportData): string {
  const lines: string[] = [];

  // Header Section
  lines.push(resumeData.name.trim().toUpperCase());
  lines.push('');

  // Contact Information
  const contactInfo: string[] = [];
  if (resumeData.email?.trim()) contactInfo.push(resumeData.email.trim());
  if (resumeData.phone?.trim()) contactInfo.push(resumeData.phone.trim());
  if (resumeData.location?.trim()) contactInfo.push(resumeData.location.trim());

  if (contactInfo.length > 0) {
    lines.push(contactInfo.join(' | '));
    lines.push('');
  }

  // Professional Summary / Background Information
  if (resumeData.backgroundInformation && resumeData.backgroundInformation.trim()) {
    lines.push('PROFESSIONAL SUMMARY');
    lines.push('─'.repeat(50));
    lines.push(resumeData.backgroundInformation.trim());
    lines.push('');
  }

  // Skills Section
  if (resumeData.skills && resumeData.skills.length > 0) {
    lines.push('SKILLS');
    lines.push('─'.repeat(50));
    // Format skills as comma-separated list
    const skillsList = resumeData.skills
      .filter(skill => skill.trim())
      .map(skill => skill.trim())
      .join(', ');
    lines.push(skillsList);
    lines.push('');
  }

  // Experience Section
  if (resumeData.experience && resumeData.experience.length > 0) {
    lines.push('PROFESSIONAL EXPERIENCE');
    lines.push('─'.repeat(50));

    resumeData.experience.forEach((exp, index) => {
      if (exp.title && exp.company && exp.startDate) {
        // Job Title (make it stand out)
        lines.push(exp.title.trim());
        // Company and Date Range
        const dateRange = formatDateRange(exp.startDate, exp.endDate, exp.current);
        lines.push(`${exp.company.trim()} | ${dateRange}`);

        // Description
        if (exp.description && exp.description.trim()) {
          // Format description with bullet points
          const descriptionLines = exp.description
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
              const trimmed = line.trim();
              // If line already starts with bullet, use it; otherwise add one
              return trimmed.startsWith('•') || trimmed.startsWith('-')
                ? `  ${trimmed}`
                : `  • ${trimmed}`;
            });
          lines.push(...descriptionLines);
        }

        // Add spacing between experiences (except last one)
        if (index < resumeData.experience.length - 1) {
          lines.push('');
        }
      }
    });

    lines.push('');
  }

  // Education Section
  if (resumeData.education && resumeData.education.length > 0) {
    lines.push('EDUCATION');
    lines.push('─'.repeat(50));

    resumeData.education.forEach((edu, index) => {
      if (edu.degree && edu.institution) {
        // Degree (make it stand out)
        lines.push(edu.degree.trim());

        const institutionInfo: string[] = [edu.institution.trim()];
        if (edu.graduationYear) {
          institutionInfo.push(edu.graduationYear.toString());
        }
        if (edu.gpa !== undefined && edu.gpa !== null) {
          // Format GPA consistently (gpa is number in ResumeData)
          const gpaValue = typeof edu.gpa === 'number' ? edu.gpa : parseFloat(String(edu.gpa));
          if (!isNaN(gpaValue)) {
            institutionInfo.push(`GPA: ${gpaValue.toFixed(1)}`);
          }
        }
        lines.push(institutionInfo.join(' | '));

        // Add spacing between education entries (except last one)
        if (index < resumeData.education.length - 1) {
          lines.push('');
        }
      }
    });

    lines.push('');
  }

  // Certifications Section
  if (resumeData.certifications && resumeData.certifications.length > 0) {
    lines.push('CERTIFICATIONS');
    lines.push('─'.repeat(50));

    resumeData.certifications.forEach((cert, index) => {
      if (cert.name && cert.issuer && cert.date) {
        const certLine = `${cert.name.trim()} | ${cert.issuer.trim()} | ${formatDate(cert.date)}`;
        lines.push(certLine);

        // Add spacing between certifications (except last one)
        if (index < resumeData.certifications.length - 1) {
          lines.push('');
        }
      }
    });

    lines.push('');
  }

  // Footer
  lines.push('─'.repeat(50));
  lines.push(`Generated on ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`);

  return lines.join('\n');
}

/**
 * Generate professional HTML resume with enhanced styling for PDF conversion
 */
export function generateATSResumeHTML(resumeData: ResumeExportData): string {
  const htmlLines: string[] = [];

  htmlLines.push('<!DOCTYPE html>');
  htmlLines.push('<html lang="en">');
  htmlLines.push('<head>');
  htmlLines.push('<meta charset="UTF-8">');
  htmlLines.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  htmlLines.push('<title>Resume - ' + resumeData.name + '</title>');
  htmlLines.push('<style>');
  htmlLines.push('* { margin: 0; padding: 0; box-sizing: border-box; }');
  htmlLines.push('body { font-family: "Helvetica Neue", Helvetica, Arial, "Segoe UI", sans-serif; line-height: 1.6; margin: 0; padding: 30px 50px; color: #1a1a1a; background: #ffffff; }');
  htmlLines.push('@media print { body { padding: 20px 40px; } @page { margin: 0.3in; size: A4; } }');
  htmlLines.push('@page { size: A4; margin: 0.3in; }');
  htmlLines.push('');
  htmlLines.push('/* Header Section */');
  htmlLines.push('.header { border-bottom: 4px solid #2c3e50; padding-bottom: 24px; margin-bottom: 32px; }');
  htmlLines.push('h1 { font-size: 36px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #1a1a1a; margin-bottom: 14px; line-height: 1.1; }');
  htmlLines.push('.contact-info { font-size: 15px; color: #555; margin-top: 10px; line-height: 2; font-weight: 400; }');
  htmlLines.push('.contact-info span { margin: 0 10px; color: #666; }');
  htmlLines.push('');
  htmlLines.push('/* Section Headings */');
  htmlLines.push('h2 { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #1a1a1a; margin-top: 32px; margin-bottom: 18px; padding-bottom: 10px; }');
  htmlLines.push('');
  htmlLines.push('/* Sections */');
  htmlLines.push('.section { margin-bottom: 24px; page-break-inside: avoid; }');
  htmlLines.push('.section-content { margin-left: 0; }');
  htmlLines.push('');
  htmlLines.push('/* Professional Summary */');
  htmlLines.push('.summary { font-size: 15px; line-height: 1.9; color: #444; text-align: justify; margin-top: 8px; }');
  htmlLines.push('');
  htmlLines.push('/* Skills */');
  htmlLines.push('.skills { font-size: 15px; line-height: 2; color: #444; font-weight: 500; }');
  htmlLines.push('');
  htmlLines.push('/* Experience & Education Items */');
  htmlLines.push('.item { margin-bottom: 18px; page-break-inside: avoid; }');
  htmlLines.push('.item-title { font-size: 18px; font-weight: 800; color: #1a1a1a; margin-bottom: 6px; letter-spacing: 0.5px; }');
  htmlLines.push('.item-subtitle { font-size: 16px; color: #2c3e50; margin-bottom: 6px; font-weight: 600; font-style: normal; }');
  htmlLines.push('.item-meta { font-size: 14px; color: #666; margin-bottom: 12px; font-weight: 500; }');
  htmlLines.push('.item-description { font-size: 14px; line-height: 1.8; color: #444; margin-top: 10px; }');
  htmlLines.push('');
  htmlLines.push('/* Lists */');
  htmlLines.push('ul { margin: 10px 0 10px 24px; padding-left: 0; list-style: none; }');
  htmlLines.push('li { margin: 8px 0; line-height: 1.8; color: #444; position: relative; padding-left: 20px; }');
  htmlLines.push('li:before { content: "▸"; position: absolute; left: 0; color: #3498db; font-weight: bold; font-size: 16px; }');
  htmlLines.push('');
  htmlLines.push('/* Certifications */');
  htmlLines.push('.cert-item { font-size: 15px; line-height: 1.6; color: #444; margin-bottom: 8px; page-break-inside: avoid; }');
  htmlLines.push('.cert-name { font-weight: 700; color: #1a1a1a; }');
  htmlLines.push('');
  htmlLines.push('/* Footer */');
  htmlLines.push('.footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #888; }');
  htmlLines.push('');
  htmlLines.push('/* Spacing */');
  htmlLines.push('p { margin: 8px 0; }');
  htmlLines.push('.spacer { height: 12px; }');
  htmlLines.push('</style>');
  htmlLines.push('</head>');
  htmlLines.push('<body>');

  // Header Section
  htmlLines.push('<div class="header">');
  htmlLines.push(`<h1>${resumeData.name.trim()}</h1>`);

  // Contact Information
  const contactParts: string[] = [];
  if (resumeData.email?.trim()) contactParts.push(`<span>${resumeData.email.trim()}</span>`);
  if (resumeData.phone?.trim()) contactParts.push(`<span>${resumeData.phone.trim()}</span>`);
  if (resumeData.location?.trim()) contactParts.push(`<span>${resumeData.location.trim()}</span>`);

  if (contactParts.length > 0) {
    htmlLines.push(`<div class="contact-info">${contactParts.join(' • ')}</div>`);
  }
  htmlLines.push('</div>');

  // Professional Summary
  if (resumeData.backgroundInformation && resumeData.backgroundInformation.trim()) {
    htmlLines.push('<div class="section">');
    htmlLines.push('<h2>PROFESSIONAL SUMMARY</h2>');
    htmlLines.push(`<div class="summary">${resumeData.backgroundInformation.trim().replace(/\n/g, '<br>')}</div>`);
    htmlLines.push('</div>');
  }

  // Skills
  if (resumeData.skills && resumeData.skills.length > 0) {
    htmlLines.push('<div class="section">');
    htmlLines.push('<h2>SKILLS</h2>');
    const skillsList = resumeData.skills
      .filter(skill => skill.trim())
      .map(skill => skill.trim())
      .join(' • ');
    htmlLines.push(`<div class="skills">${skillsList}</div>`);
    htmlLines.push('</div>');
  }

  // Experience
  if (resumeData.experience && resumeData.experience.length > 0) {
    htmlLines.push('<div class="section">');
    htmlLines.push('<h2>PROFESSIONAL EXPERIENCE</h2>');

    resumeData.experience.forEach((exp, index) => {
      if (exp.title && exp.company && exp.startDate) {
        htmlLines.push('<div class="item">');
        htmlLines.push(`<div class="item-title">${exp.title.trim()}</div>`);
        const dateRange = formatDateRange(exp.startDate, exp.endDate, exp.current);
        htmlLines.push(`<div class="item-subtitle">${exp.company.trim()}</div>`);
        htmlLines.push(`<div class="item-meta">${dateRange}</div>`);

        if (exp.description && exp.description.trim()) {
          const descriptionLines = exp.description
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
              const trimmed = line.trim();
              // Remove existing bullets and add proper formatting
              return trimmed.replace(/^[•\-*]\s*/, '').trim();
            });
          if (descriptionLines.length > 0) {
            htmlLines.push('<ul>');
            descriptionLines.forEach(line => {
              if (line) htmlLines.push(`<li>${line}</li>`);
            });
            htmlLines.push('</ul>');
          }
        }

        htmlLines.push('</div>');
        if (index < resumeData.experience.length - 1) {
          htmlLines.push('<div class="spacer"></div>');
        }
      }
    });

    htmlLines.push('</div>');
  }

  // Education
  if (resumeData.education && resumeData.education.length > 0) {
    htmlLines.push('<div class="section">');
    htmlLines.push('<h2>EDUCATION</h2>');

    resumeData.education.forEach((edu, index) => {
      if (edu.degree && edu.institution) {
        htmlLines.push('<div class="item">');
        htmlLines.push(`<div class="item-title">${edu.degree.trim()}</div>`);

        const institutionInfo: string[] = [edu.institution.trim()];
        if (edu.graduationYear) {
          institutionInfo.push(edu.graduationYear.toString());
        }
        if (edu.gpa !== undefined && edu.gpa !== null) {
          // Ensure gpa is a number before calling toFixed
          const gpaValue = typeof edu.gpa === 'number' ? edu.gpa : parseFloat(String(edu.gpa));
          if (!isNaN(gpaValue)) {
            institutionInfo.push(`GPA: ${gpaValue.toFixed(1)}`);
          }
        }
        htmlLines.push(`<div class="item-subtitle">${institutionInfo.join(' • ')}</div>`);
        htmlLines.push('</div>');
        if (index < resumeData.education.length - 1) {
          htmlLines.push('<div class="spacer"></div>');
        }
      }
    });

    htmlLines.push('</div>');
  }

  // Certifications
  if (resumeData.certifications && resumeData.certifications.length > 0) {
    htmlLines.push('<div class="section">');
    htmlLines.push('<h2>CERTIFICATIONS</h2>');

    resumeData.certifications.forEach((cert, index) => {
      if (cert.name && cert.issuer && cert.date) {
        htmlLines.push('<div class="cert-item">');
        htmlLines.push(`<span class="cert-name">${cert.name.trim()}</span> • ${cert.issuer.trim()} • ${formatDate(cert.date)}`);
        htmlLines.push('</div>');
        if (index < resumeData.certifications.length - 1) {
          htmlLines.push('<div class="spacer"></div>');
        }
      }
    });

    htmlLines.push('</div>');
  }

  // Footer
  htmlLines.push('<div class="footer">');
  htmlLines.push(`Generated on ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`);
  htmlLines.push('</div>');

  htmlLines.push('</body>');
  htmlLines.push('</html>');

  return htmlLines.join('\n');
}

/**
 * Generate and share PDF resume
 * Generates professional HTML resume and shares it
 * Note: To enable true PDF generation, install react-native-html-to-pdf
 * For now, shares HTML which can be converted to PDF by receiving apps
 */
export async function generateAndShareResumePDF(
  resumeData: Omit<ResumeExportData, 'certifications'> & {
    certifications?: ResumeData['certifications'];
  }
): Promise<void> {
  // Ensure certifications array exists
  const exportData: ResumeExportData = {
    ...resumeData,
    certifications: resumeData.certifications || [],
  };
  try {
    // Generate professional HTML resume with enhanced styling
    const html = generateATSResumeHTML(exportData);

    // Try to use PDF library if available, otherwise share HTML
    if (generatePDF || HtmlToPdfNative) {
      try {
        // PDF library is available - generate PDF
        const fileName = exportData.name.trim().replace(/\s+/g, '_') + '_Resume';
        const options = {
          html: html,
          fileName: fileName,
          directory: Platform.OS === 'ios' ? 'Documents' : 'Downloads',
          base64: false,
          width: 595,  // A4 width in points
          height: 1000, // Increased height to fit more content (standard A4 is 842)
          paddingLeft: 50,
          paddingRight: 50,
          paddingTop: 30,
          paddingBottom: 30,
        };

        if (__DEV__) {
          console.log('📄 Generating PDF with options:', JSON.stringify(options, null, 2));
        }

        // Use the correct API based on what's available
        const file = generatePDF
          ? await generatePDF(options)
          : await HtmlToPdfNative.convert(options);

        if (!file || !file.filePath) {
          throw new Error('PDF generation failed: No file path returned');
        }

        let pdfPath = file.filePath;

        if (__DEV__) {
          console.log('✅ PDF generated successfully at:', pdfPath);
        }

        // Android-specific fix: Copy file to public Downloads directory
        if (Platform.OS === 'android') {
          try {
            // Remove file:// prefix if present
            const sourcePath = pdfPath.replace('file://', '');
            
            // Verify source file exists
            const sourceExists = await RNFS.exists(sourcePath);
            if (!sourceExists) {
              throw new Error(`Source PDF file not found: ${sourcePath}`);
            }

            // Get public Downloads directory path
            // On Android 10+, use ExternalStorageDirectoryPath/Download
            const downloadsPath = RNFS.DownloadDirectoryPath || 
                                 `${RNFS.ExternalStorageDirectoryPath}/Download` ||
                                 RNFS.PicturesDirectoryPath;
            
            // Ensure Downloads directory exists
            const downloadsExists = await RNFS.exists(downloadsPath);
            if (!downloadsExists) {
              await RNFS.mkdir(downloadsPath);
            }

            const publicPdfPath = `${downloadsPath}/${fileName}.pdf`;

            if (__DEV__) {
              console.log('📁 Source PDF path:', sourcePath);
              console.log('📁 Downloads directory:', downloadsPath);
              console.log('📁 Target PDF path:', publicPdfPath);
            }

            // Copy file to public Downloads directory
            await RNFS.copyFile(sourcePath, publicPdfPath);

            // Verify file was copied
            const fileExists = await RNFS.exists(publicPdfPath);
            if (!fileExists) {
              throw new Error('Failed to copy PDF to Downloads directory - file not found after copy');
            }

            // Get file info to verify
            const fileInfo = await RNFS.stat(publicPdfPath);
            if (__DEV__) {
              console.log('✅ PDF copied successfully. File size:', fileInfo.size, 'bytes');
            }

            pdfPath = publicPdfPath;

            if (__DEV__) {
              console.log('✅ PDF saved to public Downloads:', pdfPath);
            }
          } catch (copyError: any) {
            if (__DEV__) {
              console.error('❌ Failed to copy PDF to Downloads:', copyError.message);
              console.error('Error details:', {
                message: copyError.message,
                code: copyError.code,
                stack: copyError.stack?.substring(0, 300),
              });
            }
            // Continue with original path - Share API might still work with file:// URI
            // But user won't be able to find it in Downloads folder
          }
        }

        // Share PDF file - Android requires content:// URI for proper sharing
        if (Platform.OS === 'android') {
          // Remove file:// prefix if present
          const filePath = pdfPath.replace('file://', '');
          
          // Verify file exists
          const fileExists = await RNFS.exists(filePath);
          if (!fileExists) {
            throw new Error(`PDF file not found: ${filePath}`);
          }

          // Get file info
          const fileInfo = await RNFS.stat(filePath);
          
          if (__DEV__) {
            console.log('📤 Sharing PDF file:', filePath);
            console.log('📊 File info:', {
              path: filePath,
              size: fileInfo.size,
              isFile: fileInfo.isFile(),
            });
          }

          // Use Share API with proper URI format
          // For Android, we need to ensure the file is accessible
          // React Native Share should handle file:// to content:// conversion via FileProvider
          try {
            // Construct the file URI
            // React Native Share API will use FileProvider to convert file:// to content://
            const fileUri = `file://${filePath}`;
            
            if (__DEV__) {
              console.log('📤 Sharing PDF with URI:', fileUri);
              console.log('📤 FileProvider should convert this to content:// URI automatically');
            }

            // Share with file:// URI - React Native Share API + FileProvider will convert it
            // The FileProvider we added to AndroidManifest will handle the conversion
            const shareResult = await Share.share({
              url: fileUri,
              title: `${exportData.name.trim()}'s Resume`,
              type: 'application/pdf',
            });

            if (__DEV__) {
              console.log('✅ Share dialog opened:', shareResult);
            }

            // Note: If Google Drive still shows "no data", it might be a FileProvider configuration issue
            // The file is saved to Downloads folder, so user can manually share it
          } catch (shareError: any) {
            if (__DEV__) {
              console.error('❌ Share error:', shareError);
              console.error('Error details:', {
                message: shareError.message,
                code: shareError.code,
                stack: shareError.stack?.substring(0, 300),
              });
            }
            
            // If Share API fails, the file is still saved to Downloads
            // User can manually share it from there or use a file manager
            throw new Error('Failed to open share dialog. The PDF has been saved to your Downloads folder. You can share it manually from there.');
          }
        } else {
          // iOS - use file:// URI
          const fileUri = pdfPath.startsWith('file://') ? pdfPath : `file://${pdfPath}`;
          
          if (__DEV__) {
            console.log('📤 Sharing PDF file (iOS):', fileUri);
          }

          await Share.share({
            url: fileUri,
            title: `${exportData.name.trim()}'s Resume`,
          });
        }

        return;
      } catch (pdfError: any) {
        // PDF library error - log and fallback to HTML sharing
        if (__DEV__) {
          console.error('❌ PDF generation error:', pdfError);
          console.error('Error details:', {
            message: pdfError.message,
            code: pdfError.code,
            stack: pdfError.stack?.substring(0, 500),
          });
        }
        // Continue to HTML fallback
      }
    } else {
      if (__DEV__) {
        console.warn('⚠️ PDF library not available, falling back to HTML format');
      }
    }

    // Fallback: Share as HTML (can be converted to PDF by receiving app)
    const result = await Share.share({
      message: html,
      title: `${exportData.name.trim()}'s Resume`,
    });

    if (result.action === Share.sharedAction) {
      // Success - user shared the resume
      return;
    }
  } catch (error: any) {
    // User cancelled sharing
    if (error.message?.includes('cancel') || error.message?.includes('dismiss')) {
      return;
    }
    if (__DEV__) {
      console.error('Error sharing resume:', error);
    }
    throw new Error('Failed to share resume. Please try again.');
  }
}

