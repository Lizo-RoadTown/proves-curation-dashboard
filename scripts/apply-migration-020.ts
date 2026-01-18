/**
 * Apply Migration 020: User Attachments
 *
 * Run from curation_dashboard directory:
 *   npx tsx scripts/apply-migration-020.ts
 */

import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database URL
const DATABASE_URL = 'postgresql://postgres.guigtpwxlqwueylbbcpx:g%252QHd3qRT%258GK%40@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

async function applyMigration() {
  console.log('====================================');
  console.log('  Migration 020: User Attachments');
  console.log('====================================\n');

  // Read migration file
  const migrationPath = path.join(__dirname, '../../supabase/migrations/020_user_attachments.sql');

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

    const tableCheck = await client.query(`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'user_attachments'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('⚠️  user_attachments table already exists');
      console.log('   Skipping migration to avoid errors.\n');

      // Still verify the structure
      await verifyMigration(client);
      return;
    }

    // Apply migration
    console.log('🚀 Applying migration...\n');
    await client.query(migrationSQL);
    console.log('✅ Migration applied successfully!\n');

    // Verify
    await verifyMigration(client);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function verifyMigration(client: pg.Client) {
  console.log('🔍 Verifying migration...\n');

  // Check user_attachments table
  const attachmentsCheck = await client.query(`
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_attachments'
  `);
  console.log(`   user_attachments table: ${attachmentsCheck.rows[0].count > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);

  // Check user_oauth_tokens table
  const tokensCheck = await client.query(`
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_oauth_tokens'
  `);
  console.log(`   user_oauth_tokens table: ${tokensCheck.rows[0].count > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);

  // Check enums
  const providerEnumCheck = await client.query(`
    SELECT COUNT(*) FROM pg_type WHERE typname = 'attachment_provider'
  `);
  console.log(`   attachment_provider enum: ${providerEnumCheck.rows[0].count > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);

  const resourceEnumCheck = await client.query(`
    SELECT COUNT(*) FROM pg_type WHERE typname = 'attachment_resource_type'
  `);
  console.log(`   attachment_resource_type enum: ${resourceEnumCheck.rows[0].count > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);

  // Check functions
  const attachFuncCheck = await client.query(`
    SELECT COUNT(*) FROM pg_proc WHERE proname = 'attach_resource'
  `);
  console.log(`   attach_resource function: ${attachFuncCheck.rows[0].count > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);

  const detachFuncCheck = await client.query(`
    SELECT COUNT(*) FROM pg_proc WHERE proname = 'detach_resource'
  `);
  console.log(`   detach_resource function: ${detachFuncCheck.rows[0].count > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);

  // Check RLS policies
  const rlsCheck = await client.query(`
    SELECT COUNT(*) FROM pg_policies
    WHERE tablename = 'user_attachments'
  `);
  console.log(`   RLS policies on user_attachments: ${rlsCheck.rows[0].count} policies`);

  console.log('\n====================================');
  console.log('  Migration Complete!');
  console.log('====================================\n');
}

applyMigration().catch(console.error);
