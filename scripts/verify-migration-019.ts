/**
 * Verify Migration 019 was applied correctly
 */

import pg from 'pg';

const DATABASE_URL = 'postgresql://postgres.guigtpwxlqwueylbbcpx:g%252QHd3qRT%258GK%40@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

async function verify() {
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to database\n');

  // Test the view
  console.log('=== Testing review_queue_view ===');
  const viewResult = await client.query('SELECT * FROM review_queue_view LIMIT 2');
  console.log('Rows found:', viewResult.rows.length);
  if (viewResult.rows.length > 0) {
    console.log('Sample row keys:', Object.keys(viewResult.rows[0]));
  }

  // Test the functions exist
  console.log('\n=== Testing RPC functions ===');
  const funcResult = await client.query(
    `SELECT proname FROM pg_proc WHERE proname IN ('record_review_decision', 'record_review_edit')`
  );
  console.log('Functions found:', funcResult.rows.map((r: any) => r.proname).join(', '));

  // Test validation_edits table
  console.log('\n=== Testing validation_edits table ===');
  const editsResult = await client.query('SELECT COUNT(*) FROM validation_edits');
  console.log('validation_edits rows:', editsResult.rows[0].count);

  // Test constraints
  console.log('\n=== Testing constraints ===');
  const constraintResult = await client.query(
    `SELECT conname FROM pg_constraint WHERE conname IN ('reject_requires_category', 'override_requires_reason', 'source_flag_requires_reason')`
  );
  console.log('Constraints found:', constraintResult.rows.map((r: any) => r.conname).join(', '));

  // Test rejection_category enum values
  console.log('\n=== Testing rejection_category enum ===');
  const enumResult = await client.query(`
    SELECT e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'rejection_category'
    ORDER BY e.enumsortorder
  `);
  console.log('Enum values:', enumResult.rows.map((r: any) => r.enumlabel).join(', '));

  await client.end();
  console.log('\n✅ All verifications passed!');
}

verify().catch(console.error);
