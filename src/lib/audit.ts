import { getPrisma } from './prisma';

export interface AuditLogData {
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  userEmail?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    const prisma = getPrisma();
    if (!prisma) {
      console.warn('⚠️ Prisma not available, skipping audit log');
      return;
    }

    await prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        userId: data.userId,
        userEmail: data.userEmail,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      }
    });
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    console.error('❌ Failed to log audit event:', error);
  }
}

export async function getAuditLogs(filters?: {
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const prisma = getPrisma();
    if (!prisma) {
      return [];
    }

    const where: any = {};
    if (filters?.action) where.action = filters.action;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.entityId) where.entityId = filters.entityId;
    if (filters?.userId) where.userId = filters.userId;

    return await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
      skip: filters?.offset || 0
    });
  } catch (error) {
    console.error('❌ Failed to get audit logs:', error);
    return [];
  }
}

