import { safeDbOperation } from '@/lib/prisma';
import { sendEmployeeJoinedTeamEmailToOwner } from '@/lib/email';

export type EmployeeJoinedPayload = {
  companyId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

/**
 * Bedrijfseigenaar informeren als een uitgenodigde medewerker het team joint
 * (mail-link accepteren of registratie na uitnodiging).
 */
export async function notifyOwnerEmployeeJoinedTeam(
  payload: EmployeeJoinedPayload
): Promise<void> {
  await safeDbOperation(async (prisma) => {
    const company = await prisma.company.findUnique({
      where: { id: payload.companyId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!company?.owner?.email) {
      console.warn('notifyOwnerEmployeeJoinedTeam: geen eigenaar gevonden voor company', payload.companyId);
      return;
    }

    if (company.owner.id === payload.employee.id) {
      console.warn('notifyOwnerEmployeeJoinedTeam: zelfde gebruiker als eigenaar — overslaan');
      return;
    }

    const employeeName =
      `${payload.employee.firstName} ${payload.employee.lastName}`.trim() ||
      payload.employee.email;

    const title = 'Nieuw teamlid';
    const body = `${employeeName} (${payload.employee.email}) is toegevoegd aan het team van ${company.name}.`;

    await prisma.appNotification.create({
      data: {
        userId: company.owner.id,
        type: 'employee_joined_team',
        title,
        body,
        metadata: {
          companyId: payload.companyId,
          employeeUserId: payload.employee.id,
        },
      },
    });

    try {
      await sendEmployeeJoinedTeamEmailToOwner({
        toEmail: company.owner.email,
        ownerFirstName: company.owner.firstName,
        companyName: company.name,
        employeeName,
        employeeEmail: payload.employee.email,
      });
    } catch (e) {
      console.error('notifyOwnerEmployeeJoinedTeam: e-mail naar eigenaar mislukt', e);
    }
  });
}
