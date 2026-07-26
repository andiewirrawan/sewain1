import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getUserFromRequest } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';
import { getPagination, formatPaginatedResponse } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id_penyewa = searchParams.get('id_penyewa');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    const { from, to } = getPagination(page, limit);

    let query = supabaseAdmin
      .from('pembayaran')
      .select(`
        *,
        penyewa (nama),
        alokasi_pembayaran (
          id_alokasi,
          nominal_alokasi,
          tagihan (
            periode,
            kontrak_sewa (
              unit (kode_unit)
            )
          )
        )
      `, { count: 'exact' });

    if (id_penyewa) {
      query = query.eq('id_penyewa', id_penyewa);
    }

    if (search) {
      query = query.or(`penyewa(nama).ilike.%${search}%,metode_pembayaran.ilike.%${search}%`);
    }

    const { data, count, error } = await query
      .order('tanggal_bayar', { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(formatPaginatedResponse(data, count, page, limit));
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      id_penyewa, 
      tanggal_bayar, 
      nominal, 
      status_pembayaran, 
      metode_pembayaran, 
      catatan,
      periode // Ditambahkan
    } = body;

    if (!id_penyewa || !tanggal_bayar || nominal === undefined || !status_pembayaran || !metode_pembayaran || !periode) {
      return NextResponse.json({ message: 'Field wajib diisi: Penyewa, Tanggal Bayar, Nominal, Status, Metode, Periode' }, { status: 400 });
    }

    const nominalBayar = parseFloat(nominal);

    // 1. Simpan data Pembayaran (Header)
    const { data: pembayaranData, error: errPembayaran } = await supabaseAdmin
      .from('pembayaran')
      .insert([
        {
          id_penyewa,
          tanggal_bayar,
          nominal: nominalBayar,
          status_pembayaran,
          metode_pembayaran,
          catatan,
          periode // Ditambahkan
        }
      ])
      .select()
      .single();

    if (errPembayaran) throw errPembayaran;

    // 2. Ambil Tagihan tertunggak (FIFO)
    // Ambil tagihan yang belum lunas milik penyewa ini (melalui kontrak_sewa)
    const { data: tagihanList, error: errTagihan } = await supabaseAdmin
      .from('tagihan')
      .select('*, kontrak_sewa!inner(id_penyewa)')
      .eq('kontrak_sewa.id_penyewa', id_penyewa)
      .neq('status_tagihan', 'Lunas')
      .order('periode', { ascending: true }); // MM-YYYY sort might be tricky, but usually works for basic comparison if formatted consistently or we use date

    if (errTagihan) throw errTagihan;

    // Sort manual jika diperlukan (MM-YYYY logic)
    // MM-YYYY -> YYYY-MM untuk sorting yang benar
    const sortedTagihan = (tagihanList || []).sort((a, b) => {
      const [ma, ya] = a.periode.split('-');
      const [mb, yb] = b.periode.split('-');
      return `${ya}-${ma}`.localeCompare(`${yb}-${mb}`);
    });

    let sisaNominal = nominalBayar;
    const alokasiInserts = [];
    const tagihanUpdates = [];

    for (const t of sortedTagihan) {
      if (sisaNominal <= 0) break;

      const kurang = parseFloat(t.total_tagihan) - parseFloat(t.terbayar || 0);
      const alokasi = Math.min(sisaNominal, kurang);

      if (alokasi > 0) {
        alokasiInserts.push({
          id_pembayaran: pembayaranData.id_pembayaran,
          id_tagihan: t.id_tagihan,
          nominal_alokasi: alokasi
        });

        const newTerbayar = parseFloat(t.terbayar || 0) + alokasi;
        let newStatus = 'Sebagian';
        if (Math.abs(newTerbayar - parseFloat(t.total_tagihan)) < 0.01) {
          newStatus = 'Lunas';
        }

        tagihanUpdates.push(
          supabaseAdmin
            .from('tagihan')
            .update({ 
              terbayar: newTerbayar, 
              status_tagihan: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id_tagihan', t.id_tagihan)
        );

        sisaNominal -= alokasi;
      }
    }

    // 3. Eksekusi alokasi dan update tagihan
    if (alokasiInserts.length > 0) {
      const { error: errAlokasi } = await supabaseAdmin
        .from('alokasi_pembayaran')
        .insert(alokasiInserts);
      
      if (errAlokasi) throw errAlokasi;

      // Jalankan semua update tagihan
      await Promise.all(tagihanUpdates);
    }

    // 4. Tangani Overpayment (Deposit)
    if (sisaNominal > 0.01) {
      // Ambil saldo saat ini
      const { data: penyewa, error: errPenyewa } = await supabaseAdmin
        .from('penyewa')
        .select('saldo_titipan')
        .eq('id_penyewa', id_penyewa)
        .single();
      
      if (!errPenyewa) {
        const newSaldo = parseFloat(penyewa.saldo_titipan || 0) + sisaNominal;
        await supabaseAdmin
          .from('penyewa')
          .update({ saldo_titipan: newSaldo })
          .eq('id_penyewa', id_penyewa);
        
        await catatAuditLog(user, 'OVERPAYMENT_DEPOSIT', 'penyewa', id_penyewa, { saldo_lama: penyewa.saldo_titipan }, { saldo_baru: newSaldo, sisa_bayar: sisaNominal });
      }
    }

    await catatAuditLog(user, 'CREATE_PAYMENT_FIFO', 'pembayaran', pembayaranData.id_pembayaran, null, {
      pembayaran: pembayaranData,
      alokasi: alokasiInserts,
      overpayment: sisaNominal > 0 ? sisaNominal : 0
    });

    return NextResponse.json(pembayaranData, { status: 201 });
  } catch (error: any) {
    console.error('Payment FIFO error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
