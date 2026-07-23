import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest, requireRole } from '@/lib/auth';
import { getPagination, formatPaginatedResponse } from '@/lib/pagination';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request as any);
  if (!user || !requireRole(user, ['Owner'])) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const userId = searchParams.get('user_id');

  const { from, to } = getPagination(page, limit);

  let query = supabase.from('audit_log').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);
  
  if (userId) {
    query = query.eq('id_user', userId);
  }
  
  const { data, count, error } = await query;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  
  return NextResponse.json(formatPaginatedResponse(data || [], count, page, limit));
}
