import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';
import { sendBusinessApprovalNotification, sendBusinessRejectionNotification } from '@/lib/email';
import crypto from 'crypto';

// Verify action token (simple HMAC-based verification)
function verifyActionToken(companyId: string, action: string, token: string): boolean {
  const secret = process.env.JWT_SECRET || process.env.DWT_SECRET || 'gastro-elite-secret';
  const expectedToken = crypto
    .createHmac('sha256', secret)
    .update(`${companyId}:${action}`)
    .digest('hex')
    .substring(0, 32);
  return token === expectedToken;
}

// Generate action token
export function generateActionToken(companyId: string, action: string): string {
  const secret = process.env.JWT_SECRET || process.env.DWT_SECRET || 'gastro-elite-secret';
  return crypto
    .createHmac('sha256', secret)
    .update(`${companyId}:${action}`)
    .digest('hex')
    .substring(0, 32);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const action = searchParams.get('action');
    const token = searchParams.get('token');

    if (!companyId || !action || !token) {
      return new NextResponse(renderErrorPage('Ongeldige link. Controleer of u de volledige link heeft gebruikt.'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (!['approve', 'reject'].includes(action)) {
      return new NextResponse(renderErrorPage('Ongeldige actie opgegeven.'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Verify token
    if (!verifyActionToken(companyId, action, token)) {
      return new NextResponse(renderErrorPage('Ongeldige of verlopen verificatielink.'), {
        status: 401,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Get company info
    const company = await safeDbOperation(async (prisma) => {
      return await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          owner: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              emailVerified: true
            }
          }
        }
      });
    });

    if (!company) {
      return new NextResponse(renderErrorPage('Bedrijf niet gevonden.'), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Check if already processed
    if (company.status !== 'pending') {
      return new NextResponse(renderAlreadyProcessedPage(company.name, company.status), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Check if email is verified (only for approval)
    if (action === 'approve' && !company.owner.emailVerified) {
      return new NextResponse(renderErrorPage(
        `Kan ${company.name} niet goedkeuren. De eigenaar heeft het e-mailadres nog niet geverifieerd.`
      ), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // If rejecting, show confirmation form
    if (action === 'reject') {
      return new NextResponse(renderRejectConfirmPage(company.name, companyId, token), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Process approval
    const isApproved = action === 'approve';
    await safeDbOperation(async (prisma) => {
      return await prisma.company.update({
        where: { id: companyId },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: 'email-action'
        }
      });
    });

    // Send notification email
    const userName = `${company.owner.firstName} ${company.owner.lastName}`;
    try {
      await sendBusinessApprovalNotification(company.owner.email, company.name, userName);
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
    }

    return new NextResponse(renderSuccessPage(company.name, 'approved'), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error) {
    console.error('Email action error:', error);
    return new NextResponse(renderErrorPage('Er is een fout opgetreden. Probeer het later opnieuw.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

// Handle rejection with reason
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const companyId = formData.get('companyId') as string;
    const token = formData.get('token') as string;
    const reason = formData.get('reason') as string;

    if (!companyId || !token) {
      return new NextResponse(renderErrorPage('Ongeldige aanvraag.'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Verify token
    if (!verifyActionToken(companyId, 'reject', token)) {
      return new NextResponse(renderErrorPage('Ongeldige of verlopen verificatielink.'), {
        status: 401,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Get company info
    const company = await safeDbOperation(async (prisma) => {
      return await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          owner: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
    });

    if (!company) {
      return new NextResponse(renderErrorPage('Bedrijf niet gevonden.'), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (company.status !== 'pending') {
      return new NextResponse(renderAlreadyProcessedPage(company.name, company.status), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Process rejection
    await safeDbOperation(async (prisma) => {
      return await prisma.company.update({
        where: { id: companyId },
        data: {
          status: 'rejected',
          rejectionReason: reason || null,
          approvedAt: new Date(),
          approvedBy: 'email-action'
        }
      });
    });

    // Send rejection email
    const userName = `${company.owner.firstName} ${company.owner.lastName}`;
    try {
      await sendBusinessRejectionNotification(company.owner.email, company.name, userName, reason);
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
    }

    return new NextResponse(renderSuccessPage(company.name, 'rejected'), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error) {
    console.error('Email action error:', error);
    return new NextResponse(renderErrorPage('Er is een fout opgetreden. Probeer het later opnieuw.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

// HTML page renderers
function renderSuccessPage(companyName: string, status: string): string {
  const statusText = status === 'approved' ? 'goedgekeurd' : 'afgewezen';
  const statusColor = status === 'approved' ? '#22c55e' : '#ef4444';
  const statusIcon = status === 'approved' ? '✓' : '✗';
  
  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aanvraag ${statusText} - Gastro-Elite</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; padding: 20px; }
    .container { background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); padding: 40px; max-width: 500px; text-align: center; }
    .icon { width: 80px; height: 80px; border-radius: 50%; background: ${statusColor}; color: white; font-size: 40px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
    h1 { color: #1f2937; margin: 0 0 16px; font-size: 24px; }
    p { color: #6b7280; margin: 0 0 24px; line-height: 1.6; }
    .company { font-weight: 600; color: #FF8C00; }
    .btn { display: inline-block; background: #FF8C00; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; }
    .btn:hover { background: #e67e00; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${statusIcon}</div>
    <h1>Aanvraag ${statusText}</h1>
    <p>De bedrijfsaccount aanvraag van <span class="company">${companyName}</span> is succesvol ${statusText}.</p>
    <p>De aanvrager heeft een e-mail ontvangen met deze beslissing.</p>
    <a href="${getAppUrl()}/admin/business-applications" class="btn">Naar Admin Panel</a>
  </div>
</body>
</html>`;
}

function renderErrorPage(message: string): string {
  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fout - Gastro-Elite</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; padding: 20px; }
    .container { background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); padding: 40px; max-width: 500px; text-align: center; }
    .icon { width: 80px; height: 80px; border-radius: 50%; background: #ef4444; color: white; font-size: 40px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
    h1 { color: #1f2937; margin: 0 0 16px; font-size: 24px; }
    p { color: #6b7280; margin: 0 0 24px; line-height: 1.6; }
    .btn { display: inline-block; background: #FF8C00; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">!</div>
    <h1>Er is een fout opgetreden</h1>
    <p>${message}</p>
    <a href="${getAppUrl()}/admin/business-applications" class="btn">Naar Admin Panel</a>
  </div>
</body>
</html>`;
}

function renderAlreadyProcessedPage(companyName: string, status: string): string {
  const statusText = status === 'approved' ? 'goedgekeurd' : 'afgewezen';
  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reeds verwerkt - Gastro-Elite</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #fef3c7 0%, #ffffff 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; padding: 20px; }
    .container { background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); padding: 40px; max-width: 500px; text-align: center; }
    .icon { width: 80px; height: 80px; border-radius: 50%; background: #f59e0b; color: white; font-size: 40px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
    h1 { color: #1f2937; margin: 0 0 16px; font-size: 24px; }
    p { color: #6b7280; margin: 0 0 24px; line-height: 1.6; }
    .company { font-weight: 600; color: #FF8C00; }
    .btn { display: inline-block; background: #FF8C00; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">ℹ</div>
    <h1>Reeds verwerkt</h1>
    <p>De aanvraag van <span class="company">${companyName}</span> is al eerder ${statusText}.</p>
    <a href="${getAppUrl()}/admin/business-applications" class="btn">Naar Admin Panel</a>
  </div>
</body>
</html>`;
}

function renderRejectConfirmPage(companyName: string, companyId: string, token: string): string {
  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aanvraag afwijzen - Gastro-Elite</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; padding: 20px; }
    .container { background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); padding: 40px; max-width: 500px; }
    h1 { color: #1f2937; margin: 0 0 8px; font-size: 24px; text-align: center; }
    .subtitle { color: #6b7280; margin: 0 0 24px; text-align: center; }
    .company { font-weight: 600; color: #FF8C00; }
    label { display: block; font-weight: 500; color: #374151; margin-bottom: 8px; }
    textarea { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; resize: vertical; min-height: 100px; box-sizing: border-box; }
    textarea:focus { outline: none; border-color: #FF8C00; box-shadow: 0 0 0 3px rgba(255,140,0,0.1); }
    .buttons { display: flex; gap: 12px; margin-top: 24px; }
    .btn { flex: 1; padding: 12px 24px; border-radius: 8px; font-weight: 500; cursor: pointer; border: none; font-size: 14px; }
    .btn-cancel { background: #e5e7eb; color: #374151; text-decoration: none; text-align: center; }
    .btn-cancel:hover { background: #d1d5db; }
    .btn-reject { background: #ef4444; color: white; }
    .btn-reject:hover { background: #dc2626; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Aanvraag afwijzen</h1>
    <p class="subtitle">U staat op het punt de aanvraag van <span class="company">${companyName}</span> af te wijzen.</p>
    
    <form method="POST" action="${getAppUrl()}/api/admin/email-action">
      <input type="hidden" name="companyId" value="${companyId}">
      <input type="hidden" name="token" value="${token}">
      
      <label for="reason">Reden voor afwijzing (optioneel):</label>
      <textarea name="reason" id="reason" placeholder="Voer hier een eventuele reden in die naar de aanvrager wordt gestuurd..."></textarea>
      
      <div class="buttons">
        <a href="${getAppUrl()}/admin/business-applications" class="btn btn-cancel">Annuleren</a>
        <button type="submit" class="btn btn-reject">Afwijzen</button>
      </div>
    </form>
  </div>
</body>
</html>`;
}

function getAppUrl(): string {
  return (process.env.APP_URL || 'https://gastro-elite-app.vercel.app').replace(/\/$/, '');
}

