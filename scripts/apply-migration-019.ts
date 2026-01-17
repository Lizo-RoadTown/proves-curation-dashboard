/**
 * Apply Migration 019: Enhanced Human Review System
 *
 * Run from curation_dashboard directory:
 *   npx tsx scripts/apply-migration-019.ts
 */

import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database URL with URL-decoded password
// Original: g%252QHd3qRT%258GK%40 -> decoded: g%2QHd3qRT%8GK@
const DATABASE_URL = 'postgresql://postgres.guigtpwxlqwueylbbcpx:g%252QHd3qRT%258GK%40@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

async function applyMigration() {
  console.log('====================================');
  console.log('  Migration 019: Enhanced Human Review');
  console.log('====================================\n');

  // Read migration file
  const migrationPath = path.join(__dirname, '../../supabase/migrations/019_enhanced_human_review.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  console.log(`📄 Read migration file (${migrationSQL.length} bytes)\n`);

  // Connect using pg
  console.log('🔗 Connecting to database...\n');

  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if migration was already applied
    console.log('🔍 Checking if migration was already applied...\n');

    try {
      const typeCheck = await client.query(`
        SELECT 1 FROM pg_type WHERE typname = 'rejection_category'
      `);
      if (typeCheck.rows.length > 0) {
        console.log('⚠️  rejection_category type already exists');
      }
    } catch (e) {
      // Type doesn't exist, which is expected
    }

    // Apply migration
    console.log('🚀 Applying migration...\n');

    await client.query(migrationSQL);

    console.log('✅ Migration applied successfully!\n');

    // Verify
    console.log('🔍 Verifying migration...\n');

    // Check view
    const viewCheck = await client.query(`
      SELECT COUNT(*) FROM information_schema.views
      WHERE table_schema = 'public' AND table_name = 'review_queue_view'
    `);
    console.log(`   review_queue_view: ${viewCheck.rows[0].count > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);

    // Check table
    const tableCheck = await client.query(`
      SELECT COUNT(*) FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'validation_edits'
    `);
    console.log(`   validation_edits table: ${tableCheck.rows[0].count > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);

    // Check function
    const funcCheck = await client.query(`
      SELECT COUNT(*) FROM pg_proc
      WHERE proname = 'record_review_decision'
    `);
    console.log(`   record_review_decision function: ${funcCheck.rows[0].count > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);

    // Check enum
    const enumCheck = await client.query(`
      SELECT COUNT(*) FROM pg_type WHERE typname = 'rejection_category'
    `);
    console.log(`   rejection_category enum: ${enumCheck.rows[0].count > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);

    console.log('\n====================================');
    console.log('  Migration Complete!');
    console.log('====================================\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

applyMigration().catch(console.error);
