import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nmkwmknvxigahuafdwvz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ta3dta252eGlnYWh1YWZkd3Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTQyODY0MiwiZXhwIjoyMDk3MDA0NjQyfQ.F_QOgxCeB60Poq2Z-_D5pnlgsIcEFmOTgNBEPCN6bso'
);

async function main() {
  // Step 1: Find and delete duplicate contacts (keep oldest per user_id + phone)
  const { data: allContacts, error: fetchErr } = await supabase
    .from('contacts')
    .select('id, user_id, phone, name, created_at')
    .order('created_at', { ascending: true });

  if (fetchErr) { console.error('Fetch error:', fetchErr); return; }

  const seen = new Map<string, string>(); // key: `${user_id}:${phone}` → id
  const toDelete: string[] = [];

  for (const c of allContacts ?? []) {
    const key = `${c.user_id}:${c.phone}`;
    if (seen.has(key)) {
      toDelete.push(c.id);
    } else {
      seen.set(key, c.id);
    }
  }

  console.log(`Found ${toDelete.length} duplicate contacts to delete`);

  if (toDelete.length > 0) {
    // Delete in batches of 50
    for (let i = 0; i < toDelete.length; i += 50) {
      const batch = toDelete.slice(i, i + 50);
      const { error: delErr } = await supabase
        .from('contacts')
        .delete()
        .in('id', batch);
      if (delErr) console.error('Delete error:', delErr);
      else console.log(`Deleted batch ${Math.floor(i / 50) + 1}`);
    }
  }

  // Also delete orphaned conversations (pointing to deleted contacts)
  const { data: remainingContacts } = await supabase
    .from('contacts')
    .select('id');
  const contactIds = new Set((remainingContacts ?? []).map(c => c.id));

  const { data: allConvs } = await supabase
    .from('conversations')
    .select('id, contact_id');

  const orphanedConvs = (allConvs ?? []).filter(c => !contactIds.has(c.contact_id));
  if (orphanedConvs.length > 0) {
    console.log(`Found ${orphanedConvs.length} orphaned conversations`);
    for (const conv of orphanedConvs) {
      await supabase.from('conversations').delete().eq('id', conv.id);
    }
    console.log('Deleted orphaned conversations');
  }

  console.log('Dedup complete. Now run the SQL in the Supabase dashboard:');
  console.log('CREATE UNIQUE INDEX IF NOT EXISTS uq_contacts_user_phone ON contacts (user_id, phone);');

  // Verify
  const { count } = await supabase
    .from('contacts')
    .select('id', { count: 'exact', head: true });
  console.log(`Remaining contacts: ${count}`);
}

main();
