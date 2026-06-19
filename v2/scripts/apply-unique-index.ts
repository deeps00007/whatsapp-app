import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:Growbychat2024!@db.nmkwmknvxigahuafdwvz.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    // Create unique index
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS uq_contacts_user_phone ON contacts (user_id, phone)');
    console.log('Unique index created successfully');

    // Verify
    const { rows } = await client.query("SELECT indexname FROM pg_indexes WHERE tablename='contacts' AND indexname='uq_contacts_user_phone'");
    console.log('Index exists:', rows.length > 0);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => console.error(e));
