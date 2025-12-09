// Script to baseline existing migrations for production database
// This marks existing migrations as applied without running them
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
const migrations = fs.readdirSync(migrationsDir)
  .filter(dir => fs.statSync(path.join(migrationsDir, dir)).isDirectory())
  .filter(dir => dir !== 'node_modules')
  .sort();

console.log('📋 Found migrations:', migrations);

// Mark each migration as applied
migrations.forEach(migration => {
  try {
    console.log(`✅ Marking migration as applied: ${migration}`);
    execSync(`npx prisma migrate resolve --applied ${migration}`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
  } catch (error) {
    // If migration is already marked, that's okay
    if (error.message.includes('already applied') || error.message.includes('P3008')) {
      console.log(`ℹ️  Migration ${migration} already marked as applied`);
    } else {
      console.error(`❌ Error marking ${migration}:`, error.message);
    }
  }
});

console.log('✅ Migration baseline complete');

