import nodemailer from 'nodemailer';
import { promises as fs } from 'fs';
import path from 'path';

// Get email configuration (called at runtime to ensure env vars are loaded)
// Note: .trim() removes any newline characters that may have been added by environment variable tools
function getEmailConfig() {
  return {
    host: (process.env.SMTP_HOST || 'mail.zxcs.nl').trim(),
    port: parseInt((process.env.SMTP_PORT || '465').trim()),
    secure: true, // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: (process.env.SMTP_USER || 'noreply@gastro-elite.com').trim(),
      pass: (process.env.SMTP_PASS || '!Janssenstraat1211').trim()
    }
  };
}

// Create transporter lazily (for each email to ensure fresh config)
function getTransporter() {
  const config = getEmailConfig();
  console.log('📧 Creating transporter with config:', {
    host: config.host,
    port: config.port,
    user: config.auth.user,
    passSet: !!config.auth.pass
  });
  return nodemailer.createTransport(config);
}

// Admin email configuration (runtime)
function getAdminEmail() {
  return process.env.ADMIN_EMAIL || 'admin@gastro-elite.com';
}
function getAppUrl() {
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

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

// Generate action token for email buttons
// Overloaded: for employee invitations (with invitationId) or business approvals (without invitationId)
function generateActionToken(companyId: string, invitationIdOrAction: string, action?: string): string {
  const crypto = require('crypto');
  const secret = process.env.JWT_SECRET || process.env.DWT_SECRET || 'gastro-elite-secret';
  
  // If action is provided, it's an employee invitation (companyId, invitationId, action)
  // Otherwise, it's a business approval (companyId, action)
  if (action !== undefined) {
    // Employee invitation format: companyId:invitationId:action
    return crypto
      .createHmac('sha256', secret)
      .update(`${companyId}:${invitationIdOrAction}:${action}`)
      .digest('hex')
      .substring(0, 32);
  } else {
    // Business approval format: companyId:action
    return crypto
      .createHmac('sha256', secret)
      .update(`${companyId}:${invitationIdOrAction}`)
      .digest('hex')
      .substring(0, 32);
  }
}

// Send business registration notification to admin
export async function sendBusinessRegistrationNotification(
  data: BusinessRegistrationData,
  kvkDocumentPath?: string,
  kvkDocumentData?: string,
  companyId?: string
): Promise<boolean> {
  try {
    const attachments: any[] = [];
    
    // Add KvK document as attachment
    if (kvkDocumentData && kvkDocumentData.startsWith('data:')) {
      // Base64 encoded document
      const matches = kvkDocumentData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const extension = mimeType.includes('pdf') ? 'pdf' : mimeType.includes('png') ? 'png' : 'jpg';
        attachments.push({
          filename: `KvK-uittreksel-${data.kvkNumber}.${extension}`,
          content: base64Data,
          encoding: 'base64'
        });
      }
    } else if (kvkDocumentPath && !kvkDocumentPath.startsWith('base64:')) {
      // URL-based document (Vercel Blob)
      if (kvkDocumentPath.startsWith('http')) {
        attachments.push({
          filename: `KvK-uittreksel-${data.kvkNumber}.pdf`,
          path: kvkDocumentPath
        });
      } else if (await fileExists(kvkDocumentPath)) {
        attachments.push({
          filename: `KvK-uittreksel-${data.kvkNumber}.pdf`,
          path: kvkDocumentPath
        });
      }
    }

    const emailConfig = getEmailConfig();
    const appUrl = getAppUrl();
    const adminPanelUrl = `${appUrl}/admin/business-applications`;
    
    // Generate action tokens if companyId is provided
    let actionButtons = '';
    if (companyId) {
      const approveToken = generateActionToken(companyId, 'approve');
      const rejectToken = generateActionToken(companyId, 'reject');
      const approveUrl = `${appUrl}/api/admin/email-action?companyId=${companyId}&action=approve&token=${approveToken}`;
      const rejectUrl = `${appUrl}/api/admin/email-action?companyId=${companyId}&action=reject&token=${rejectToken}`;
      
      actionButtons = `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${approveUrl}" 
               style="display: inline-block; background-color: #22c55e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 12px; font-size: 16px;">
              ✓ Goedkeuren
            </a>
            <a href="${rejectUrl}" 
               style="display: inline-block; background-color: #ef4444; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              ✗ Afwijzen
            </a>
          </div>
          <p style="text-align: center; color: #6b7280; font-size: 13px; margin-top: 8px;">
            Of beheer deze aanvraag in het <a href="${adminPanelUrl}" style="color: #FF8C00;">Admin Panel</a>
          </p>`;
    } else {
      actionButtons = `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${adminPanelUrl}" 
               style="display: inline-block; background-color: #FF8C00; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Bekijk in Admin Panel
            </a>
          </div>`;
    }

    const currentDate = new Date().toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const mailOptions = {
      from: `"Gastro-Elite" <${emailConfig.auth.user}>`,
      to: getAdminEmail(),
      subject: `🏢 Nieuwe Bedrijfsaccount Aanvraag - ${data.companyName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #FF8C00 0%, #FF6B00 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
              🏢 Nieuwe Bedrijfsaccount Aanvraag
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">
              Ontvangen op ${currentDate}
            </p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px; background-color: #f9fafb; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            
            <!-- Company Info Card -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 18px; border-bottom: 2px solid #FF8C00; padding-bottom: 10px;">
                📋 Bedrijfsgegevens
              </h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; width: 40%;">Bedrijfsnaam</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #1f2937; font-weight: 600;">${data.companyName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">KvK Nummer</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #1f2937; font-weight: 500;">${data.kvkNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">BTW Nummer</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #1f2937;">${data.vatNumber || '<span style="color: #9ca3af;">Niet opgegeven</span>'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6b7280;">Bedrijfstelefoon</td>
                  <td style="padding: 12px 0; color: #1f2937;">${data.companyPhone || '<span style="color: #9ca3af;">Niet opgegeven</span>'}</td>
                </tr>
              </table>
            </div>

            <!-- Address Card -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 18px; border-bottom: 2px solid #FF8C00; padding-bottom: 10px;">
                📍 Vestigingsadres
              </h2>
              <p style="color: #1f2937; margin: 0; line-height: 1.8;">
                ${data.address.street || '<span style="color: #9ca3af;">-</span>'}<br>
                ${data.address.postalCode || ''} ${data.address.city || ''}<br>
                ${data.address.country || 'Nederland'}
              </p>
            </div>

            <!-- Contact Person Card -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 18px; border-bottom: 2px solid #FF8C00; padding-bottom: 10px;">
                👤 Contactpersoon
              </h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; width: 40%;">Naam</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #1f2937; font-weight: 600;">${data.firstName} ${data.lastName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">E-mailadres</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                    <a href="mailto:${data.email}" style="color: #FF8C00; text-decoration: none;">${data.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6b7280;">Telefoonnummer</td>
                  <td style="padding: 12px 0; color: #1f2937;">${data.phone || '<span style="color: #9ca3af;">Niet opgegeven</span>'}</td>
                </tr>
              </table>
            </div>

            <!-- Document Notice -->
            ${attachments.length > 0 ? `
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                📎 <strong>Bijlage:</strong> KvK uittreksel is bijgevoegd aan deze e-mail
              </p>
            </div>
            ` : ''}

            <!-- Action Buttons -->
            <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 18px; text-align: center;">
                ⚡ Actie Vereist
              </h2>
              <p style="color: #6b7280; text-align: center; margin: 0 0 20px;">
                Controleer de gegevens en keur de aanvraag goed of af.
              </p>
              ${actionButtons}
            </div>

          </div>
          
          <!-- Footer -->
          <div style="background-color: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="color: #9ca3af; margin: 0; font-size: 13px;">
              © ${new Date().getFullYear()} Gastro-Elite • Professioneel Receptenbeheer
            </p>
          </div>
        </div>
      `,
      attachments
    };

    await getTransporter().sendMail(mailOptions);
    console.log('✅ Admin notification email sent with', attachments.length, 'attachment(s)');
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
    const emailConfig = getEmailConfig();
    const appUrl = getAppUrl();
    
    console.log('📧 Sending personal registration confirmation to:', data.email);
    console.log('📧 From:', emailConfig.auth.user);
    console.log('📧 Verification token:', verificationToken);
    
    const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;
    console.log('📧 Verification URL:', verificationUrl);
    
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

    const transporter = getTransporter();
    
    // First verify the connection
    console.log('📧 Verifying SMTP connection...');
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified!');
    } catch (verifyError: any) {
      console.error('❌ SMTP verification failed:', verifyError.message);
      console.error('Full verify error:', JSON.stringify(verifyError, Object.getOwnPropertyNames(verifyError)));
    }
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Personal registration email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📧 Response:', result.response);
    console.log('📧 Accepted:', result.accepted);
    console.log('📧 Rejected:', result.rejected);
    console.log('📧 Envelope:', JSON.stringify(result.envelope));
    return true;
  } catch (error: any) {
    console.error('❌ Error sending personal registration confirmation');
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error command:', error.command);
    console.error('Error responseCode:', error.responseCode);
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return false;
  }
}

