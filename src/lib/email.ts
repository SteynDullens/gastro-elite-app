import nodemailer from 'nodemailer';
import { promises as fs } from 'fs';
import path from 'path';

// Email configuration for ZXCS DirectAdmin
const emailConfig = {
  host: process.env.SMTP_HOST || 'mail.zxcs.nl',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'noreply@gastro-elite.com',
    pass: process.env.SMTP_PASS || 'your-password'
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Admin email configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gastro-elite.com';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

export interface BusinessRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName: string;
  kvkNumber: string;
  vatNumber?: string;
  companyPhone?: string;
  address: {
    country: string;
    postalCode: string;
    street: string;
    city: string;
  };
  kvkDocumentPath?: string;
}

export interface PersonalRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

// Send business registration notification to admin
export async function sendBusinessRegistrationNotification(
  data: BusinessRegistrationData,
  kvkDocumentPath?: string
): Promise<boolean> {
  try {
    const attachments = [];
    
    // Add KvK document as attachment if provided
    if (kvkDocumentPath && await fileExists(kvkDocumentPath)) {
      attachments.push({
        filename: `kvk-document-${data.kvkNumber}.pdf`,
        path: kvkDocumentPath
      });
    }

    const mailOptions = {
      from: `"Gastro-Elite Registration" <${emailConfig.auth.user}>`,
      to: ADMIN_EMAIL,
      subject: `New Business Account Request - ${data.companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF8C00;">New Business Account Registration</h2>
          
          <h3>Company Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Company Name:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${data.companyName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>KvK Number:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${data.kvkNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>VAT Number:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${data.vatNumber || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Company Phone:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${data.companyPhone || 'Not provided'}</td>
            </tr>
          </table>

          <h3>Company Address</h3>
          <p>
            ${data.address.street}<br>
            ${data.address.postalCode} ${data.address.city}<br>
            ${data.address.country}
          </p>

          <h3>Contact Person</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Name:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${data.firstName} ${data.lastName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Email:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${data.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Phone:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${data.phone || 'Not provided'}</td>
            </tr>
          </table>

          <p style="margin-top: 20px;">
            <strong>Action Required:</strong> Please review this business account request and approve or reject it in the admin panel.
          </p>
        </div>
      `,
      attachments
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending business registration notification:', error);
    return false;
  }
}

// Send personal registration confirmation
export async function sendPersonalRegistrationConfirmation(
  data: PersonalRegistrationData,
  verificationToken: string
): Promise<boolean> {
  try {
    const verificationUrl = `${APP_URL}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"Gastro-Elite" <${emailConfig.auth.user}>`,
      to: data.email,
      subject: 'Welkom bij Gastro-Elite - Verifieer je account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF8C00;">Welkom bij Gastro-Elite!</h2>
          
          <p>Beste ${data.firstName} ${data.lastName},</p>
          
          <p>Bedankt voor je registratie bij Gastro-Elite! We zijn blij dat je je aansluit bij onze community van professionele chefs en culinaire experts.</p>
          
          <h3>Je registratiegegevens</h3>
          <ul>
            <li><strong>Naam:</strong> ${data.firstName} ${data.lastName}</li>
            <li><strong>E-mail:</strong> ${data.email}</li>
            <li><strong>Telefoon:</strong> ${data.phone || 'Niet opgegeven'}</li>
            <li><strong>Accounttype:</strong> Persoonlijk Account</li>
          </ul>
          
          <p><strong>Belangrijk:</strong> Om je registratie te voltooien, verifieer je e-mailadres door op de knop hieronder te klikken:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #FF8C00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verifieer mijn account
            </a>
          </div>
          
          <p><strong>Let op:</strong> Deze verificatielink verloopt over 24 uur om veiligheidsredenen.</p>
          
          <p>Als je vragen hebt, aarzel dan niet om contact op te nemen met ons supportteam.</p>
          
          <p>Met vriendelijke groet,<br>Het Gastro-Elite Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending personal registration confirmation:', error);
    return false;
  }
}

// Send business registration confirmation
export async function sendBusinessRegistrationConfirmation(
  data: BusinessRegistrationData,
  verificationToken: string
): Promise<boolean> {
  try {
    const verificationUrl = `${APP_URL}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"Gastro-Elite" <${emailConfig.auth.user}>`,
      to: data.email,
      subject: 'Bedrijfsaccount registratie - In behandeling',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF8C00;">Bedrijfsaccount registratie ontvangen</h2>
          
          <p>Beste ${data.firstName} ${data.lastName},</p>
          
          <p>Bedankt voor het registreren van je bedrijfsaccount bij Gastro-Elite! We hebben je aanvraag ontvangen en zullen deze binnenkort beoordelen.</p>
          
          <h3>Je bedrijfsregistratiegegevens</h3>
          <ul>
            <li><strong>Bedrijfsnaam:</strong> ${data.companyName}</li>
            <li><strong>KvK Nummer:</strong> ${data.kvkNumber}</li>
            <li><strong>Contactpersoon:</strong> ${data.firstName} ${data.lastName}</li>
            <li><strong>E-mail:</strong> ${data.email}</li>
            <li><strong>Telefoon:</strong> ${data.phone || 'Niet opgegeven'}</li>
          </ul>
          
          <p><strong>Beoordelingsproces:</strong> Je bedrijfsaccount aanvraag wordt binnen 24 uur beoordeeld. Je ontvangt een e-mailmelding zodra je account is goedgekeurd.</p>
          
          <p><strong>E-mailverificatie:</strong> Om je registratie te voltooien, verifieer je e-mailadres door op de knop hieronder te klikken:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #FF8C00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verifieer mijn e-mail
            </a>
          </div>
          
          <p><strong>Let op:</strong> Deze verificatielink verloopt over 24 uur om veiligheidsredenen.</p>
          
          <p>Als je vragen hebt over je bedrijfsaccount aanvraag, aarzel dan niet om contact op te nemen met ons supportteam.</p>
          
          <p>Met vriendelijke groet,<br>Het Gastro-Elite Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
                  console.error('Error sending business registration confirmation:', error);
    return false;
  }
}

// Send business account approval notification
export async function sendBusinessApprovalNotification(
  userEmail: string,
  companyName: string,
  userName: string
): Promise<boolean> {
  try {
    const loginUrl = `${APP_URL}/login`;
    
    const mailOptions = {
      from: `"Gastro-Elite" <${emailConfig.auth.user}>`,
      to: userEmail,
      subject: 'Your Business Account Has Been Approved!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF8C00;">🎉 Business Account Approved!</h2>
          
          <p>Dear ${userName},</p>
          
          <p>Great news! Your business account for <strong>${companyName}</strong> has been approved and is now active.</p>
          
          <h3>What's Next?</h3>
          <ul>
            <li>✅ Your business account is fully activated</li>
            <li>✅ You can now access all business features</li>
            <li>✅ Start managing your team and recipes</li>
            <li>✅ Invite employees to join your organization</li>
          </ul>
          
          <p><strong>Get Started:</strong> Log in to your account to begin using all the business features:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" 
               style="background-color: #FF8C00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Log In to Your Account
            </a>
          </div>
          
          <h3>Available Business Features:</h3>
          <ul>
            <li><strong>Team Management:</strong> Invite and manage employees</li>
            <li><strong>Recipe Management:</strong> Create and organize professional recipes</li>
            <li><strong>Category Management:</strong> Organize recipes with custom categories</li>
            <li><strong>Business Analytics:</strong> Track your recipe usage and team activity</li>
          </ul>
          
          <p>If you have any questions or need assistance getting started, please don't hesitate to contact our support team.</p>
          
          <p>Welcome to Gastro-Elite!<br>The Gastro-Elite Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending business approval notification:', error);
    return false;
  }
}

// Send business account rejection notification
export async function sendBusinessRejectionNotification(
  userEmail: string,
  companyName: string,
  userName: string,
  reason?: string
): Promise<boolean> {
  try {
    const supportUrl = `${APP_URL}/contact`;
    
    const mailOptions = {
      from: `"Gastro-Elite" <${emailConfig.auth.user}>`,
      to: userEmail,
      subject: 'Business Account Application Update',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF8C00;">Business Account Application Update</h2>
          
          <p>Dear ${userName},</p>
          
          <p>Thank you for your interest in Gastro-Elite. After careful review of your business account application for <strong>${companyName}</strong>, we are unable to approve your request at this time.</p>
          
          ${reason ? `
          <div style="background-color: #f8f9fa; border-left: 4px solid #FF8C00; padding: 15px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #333;">Reason for Rejection:</h4>
            <p style="margin-bottom: 0;">${reason}</p>
          </div>
          ` : ''}
          
          <h3>Next Steps:</h3>
          <ul>
            <li>Review the provided feedback (if any)</li>
            <li>Correct any issues with your application</li>
            <li>Resubmit your business account application</li>
            <li>Contact our support team if you have questions</li>
          </ul>
          
          <p>We encourage you to reapply once you have addressed any concerns. Our team is here to help you through the application process.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${supportUrl}" 
               style="background-color: #FF8C00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Contact Support
            </a>
          </div>
          
          <p>Thank you for your understanding, and we look forward to working with you in the future.</p>
          
          <p>Best regards,<br>The Gastro-Elite Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending business rejection notification:', error);
    return false;
  }
}

// Helper function to check if file exists
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Test email configuration
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}
