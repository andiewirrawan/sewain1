'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Receipt, 
  Calendar, 
  User, 
  Home,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  MessageCircle,
  Edit2
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { generateWhatsAppTagihan } from '@/lib/whatsapp';

export default function TagihanDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [waLogs, setWaLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchDetail();
    try { const u = JSON.parse(localStorage.getItem('user') || '{}'); setUserRole(u.role); } catch(e) {}
    fetchWaLogs();
  }, [id]);

  const fetchWaLogs = async () => {
    try {
      const res = await apiFetch(`/api/tagihan/wa-log?id_penyewa=${data?.kontrak_sewa?.penyewa?.id_penyewa}`);
      if (res.ok) setWaLogs(await res.json());
    } catch (err) {}
  };

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/tagihan/${id}`);
      if (!res.ok) throw new Error('Gagal memuat detail tagihan');
      const json = await res.json();
      setData(json);
      
      // Fetch logs after we have tenant ID
      if (json.kontrak_sewa?.penyewa?.id_penyewa) {
        const logRes = await apiFetch(`/api/tagihan/wa-log?id_penyewa=${json.kontrak_sewa.penyewa.id_penyewa}`);
        if (logRes.ok) setWaLogs(await logRes.json());
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWA = async () => {
    try {
      const url = generateWhatsAppTagihan(data.kontrak_sewa?.penyewa, [data]);
      if (url) {
        window.open(url, '_blank');
        // Log the event
        await apiFetch('/api/tagihan/wa-log', {
          method: 'POST',
          body: JSON.stringify({
            id_penyewa: data.kontrak_sewa?.penyewa?.id_penyewa,
            jumlah_tagihan: 1,
            total_piutang: sisa,
            status: 'Berhasil'
          })
        });
      }
    } catch (err) {
      console.error('Failed to log WA reminder:', err);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    const confirmMsg = `Apakah Anda yakin ingin mengubah status tagihan ini menjadi ${newStatus}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await apiFetch(`/api/tagihan/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status_tagihan: newStatus,
          alasan_perubahan: `Status diubah menjadi ${newStatus} secara manual`
        })
      });
      if (!res.ok) throw new Error('Gagal memperbarui status');
      fetchDetail();
    try { const u = JSON.parse(localStorage.getItem('user') || '{}'); setUserRole(u.role); } catch(e) {}
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error || !data) return <div className="p-8 text-red-600">Error: {error || 'Data tidak ditemukan'}</div>;

  const sisa = data.total_tagihan - data.terbayar;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft size={18} />
          Kembali ke Daftar
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold">Tagihan {data.periode}</h1>
                  <p className="text-slate-400 text-sm">ID: {data.id_tagihan.substring(0, 8)}...</p>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Status</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    data.status_tagihan === 'Lunas' ? 'bg-emerald-500 text-white' : 
                    data.status_tagihan === 'Sebagian' ? 'bg-amber-500 text-white' : 
                    data.status_tagihan === 'Belum Bayar' ? 'bg-rose-500 text-white' :
                    data.status_tagihan === 'Terlambat' ? 'bg-orange-500 text-white' :
                    'bg-slate-500 text-white'
                  } ${data.status_tagihan === 'Dibatalkan' ? 'line-through opacity-50' : ''}`}>
                    {data.status_tagihan}
                  </span>
                </div>
              </div>

              <div className="p-8 grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-1">
                    <User size={10} /> Penyewa
                  </div>
                  <div className="text-lg font-bold text-slate-900">{data.kontrak_sewa?.penyewa?.nama}</div>
                  <div className="text-xs text-slate-500">{data.kontrak_sewa?.penyewa?.nik}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-1">
                    <Home size={10} /> Unit Properti
                  </div>
                  <div className="text-lg font-bold text-slate-900">{data.kontrak_sewa?.unit?.kode_unit}</div>
                  <div className="text-xs text-slate-500">{data.kontrak_sewa?.unit?.jenis_unit}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-1">
                    <Calendar size={10} /> Jatuh Tempo
                  </div>
                  <div className="text-lg font-bold text-slate-900">{formatTanggal(data.jatuh_tempo)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-1">
                    <Receipt size={10} /> No. Kontrak
                  </div>
                  <div className="text-lg font-bold text-slate-900">{data.kontrak_sewa?.nomor_kontrak}</div>
                </div>
              </div>
            </div>

            {/* Alokasi Pembayaran */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard size={18} className="text-blue-600" />
                  Histori Alokasi Pembayaran
                </h3>
              </div>
              <div className="p-0">
                {data.alokasi_pembayaran?.length > 0 ? (
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
                      <tr>
                        <th className="px-8 py-3">Tanggal</th>
                        <th className="px-8 py-3">Metode</th>
                        <th className="px-8 py-3 text-right">Nominal Alokasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.alokasi_pembayaran.map((a: any) => (
                        <tr key={a.id_alokasi} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-4">
                            <span className="text-sm font-medium text-slate-700">{formatTanggal(a.pembayaran?.tanggal_bayar)}</span>
                          </td>
                          <td className="px-8 py-4">
                            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500">
                              {a.pembayaran?.metode_pembayaran}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-right font-bold text-green-600">
                            {formatRupiah(a.nominal_alokasi)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <AlertCircle size={48} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">Belum ada pembayaran yang dialokasikan</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Financial Summary */}
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-slate-500 text-sm">
                  <span>Nominal Sewa</span>
                  <span className="font-bold">{formatRupiah(data.nominal_tagihan)}</span>
                </div>
                <div className="flex justify-between items-center text-red-500 text-sm">
                  <span>Diskon/Promo</span>
                  <span className="font-bold">-{formatRupiah(data.nominal_diskon)}</span>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-slate-900 font-black">
                  <span className="text-lg">Total Tagihan</span>
                  <span className="text-xl">{formatRupiah(data.total_tagihan)}</span>
                </div>
                <div className="flex justify-between items-center text-green-600 text-sm font-bold">
                  <span>Sudah Dibayar</span>
                  <span>{formatRupiah(data.terbayar)}</span>
                </div>
                <div className="p-4 bg-slate-900 rounded-2xl text-white flex justify-between items-center">
                  <span className="text-xs font-bold uppercase opacity-60 tracking-wider">Sisa Tagihan</span>
                  <span className="text-lg font-black">{formatRupiah(sisa)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <button 
                  onClick={handleSendWA}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                >
                  <MessageCircle size={18} />
                  Kirim WA Tagihan
                </button>
                <div className="grid grid-cols-2 gap-2">
                  {userRole !== 'Admin' && (
                    <button 
                      onClick={() => handleUpdateStatus('Write Off')}
                      className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all text-xs"
                    >
                      Write Off
                    </button>
                  )}
                  <button 
                    onClick={() => handleUpdateStatus('Dibatalkan')}
                    className="flex items-center justify-center gap-2 bg-rose-50 text-rose-700 py-3 rounded-xl font-bold hover:bg-rose-100 transition-all text-xs"
                  >
                    Dibatalkan
                  </button>
                </div>
                <button 
                  onClick={() => router.push(`/tagihan/${id}/edit`)}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
                >
                  <Edit2 size={18} />
                  Koreksi Tagihan
                </button>
              </div>

              {/* Deposit Info */}
              {data.kontrak_sewa?.penyewa?.saldo_titipan > 0 && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="text-[10px] uppercase font-black text-emerald-600 tracking-widest mb-1">Saldo Titipan (Deposit)</div>
                  <div className="text-xl font-black text-emerald-900">{formatRupiah(data.kontrak_sewa?.penyewa?.saldo_titipan)}</div>
                  <p className="text-[10px] text-emerald-700 mt-1 italic">Saldo ini dapat digunakan untuk memotong tagihan berikutnya.</p>
                </div>
              )}
            </div>

            {/* Note Card */}
            {data.catatan && (
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 space-y-2">
                <h4 className="text-amber-800 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                  Catatan Tagihan
                </h4>
                <p className="text-amber-700 text-sm italic">{data.catatan}</p>
              </div>
            )}

            {/* WA History Card */}
            {waLogs.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h4 className="text-slate-900 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                  <MessageCircle size={14} className="text-green-600" /> Histori WA Reminder
                </h4>
                <div className="space-y-3">
                  {waLogs.map((log: any) => (
                    <div key={log.id_log} className="flex justify-between items-start text-xs border-b border-slate-50 pb-2">
                      <div>
                        <div className="font-bold text-slate-700">{formatTanggal(log.tanggal_kirim)}</div>
                        <div className="text-slate-500">Oleh: {log.users?.nama}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">{formatRupiah(log.total_piutang_wa)}</div>
                        <div className="text-green-600 font-bold uppercase text-[9px]">{log.status_kirim}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
