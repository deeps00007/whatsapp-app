import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:Growbychat2024!@db.nmkwmknvxigahuafdwvz.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    // Find contacts where coexistence mode is active and no agent/bot messages exist
    // These are personal/friend contacts that should not be in the CRM
    const { rows: coexistenceConfig } = await client.query(
      "SELECT user_id FROM whatsapp_config WHERE coexistence_mode = true"
    );

    if (coexistenceConfig.length === 0) {
      console.log('No coexistence mode configs found');
      return;
    }

    const userId = coexistenceConfig[0].user_id;
    console.log('Coexistence user:', userId);

    // Find contacts with no agent/bot messages (personal contacts)
    const { rows: personalContacts } = await client.query(`
      SELECT c.id, c.phone, c.name
      FROM contacts c
      LEFT JOIN conversations conv ON conv.contact_id = c.id AND conv.user_id = c.user_id
      LEFT JOIN messages m ON m.conversation_id = conv.id AND m.sender_type IN ('agent', 'bot')
      WHERE c.user_id = $1
      AND m.id IS NULL
      AND conv.id IS NOT NULL
    `, [userId]);

    console.log(`Found ${personalContacts.length} personal contacts (no CRM messages):`);
    for (const c of personalContacts) {
      console.log(`  - ${c.name} (${c.phone})`);
    }

    // Delete conversations and contacts for these personal contacts
    for (const c of personalContacts) {
      // Delete messages first (cascade)
      const { rowCount: msgCount } = await client.query(
        `DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE contact_id = $1)`,
        [c.id]
      );
      // Delete conversation
      const { rowCount: convCount } = await client.query(
        `DELETE FROM conversations WHERE contact_id = $1`,
        [c.id]
      );
      // Delete contact_tags
      await client.query(`DELETE FROM contact_tags WHERE contact_id = $1`, [c.id]);
      // Delete contact
      await client.query(`DELETE FROM contacts WHERE id = $1`, [c.id]);
      console.log(`  Deleted: ${c.name} (${msgCount} messages, ${convCount} conversations)`);
    }

    // Also find contacts with NO conversations at all (orphaned)
    const { rows: orphanContacts } = await client.query(`
      SELECT c.id, c.phone, c.name
      FROM contacts c
      LEFT JOIN conversations conv ON conv.contact_id = c.id
      WHERE c.user_id = $1
      AND conv.id IS NULL
    `, [userId]);

    console.log(`Found ${orphanContacts.length} orphaned contacts (no conversations):`);
    for (const c of orphanContacts) {
      console.log(`  - ${c.name} (${c.phone})`);
      await client.query(`DELETE FROM contact_tags WHERE contact_id = $1`, [c.id]);
      await client.query(`DELETE FROM contacts WHERE id = $1`, [c.id]);
    }

    console.log('Cleanup complete');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => console.error(e));
