import { supabaseAdmin } from './supabase-admin';
import bcrypt from 'bcryptjs';

/**
 * Bootstrap the system by creating a default System Owner if no users exist.
 * This is designed to run automatically in production when the database is empty.
 */
export async function bootstrapSystem() {
  if (!supabaseAdmin) {
    console.error('Bootstrap: supabaseAdmin is not initialized');
    return;
  }

  try {
    // 1. Check if any users exist
    const { count, error: countError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Bootstrap: Error checking user count:', countError.message);
      return;
    }

    if (count !== 0) {
      // System already has users, no need to bootstrap
      return;
    }

    console.log('--- SYSTEM BOOTSTRAP ---');
    console.log('No users found in database. Initializing default System Owner...');

    // 2. Prepare default credentials
    const defaultEmail = 'admin@sewain.com';
    const defaultPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const systemOwnerId = '11111111-1111-1111-1111-111111111111';

    // 3. Create System Owner in public.users
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: systemOwnerId,
        nama: 'System Owner',
        email: defaultEmail,
        password: hashedPassword,
        role: 'System Owner',
        status: 'Aktif',
        is_system_owner: true
      });

    if (insertError) {
      console.error('Bootstrap: Error creating System Owner:', insertError.message);
      
      // If table users doesn't exist yet, we might need to wait or handle schema
      if (insertError.code === '42P01') {
        console.error('Bootstrap: Table "users" does not exist. Schema might not be initialized.');
      }
      return;
    }

    // 4. Log the audit event for system initialization
    await supabaseAdmin.from('audit_log').insert({
      id_user: systemOwnerId,
      role: 'System Owner',
      aktivitas: 'System Initialization',
      nama_tabel: 'users',
      id_data: systemOwnerId,
      data_baru: {
        message: 'Default System Owner account created automatically during bootstrap.',
        email: defaultEmail
      }
    }).catch(e => console.error('Bootstrap: Failed to log audit event', e));

    console.log('--- BOOTSTRAP SUCCESSFUL ---');
    console.log('User: ' + defaultEmail);
    console.log('Password: ' + defaultPassword);
    console.log('--- PLEASE CHANGE PASSWORD AFTER LOGIN ---');

  } catch (err) {
    console.error('Bootstrap: Unexpected error during system initialization:', err);
  }
}