// Send business registration confirmation
export async function sendBusinessRegistrationConfirmation(
  data: BusinessRegistrationData,
  verificationToken: string
): Promise<boolean> {
  try {
    const emailConfig = getEmailConfig();
    const appUrl = getAppUrl();
    const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;
    
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

    await getTransporter().sendMail(mailOptions);
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
    const emailConfig = getEmailConfig();
    const loginUrl = `${getAppUrl()}/login`;
    
    const currentDate = new Date().toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: `"Gastro-Elite" <${emailConfig.auth.user}>`,
      to: userEmail,
      subject: `🎉 Uw bedrijfsaccount is goedgekeurd - ${companyName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
              Account Goedgekeurd!
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0; font-size: 16px;">
              Welkom bij Gastro-Elite
            </p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px; background-color: #f9fafb; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            
            <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              Beste ${userName},
            </p>
            
            <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              Geweldig nieuws! Uw bedrijfsaccount aanvraag voor <strong style="color: #FF8C00;">${companyName}</strong> is goedgekeurd en volledig geactiveerd.
            </p>

            <!-- Success Card -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #22c55e;">
              <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 18px;">
                ✅ Wat betekent dit?
              </h2>
              <ul style="color: #4b5563; margin: 0; padding-left: 20px; line-height: 2;">
                <li>Uw bedrijfsaccount is volledig geactiveerd</li>
                <li>U heeft toegang tot alle bedrijfsfuncties</li>
                <li>U kunt medewerkers uitnodigen voor uw organisatie</li>
                <li>U kunt professionele recepturen beheren</li>
              </ul>
            </div>

            <!-- Features Card -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 18px; border-bottom: 2px solid #FF8C00; padding-bottom: 10px;">
                🚀 Beschikbare Functies
              </h2>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                    <strong style="color: #1f2937;">👥 Teambeheer</strong>
                    <p style="color: #6b7280; margin: 4px 0 0; font-size: 14px;">Nodig medewerkers uit en beheer uw team</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                    <strong style="color: #1f2937;">📖 Receptenbeheer</strong>
                    <p style="color: #6b7280; margin: 4px 0 0; font-size: 14px;">Maak en organiseer professionele recepturen</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                    <strong style="color: #1f2937;">🏷️ Categorieën</strong>
                    <p style="color: #6b7280; margin: 4px 0 0; font-size: 14px;">Organiseer recepten met aangepaste categorieën</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <strong style="color: #1f2937;">📊 Bedrijfsoverzicht</strong>
                    <p style="color: #6b7280; margin: 4px 0 0; font-size: 14px;">Volg uw receptgebruik en teamactiviteit</p>
                  </td>
                </tr>
              </table>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${loginUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #FF8C00 0%, #FF6B00 100%); color: white; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(255,140,0,0.4);">
                Inloggen op uw Account
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0; text-align: center;">
              Heeft u vragen? Neem gerust contact op met ons supportteam.
            </p>

          </div>
          
          <!-- Footer -->
          <div style="background-color: #1f2937; padding: 24px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="color: white; margin: 0 0 8px; font-size: 14px; font-weight: 500;">
              Welkom bij Gastro-Elite!
            </p>
            <p style="color: #9ca3af; margin: 0; font-size: 13px;">
              © ${new Date().getFullYear()} Gastro-Elite • Professioneel Receptenbeheer
            </p>
          </div>
        </div>
      `
    };

    await getTransporter().sendMail(mailOptions);
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
    const emailConfig = getEmailConfig();
    const registerUrl = `${getAppUrl()}/register`;
    
    const currentDate = new Date().toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: `"Gastro-Elite" <${emailConfig.auth.user}>`,
      to: userEmail,
      subject: `Bedrijfsaccount aanvraag - ${companyName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
              Bedrijfsaccount Aanvraag Update
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0; font-size: 14px;">
              ${currentDate}
            </p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px; background-color: #f9fafb; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            
            <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              Beste ${userName},
            </p>
            
            <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              Bedankt voor uw interesse in Gastro-Elite. Na zorgvuldige beoordeling van uw bedrijfsaccount aanvraag voor <strong style="color: #FF8C00;">${companyName}</strong>, kunnen wij uw aanvraag helaas op dit moment niet goedkeuren.
            </p>

            ${reason ? `
            <!-- Reason Card -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #ef4444;">
              <h2 style="color: #1f2937; margin: 0 0 12px; font-size: 16px;">
                📋 Reden voor afwijzing
              </h2>
              <p style="color: #4b5563; margin: 0; line-height: 1.6;">
                ${reason}
              </p>
            </div>
            ` : ''}

            <!-- Next Steps Card -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 18px; border-bottom: 2px solid #FF8C00; padding-bottom: 10px;">
                🔄 Volgende Stappen
              </h2>
              <ul style="color: #4b5563; margin: 0; padding-left: 20px; line-height: 2;">
                <li>Bekijk de feedback hierboven (indien gegeven)</li>
                <li>Corrigeer eventuele problemen met uw aanvraag</li>
                <li>Dien een nieuwe bedrijfsaccount aanvraag in</li>
                <li>Neem contact op met ons team bij vragen</li>
              </ul>
            </div>

            <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              Wij moedigen u aan om opnieuw een aanvraag in te dienen zodra u eventuele punten heeft aangepakt. Ons team staat klaar om u te helpen door het aanvraagproces.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${registerUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #FF8C00 0%, #FF6B00 100%); color: white; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(255,140,0,0.4);">
                Opnieuw Aanvragen
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0; text-align: center;">
              Heeft u vragen? Neem gerust contact op met ons supportteam.
            </p>

          </div>
          
          <!-- Footer -->
          <div style="background-color: #1f2937; padding: 24px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="color: #9ca3af; margin: 0; font-size: 13px;">
              Bedankt voor uw begrip. Wij kijken ernaar uit om in de toekomst met u samen te werken.
            </p>
            <p style="color: #6b7280; margin: 12px 0 0; font-size: 12px;">
              © ${new Date().getFullYear()} Gastro-Elite • Professioneel Receptenbeheer
            </p>
          </div>
        </div>
      `
    };

    await getTransporter().sendMail(mailOptions);
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
// Send password reset email
export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetToken: string
): Promise<boolean> {
  try {
    const emailConfig = getEmailConfig();
    const resetUrl = `${getAppUrl()}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"Gastro-Elite" <${emailConfig.auth.user}>`,
      to: userEmail,
      subject: '🔐 Wachtwoord Resetten - Gastro-Elite',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #FF8C00 0%, #FF6B00 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="font-size: 48px; margin-bottom: 16px;">🔐</div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
              Wachtwoord Resetten
            </h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px; background-color: #f9fafb; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            
            <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              Beste ${userName},
            </p>
            
            <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              We hebben een verzoek ontvangen om het wachtwoord van uw Gastro-Elite account te resetten.
            </p>

            <!-- Warning Card -->
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                ⚠️ <strong>Belangrijk:</strong> Deze link is 1 uur geldig. Als u geen wachtwoord reset heeft aangevraagd, kunt u deze e-mail negeren.
              </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #FF8C00 0%, #FF6B00 100%); color: white; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(255,140,0,0.4);">
                Wachtwoord Resetten
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0; text-align: center;">
              Of kopieer deze link naar uw browser:
            </p>
            <p style="color: #FF8C00; font-size: 12px; word-break: break-all; text-align: center; margin: 8px 0 0;">
              ${resetUrl}
            </p>

          </div>
          
          <!-- Footer -->
          <div style="background-color: #1f2937; padding: 24px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="color: #9ca3af; margin: 0; font-size: 13px;">
              Als u deze aanvraag niet heeft gedaan, kunt u deze e-mail veilig negeren.
            </p>
            <p style="color: #6b7280; margin: 12px 0 0; font-size: 12px;">
              © ${new Date().getFullYear()} Gastro-Elite • Professioneel Receptenbeheer
            </p>
          </div>
        </div>
      `
    };

    await getTransporter().sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', userEmail);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

// Send employee invitation to existing user
export async function sendEmployeeInvitationToExistingUser(
  employeeEmail: string,
  employeeName: string,
  companyName: string,
  companyOwnerName: string,
  invitationId: string,
  companyId: string,
  language: string = 'nl'
): Promise<boolean> {
  try {
    const emailConfig = getEmailConfig();
    const appUrl = getAppUrl();
    
    // Generate action tokens and URLs
    const acceptToken = generateActionToken(companyId, invitationId, 'accept');
    const declineToken = generateActionToken(companyId, invitationId, 'decline');
    const acceptUrl = `${appUrl}/api/employee-action?companyId=${companyId}&invitationId=${invitationId}&action=accept&token=${acceptToken}`;
    const declineUrl = `${appUrl}/api/employee-action?companyId=${companyId}&invitationId=${invitationId}&action=decline&token=${declineToken}`;
    
    const translations: Record<string, { subject: string; greeting: string; message: string; whatMeans: string; benefits: string[]; acceptButton: string; declineButton: string; footer: string }> = {
      nl: {
        subject: `${companyName} wil je in hun team!`,
        greeting: `Beste ${employeeName},`,
        message: `<strong>${companyOwnerName}</strong> van <strong style="color: #FF8C00;">${companyName}</strong> heeft je uitgenodigd om deel uit te maken van hun team op Gastro-Elite.`,
        whatMeans: 'Wat betekent dit?',
        benefits: [
          `Je krijgt toegang tot de recepten van ${companyName}`,
          'Je kunt samenwerken met je teamleden',
          'Je behoudt je persoonlijke account'
        ],
        acceptButton: '✅ Accepteren',
        declineButton: '❌ Afwijzen',
        footer: 'Klik op een van de knoppen hierboven om de uitnodiging te accepteren of af te wijzen.'
      },
      en: {
        subject: `${companyName} wants you in their team!`,
        greeting: `Dear ${employeeName},`,
        message: `<strong>${companyOwnerName}</strong> from <strong style="color: #FF8C00;">${companyName}</strong> has invited you to join their team on Gastro-Elite.`,
        whatMeans: 'What does this mean?',
        benefits: [
          `You'll get access to ${companyName}'s recipes`,
          'You can collaborate with your team members',
          'You keep your personal account'
        ],
        acceptButton: '✅ Accept',
        declineButton: '❌ Decline',
        footer: 'Click one of the buttons above to accept or decline the invitation.'
      }
    };

    const t = translations[language] || translations.nl;

    // Build HTML email with action buttons
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #FF8C00 0%, #FF6B00 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
            🎉 Team Uitnodiging
          </h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px; background-color: #f9fafb; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
          
          <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            ${t.greeting}
          </p>
          
          <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            ${t.message}
          </p>

          <!-- Info Card -->
          <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #FF8C00;">
            <h2 style="color: #1f2937; margin: 0 0 12px; font-size: 18px;">
              ${t.whatMeans}
            </h2>
            <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
              ${t.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
            </ul>
          </div>

          <!-- Action Buttons -->
          <div style="text-align: center; margin: 32px 0;">
            <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
              <a href="${acceptUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(34,197,94,0.4);">
                ${t.acceptButton}
              </a>
              <a href="${declineUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(239,68,68,0.4);">
                ${t.declineButton}
              </a>
            </div>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0; text-align: center;">
            ${t.footer}
          </p>

        </div>
        
        <!-- Footer -->
        <div style="background-color: #1f2937; padding: 24px; text-align: center; border-radius: 0 0 8px 8px;">
          <p style="color: #9ca3af; margin: 0; font-size: 13px;">
            © ${new Date().getFullYear()} Gastro-Elite • Professioneel Receptenbeheer
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Gastro-Elite" <${emailConfig.auth.user}>`,
      to: employeeEmail,
      subject: t.subject,
      html: emailHtml
    };

    await getTransporter().sendMail(mailOptions);
    console.log('✅ Employee invitation email sent to existing user:', employeeEmail);
    return true;
  } catch (error) {
    console.error('Error sending employee invitation email:', error);
    return false;
  }
}

