// Script to baseline existing migrations for production database
// This marks existing migrations as applied without running them
const { execSync } = require('child_process');

console.log('📋 Baselines existing migrations...');

// List of migrations that should already be applied in production
const existingMigrations = [
  '20251006152520_init',
  '20251021170525_add_email_verification_token'
];

existingMigrations.forEach(migration => {
  try {
    console.log(`✅ Marking migration as applied: ${migration}`);
    execSync(`npx prisma migrate resolve --applied ${migration}`, {
      stdio: 'inherit',
      env: { ...process.env }
    });
  } catch (error) {
    // If migration is already marked or doesn't exist, that's okay
    const errorMsg = error.message || error.toString();
    if (errorMsg.includes('already applied') || 
        errorMsg.includes('P3008') || 
        errorMsg.includes('not found')) {
      console.log(`ℹ️  Migration ${migration} already handled`);
    } else {
      console.log(`⚠️  Could not mark ${migration} as applied: ${errorMsg}`);
    }
  }
});

console.log('✅ Migration baseline complete');

