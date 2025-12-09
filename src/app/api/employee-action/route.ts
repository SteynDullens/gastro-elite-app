import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';
import crypto from 'crypto';

// Verify action token
function verifyActionToken(companyId: string, invitationId: string, action: string, token: string): boolean {
  const secret = process.env.JWT_SECRET || process.env.DWT_SECRET || 'gastro-elite-secret';
  const expectedToken = crypto
    .createHmac('sha256', secret)
    .update(`${companyId}:${invitationId}:${action}`)
    .digest('hex')
    .substring(0, 32);
  return token === expectedToken;
}

function getAppUrl(): string {
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const invitationId = searchParams.get('invitationId');
    const action = searchParams.get('action');
    const token = searchParams.get('token');

    if (!companyId || !invitationId || !action || !token) {
      return new NextResponse(renderErrorPage('Ongeldige link. Controleer of u de volledige link heeft gebruikt.'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (!['accept', 'decline'].includes(action)) {
      return new NextResponse(renderErrorPage('Ongeldige actie opgegeven.'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Verify token
    if (!verifyActionToken(companyId, invitationId, action, token)) {
      return new NextResponse(renderErrorPage('Ongeldige of verlopen verificatielink.'), {
        status: 401,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Get invitation info
    const invitation = await safeDbOperation(async (prisma) => {
      return await prisma.employeeInvitation.findUnique({
        where: { id: invitationId },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          },
          invitedUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              companyId: true
            }
          }
        }
      });
    });

    if (!invitation) {
      return new NextResponse(renderErrorPage('Uitnodiging niet gevonden.'), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (invitation.companyId !== companyId) {
      return new NextResponse(renderErrorPage('Uitnodiging behoort niet tot dit bedrijf.'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Check if already processed
    if (invitation.status !== 'pending') {
      const statusText = invitation.status === 'accepted' ? 'geaccepteerd' : 'afgewezen';
      return new NextResponse(renderAlreadyProcessedPage(invitation.company.name, statusText), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Process action
    if (action === 'accept') {
      // Only process if user exists (for existing users)
      if (!invitation.invitedUserId) {
        return new NextResponse(renderErrorPage('Deze uitnodiging is voor een nieuwe gebruiker. Maak eerst een account aan.'), {
          status: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      // Store in variable to ensure TypeScript knows it's not null
      const invitedUserId = invitation.invitedUserId;

      // Check if user is already linked to another company
      if (invitation.invitedUser && invitation.invitedUser.companyId && invitation.invitedUser.companyId !== companyId) {
        return new NextResponse(renderErrorPage('Je bent al gekoppeld aan een ander bedrijf.'), {
          status: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      // Link user to company and update invitation status
      await safeDbOperation(async (prisma) => {
        await prisma.user.update({
          where: { id: invitedUserId },
          data: { companyId: companyId }
        });

        await prisma.employeeInvitation.update({
          where: { id: invitationId },
          data: {
            status: 'accepted',
            invitedUserId: invitedUserId
          }
        });
      });

      return new NextResponse(renderSuccessPage(invitation.company.name, 'accepted'), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    } else {
      // Decline action
      await safeDbOperation(async (prisma) => {
        await prisma.employeeInvitation.update({
          where: { id: invitationId },
          data: {
            status: 'rejected'
          }
        });
      });

      return new NextResponse(renderSuccessPage(invitation.company.name, 'declined'), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

  } catch (error: any) {
    console.error('Employee action error:', error);
    return new NextResponse(renderErrorPage('Er is een fout opgetreden. Probeer het later opnieuw.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

// HTML page renderers
function renderSuccessPage(companyName: string, action: string): string {
  const actionText = action === 'accepted' ? 'geaccepteerd' : 'afgewezen';
  const actionColor = action === 'accepted' ? '#22c55e' : '#ef4444';
  const actionIcon = action === 'accepted' ? '✓' : '✗';
  const message = action === 'accepted' 
    ? `Je bent nu lid van het team van ${companyName}! Je kunt nu inloggen om toegang te krijgen tot de recepten.`
    : `Je hebt de uitnodiging van ${companyName} afgewezen.`;
  
  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Uitnodiging ${actionText} - Gastro-Elite</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; padding: 20px; }
    .container { background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); padding: 40px; max-width: 500px; text-align: center; }
    .icon { width: 80px; height: 80px; border-radius: 50%; background: ${actionColor}; color: white; font-size: 40px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
    h1 { color: #1f2937; margin: 0 0 16px; font-size: 24px; }
    p { color: #6b7280; margin: 0 0 24px; line-height: 1.6; }
    .company { font-weight: 600; color: #FF8C00; }
    .btn { display: inline-block; background: #FF8C00; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; }
    .btn:hover { background: #e67e00; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${actionIcon}</div>
    <h1>Uitnodiging ${actionText}</h1>
    <p>${message}</p>
    ${action === 'accepted' ? `<a href="${getAppUrl()}/login" class="btn">Naar Inloggen</a>` : ''}
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
    <a href="${getAppUrl()}/login" class="btn">Naar Inloggen</a>
  </div>
</body>
</html>`;
}

function renderAlreadyProcessedPage(companyName: string, statusText: string): string {
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
    <p>De uitnodiging van <span class="company">${companyName}</span> is al eerder ${statusText}.</p>
    <a href="${getAppUrl()}/login" class="btn">Naar Inloggen</a>
  </div>
</body>
</html>`;
}

