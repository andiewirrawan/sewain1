'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  FileText, 
  MoreVertical, 
  RefreshCw,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  History,
  X
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import { generateWhatsAppTagihan } from '@/lib/whatsapp';

export default function TagihanPage() {
  const [tagihan, setTagihan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [genPeriode, setGenPeriode] = useState({
    bulan: String(new Date().getMonth() + 1).padStart(2, '0'),
    tahun: String(new Date().getFullYear()),
    jatuh_tempo: ''
  });

  const months = [
    { v: '01', l: 'Januari' }, { v: '02', l: 'Februari' }, { v: '03', l: 'Maret' },
    { v: '04', l: 'April' }, { v: '05', l: 'Mei' }, { v: '06', l: 'Juni' },
    { v: '07', l: 'Juli' }, { v: '08', l: 'Agustus' }, { v: '09', l: 'September' },
    { v: '10', l: 'Oktober' }, { v: '11', l: 'November' }, { v: '12', l: 'Desember' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

  useEffect(() => {
    fetchTagihan();
  }, [fetchTagihan]);

  const fetchPreview = useCallback(async () => {
    try {
      const periode = `${genPeriode.bulan}-${genPeriode.tahun}`;
      const res = await apiFetch('/api/tagihan/generate', {
        method: 'POST',
        body: JSON.stringify({ periode, preview: true })
      });
      const data = await res.json();
      setPreviewData(data);
    } catch (err) {
      console.error('Gagal fetch preview:', err);
    }
  }, [genPeriode.bulan, genPeriode.tahun]);

  useEffect(() => {
    if (isModalOpen) {
      fetchPreview();
    }
  }, [isModalOpen, fetchPreview]);

  const handleGenerate = async () => {
    if (!genPeriode.jatuh_tempo) {
      alert('Tentukan tanggal jatuh tempo!');
      return;
    }
    try {
      setModalLoading(true);
      const periode = `${genPeriode.bulan}-${genPeriode.tahun}`;
      const res = await apiFetch('/api/tagihan/generate', {
        method: 'POST',
        body: JSON.stringify({ 
          periode, 
          jatuh_tempo: genPeriode.jatuh_tempo 
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setIsModalOpen(false);
        fetchTagihan();
      } else {
        alert(data.message || 'Gagal generate tagihan');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan sistem');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSendWA = async (t: any) => {
    // Cari semua tagihan penyewa ini yang belum lunas
    const penyewaTagihan = tagihan.filter((item: any) => 
      item.kontrak_sewa?.id_penyewa === t.kontrak_sewa?.id_penyewa
    );
    
    const totalPiutang = penyewaTagihan.reduce((acc: number, curr: any) => acc + (curr.total_tagihan - curr.terbayar), 0);
    
    const waUrl = generateWhatsAppTagihan(t.kontrak_sewa?.penyewa, penyewaTagihan);
    if (waUrl) {
      window.open(waUrl, '_blank');
      
      // Log to database
      try {
        await apiFetch('/api/tagihan/wa-log', {
          method: 'POST',
          body: JSON.stringify({
            id_penyewa: t.kontrak_sewa?.id_penyewa,
            jumlah_tagihan: penyewaTagihan.length,
            total_piutang: totalPiutang,
            status: 'Berhasil'
          })
        });
      } catch (err) {
        console.error('Gagal mencatat log WA:', err);
      }
    } else {
      alert('Tidak ada tagihan tertunggak untuk penyewa ini.');
    }
  };

  const fetchTagihan = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = '/api/tagihan';
      if (statusFilter !== 'Semua') {
        url += `?status=${statusFilter}`;
      }
      const res = await apiFetch(url);
      if (!res.ok) throw new Error('Gagal mengambil data tagihan');
      const data = await res.json();
      setTagihan(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memuat tagihan');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const filteredTagihan = tagihan.filter((t: any) => 
    t.kontrak_sewa?.penyewa?.nama?.toLowerCase().includes(search.toLowerCase()) ||
    t.kontrak_sewa?.nomor_kontrak?.toLowerCase().includes(search.toLowerCase()) ||
    t.periode?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Lunas':
        return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle2 size={12} /> Lunas</span>;
      case 'Sebagian':
        return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12} /> Sebagian</span>;
      case 'Belum Bayar':
        return <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><AlertCircle size={12} /> Belum Bayar</span>;
      case 'Terlambat':
        return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><AlertCircle size={12} /> Terlambat</span>;
      case 'Write Off':
        return <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs font-bold w-fit">Write Off</span>;
      case 'Dibatalkan':
        return <span className="bg-slate-100 text-slate-400 px-2 py-1 rounded-full text-xs font-bold w-fit line-through">Dibatalkan</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-bold w-fit">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Daftar Tagihan</h1>
          <p className="text-slate-500">Kelola tagihan dan penagihan sewa unit</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link 
            href="/tagihan/riwayat"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <History size={18} />
            Riwayat Generate
          </Link>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <RefreshCw size={18} />
            Generate Piutang
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900">Generate Piutang</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Bulan</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={genPeriode.bulan}
                    onChange={(e) => setGenPeriode({...genPeriode, bulan: e.target.value})}
                  >
                    {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Tahun</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={genPeriode.tahun}
                    onChange={(e) => setGenPeriode({...genPeriode, tahun: e.target.value})}
                  >
                    {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Tanggal Jatuh Tempo</label>
                <input 
                  type="date"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={genPeriode.jatuh_tempo}
                  onChange={(e) => setGenPeriode({...genPeriode, jatuh_tempo: e.target.value})}
                />
              </div>

              {previewData && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Preview Generate</h4>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Kontrak Aktif</p>
                      <p className="text-lg font-black text-slate-900">{previewData.total_aktif}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase text-blue-600">Tagihan Baru</p>
                      <p className="text-lg font-black text-blue-700">{previewData.tagihan_baru}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase text-amber-600">Skip (Sudah Ada)</p>
                      <p className="text-lg font-black text-amber-700">{previewData.skip}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase text-emerald-600">Total Estimasi</p>
                      <p className="text-lg font-black text-emerald-700">{formatRupiah(previewData.total_nominal)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
              >
                Batal
              </button>
              <button 
                onClick={handleGenerate}
                disabled={modalLoading || !previewData?.tagihan_baru}
                className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {modalLoading ? <RefreshCw className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-8 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col items-center text-center gap-3">
          <AlertCircle className="text-rose-500" size={32} />
          <div>
            <h3 className="text-lg font-bold text-rose-900">Gagal Memuat Data</h3>
            <p className="text-rose-600/80 text-sm">{error}</p>
          </div>
          <button 
            onClick={() => fetchTagihan()}
            className="px-6 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
          >
            Coba Lagi
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari penyewa, kontrak, atau periode..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {['Semua', 'Belum Bayar', 'Sebagian', 'Lunas', 'Terlambat', 'Write Off', 'Dibatalkan'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  statusFilter === s 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase tracking-widest font-black">
                <th className="px-6 py-4">Penyewa</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">Periode</th>
                <th className="px-6 py-4">Nominal</th>
                <th className="px-6 py-4">Terbayar</th>
                <th className="px-6 py-4">Sisa</th>
                <th className="px-6 py-4">Status Tagihan</th>
                <th className="px-6 py-4 text-center">Status Kontrak</th>
                <th className="px-6 py-4">Jatuh Tempo</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={10} className="px-6 py-4"><div className="h-10 bg-slate-100 rounded-lg w-full"></div></td>
                  </tr>
                ))
              ) : filteredTagihan.length > 0 ? (
                filteredTagihan.map((t: any) => {
                  const sisa = t.total_tagihan - t.terbayar;
                  const isOverdue = new Date(t.jatuh_tempo) < new Date() && t.status_tagihan !== 'Lunas';
                  const statusKontrak = t.kontrak_sewa?.status_kontrak || 'Aktif';
                  
                  return (
                    <tr key={t.id_tagihan} className="hover:bg-slate-50/80 transition-colors group text-sm">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {t.kontrak_sewa?.penyewa?.nama}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600">
                        {t.kontrak_sewa?.unit?.kode_unit}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-700">{t.periode}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {formatRupiah(t.total_tagihan)}
                      </td>
                      <td className="px-6 py-4 text-green-600 font-bold">
                        {formatRupiah(t.terbayar)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${sisa > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                          {formatRupiah(sisa)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(t.status_tagihan)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                          statusKontrak === 'Aktif' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {statusKontrak}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                            {formatTanggal(t.jatuh_tempo)}
                          </span>
                          {isOverdue && <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">Terlambat</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleSendWA(t)}
                            title="Kirim WhatsApp Tagihan"
                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <MessageCircle size={18} />
                          </button>
                          <Link 
                            href={`/tagihan/${t.id_tagihan}`}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <MoreVertical size={18} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={48} className="text-slate-200" />
                      <p>Tidak ada data tagihan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
