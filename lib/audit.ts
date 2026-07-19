import { supabase } from './supabase';
import { UserPayload } from './auth';

export async function catatAuditLog(
  user: UserPayload,
  aktivitas: string,
  nama_tabel: string,
  id_data: string,
  data_lama: any = null,
  data_baru: any = null
) {
  const { error } = await supabase.from('audit_log').insert({
    id_user: user.id,
    role: user.role,
    aktivitas,
    nama_tabel,
    id_data,
    data_lama,
    data_baru,
  });

  if (error) {
    console.error('Gagal mencatat audit log:', error);
  }
}
