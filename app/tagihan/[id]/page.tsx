'use client';

import React, { useState, useEffect } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';
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

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/tagihan/${id}`);
      if (!res.ok) throw new Error('Gagal memuat detail tagihan');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWA = () => {
    const url = generateWhatsAppTagihan(data.kontrak_sewa?.penyewa, [data]);
    if (url) window.open(url, '_blank');
  };

  if (loading) return <LayoutWrapper><div className="p-8">Loading...</div></LayoutWrapper>;
  if (error || !data) return <LayoutWrapper><div className="p-8 text-red-600">Error: {error || 'Data tidak ditemukan'}</div></LayoutWrapper>;

  const sisa = data.total_tagihan - data.terbayar;

  return (
    <LayoutWrapper>
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
                    data.status_tagihan === 'Lunas' ? 'bg-green-500 text-white' : 
                    data.status_tagihan === 'Sebagian' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'
                  }`}>
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
                <button className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm">
                  <Edit2 size={18} />
                  Koreksi Tagihan
                </button>
              </div>
            </div>

            {/* Note Card */}
            {data.catatan && (
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 space-y-2">
                <h4 className="text-amber-800 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} /> Catatan Tagihan
                </h4>
                <p className="text-amber-700 text-sm italic">{data.catatan}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