// Send employee invitation to new user (registration invitation)
export async function sendEmployeeInvitationToNewUser(
  employeeEmail: string,
  companyName: string,
  companyOwnerName: string,
  invitationId: string,
  language: string = 'nl'
): Promise<boolean> {
  try {
    const emailConfig = getEmailConfig();
    const appUrl = getAppUrl();
    const registerUrl = `${appUrl}/register`;
    
    const translations: Record<string, { subject: string; greeting: string; message: string; whatGet: string; benefits: string[]; cta: string; footer: string }> = {
      nl: {
        subject: `Registreer en word lid van het team van ${companyName}!`,
        greeting: `Beste toekomstige collega,`,
        message: `<strong>${companyOwnerName}</strong> van <strong style="color: #FF8C00;">${companyName}</strong> heeft je uitgenodigd om deel uit te maken van hun team op Gastro-Elite.`,
        whatGet: 'Wat krijg je?',
        benefits: [
          `Toegang tot alle recepten van ${companyName}`,
          'Samenwerken met je teamleden',
          'Gratis persoonlijk account',
          'Professioneel receptenbeheer'
        ],
        cta: 'Account Aanmaken',
        footer: 'Maak een gratis account aan om de uitnodiging te accepteren en direct te beginnen.'
      },
      en: {
        subject: `Register and join ${companyName}'s team!`,
        greeting: `Dear future colleague,`,
        message: `<strong>${companyOwnerName}</strong> from <strong style="color: #FF8C00;">${companyName}</strong> has invited you to join their team on Gastro-Elite.`,
        whatGet: 'What do you get?',
        benefits: [
          `Access to all recipes from ${companyName}`,
          'Collaborate with your team members',
          'Free personal account',
          'Professional recipe management'
        ],
        cta: 'Create Account',
        footer: 'Create a free account to accept the invitation and get started right away.'
      }
    };

    const t = translations[language] || translations.nl;

    const mailOptions = {
      from: `"Gastro-Elite" <${emailConfig.auth.user}>`,
      to: employeeEmail,
      subject: t.subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #FF8C00 0%, #FF6B00 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
              🚀 Word Lid van Ons Team!
            </h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px; background-color: #f9fafb; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            
            <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              ${t.greeting}
            </p>
            
            <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              ${t.message}
            </p>

            <!-- Benefits Card -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #FF8C00;">
              <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 18px;">
                ${t.whatGet}
              </h2>
              <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                ${t.benefits.map(benefit => `<li>✓ ${benefit}</li>`).join('')}
              </ul>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${registerUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #FF8C00 0%, #FF6B00 100%); color: white; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(255,140,0,0.4);">
                ${t.cta}
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0; text-align: center;">
              ${t.footer}
            </p>

          </div>
          
          <!-- Footer -->
          <div style="background-color: #1f2937; padding: 24px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="color: #9ca3af; margin: 0; font-size: 13px;">
              © ${new Date().getFullYear()} Gastro-Elite • Professioneel Receptenbeheer
            </p>
          </div>
        </div>
      `
    };

    await getTransporter().sendMail(mailOptions);
    console.log('✅ Employee registration invitation email sent to:', employeeEmail);
    return true;
  } catch (error) {
    console.error('Error sending employee registration invitation email:', error);
    return false;
  }
}

export async function testEmailConfiguration(): Promise<boolean> {
  try {
    const emailConfig = getEmailConfig();
    console.log('Testing email configuration...');
    console.log('SMTP_HOST:', emailConfig.host);
    console.log('SMTP_PORT:', emailConfig.port);
    console.log('SMTP_USER:', emailConfig.auth.user);
    console.log('SMTP_PASS:', emailConfig.auth.pass ? 'SET' : 'NOT SET');
    
    await getTransporter().verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    console.error('Error code:', (error as any).code);
    console.error('Error message:', (error as any).message);
    console.error('Error response:', (error as any).response);
    return false;
  }
}
