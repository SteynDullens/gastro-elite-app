const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabaseData() {
  try {
    console.log('🔍 Checking database data...\n');

    // Check users (including soft deleted)
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        isBlocked: true,
        emailVerified: true,
        deletedAt: true,
        createdAt: true
      }
    });

    const activeUsers = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true
      }
    });

    console.log(`👥 Users:`);
    console.log(`   Total: ${allUsers.length}`);
    console.log(`   Active (not deleted): ${activeUsers.length}`);
    console.log(`   Soft deleted: ${allUsers.length - activeUsers.length}`);
    
    if (allUsers.length > 0) {
      console.log('\n   All users:');
      allUsers.forEach(u => {
        const deleted = u.deletedAt ? ' [DELETED]' : '';
        const admin = u.isAdmin ? ' [ADMIN]' : '';
        console.log(`   - ${u.email} (${u.firstName} ${u.lastName})${admin}${deleted}`);
      });
    }

    // Check companies
    const allCompanies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        deletedAt: true
      }
    });

    const activeCompanies = await prisma.company.findMany({
      where: { deletedAt: null }
    });

    console.log(`\n🏢 Companies:`);
    console.log(`   Total: ${allCompanies.length}`);
    console.log(`   Active: ${activeCompanies.length}`);
    console.log(`   Soft deleted: ${allCompanies.length - activeCompanies.length}`);

    // Check recipes
    const allPersonalRecipes = await prisma.personalRecipe.findMany({
      select: {
        id: true,
        name: true,
        deletedAt: true
      }
    });

    const activePersonalRecipes = await prisma.personalRecipe.findMany({
      where: { deletedAt: null }
    });

    const allCompanyRecipes = await prisma.companyRecipe.findMany({
      select: {
        id: true,
        name: true,
        deletedAt: true
      }
    });

    const activeCompanyRecipes = await prisma.companyRecipe.findMany({
      where: { deletedAt: null }
    });

    console.log(`\n📝 Recipes:`);
    console.log(`   Personal - Total: ${allPersonalRecipes.length}, Active: ${activePersonalRecipes.length}`);
    console.log(`   Company - Total: ${allCompanyRecipes.length}, Active: ${activeCompanyRecipes.length}`);

    // Check audit logs
    const auditLogs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n📋 Audit Logs:`);
    console.log(`   Total: ${await prisma.auditLog.count()}`);
    if (auditLogs.length > 0) {
      console.log('   Recent logs:');
      auditLogs.forEach(log => {
        console.log(`   - ${log.action} on ${log.entityType} by ${log.userEmail || 'System'}`);
      });
    }

    console.log('\n✅ Database check complete!');

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseData();

