'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  FileText, 
  Download, 
  MoreVertical, 
  Plus,
  RefreshCw,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  History
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import { generateWhatsAppTagihan } from '@/lib/whatsapp';

export default function TagihanPage() {
  const [tagihan, setTagihan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  useEffect(() => {
    fetchTagihan();
  }, [statusFilter]);

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

  const fetchTagihan = async () => {
    try {
      setLoading(true);
      let url = '/api/tagihan';
      if (statusFilter !== 'Semua') {
        url += `?status=${statusFilter}`;
      }
      const res = await apiFetch(url);
      const data = await res.json();
      setTagihan(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTagihan = tagihan.filter((t: any) => 
    t.kontrak_sewa?.penyewa?.nama.toLowerCase().includes(search.toLowerCase()) ||
    t.kontrak_sewa?.nomor_kontrak.toLowerCase().includes(search.toLowerCase()) ||
    t.periode.toLowerCase().includes(search.toLowerCase())
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
          <Link 
            href="/tagihan/generate"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <RefreshCw size={18} />
            Generate Tagihan
          </Link>
        </div>
      </div>

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
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Periode</th>
                <th className="px-6 py-4">Penyewa & Unit</th>
                <th className="px-6 py-4">Total Tagihan</th>
                <th className="px-6 py-4">Terbayar</th>
                <th className="px-6 py-4">Sisa</th>
                <th className="px-6 py-4">Jatuh Tempo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="px-6 py-4"><div className="h-10 bg-slate-100 rounded-lg w-full"></div></td>
                  </tr>
                ))
              ) : filteredTagihan.length > 0 ? (
                filteredTagihan.map((t: any) => {
                  const sisa = t.total_tagihan - t.terbayar;
                  const isOverdue = new Date(t.jatuh_tempo) < new Date() && t.status_tagihan !== 'Lunas';
                  
                  return (
                    <tr key={t.id_tagihan} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900">{t.periode}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{t.kontrak_sewa?.penyewa?.nama}</span>
                          <span className="text-xs text-slate-500 font-medium">Unit: {t.kontrak_sewa?.unit?.kode_unit}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {formatRupiah(t.total_tagihan)}
                      </td>
                      <td className="px-6 py-4 text-green-600 font-medium">
                        {formatRupiah(t.terbayar)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${sisa > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                          {formatRupiah(sisa)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                            {formatTanggal(t.jatuh_tempo)}
                          </span>
                          {isOverdue && <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Terlambat</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(t.status_tagihan)}
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
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
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
