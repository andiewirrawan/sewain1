'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, History, Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatRupiah, formatTanggal } from '@/lib/format';

export default function AlokasiPembayaranPage() {
  const [alokasi, setAlokasi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  const fetchAlokasi = useCallback(async () => {
    try {
      const data = await apiFetch('/api/pembayaran/alokasi');
      setAlokasi(data);
    } catch (err) {
      console.error('Gagal mengambil data alokasi:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        
        if (user.role !== 'Owner' && user.role !== 'System Owner') {
          router.push('/dashboard');
        } else {
          setIsReady(true);
          fetchAlokasi();
        }
      } catch {
        router.push('/dashboard');
      }
    } else {
      router.push('/login');
    }
  }, [router, fetchAlokasi]);

  const filteredAlokasi = alokasi.filter(item => 
    item.penyewa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.unit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.periode_tagihan?.includes(searchTerm)
  );

  if (!isReady || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/pembayaran" className="flex items-center text-slate-500 hover:text-slate-700 transition-colors mb-2 group">
            <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Kembali ke Pembayaran</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <History className="text-blue-600" size={24} />
            Riwayat Alokasi Pembayaran
          </h1>
          <p className="text-slate-500 text-sm mt-1">Daftar bagaimana dana pembayaran didistribusikan ke tagihan</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Transaksi Alokasi</p>
          <p className="text-2xl font-black text-slate-900">{alokasi.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Nilai Alokasi</p>
          <p className="text-2xl font-black text-blue-600">
            {formatRupiah(alokasi.reduce((acc, curr) => acc + curr.nominal_alokasi, 0))}
          </p>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Cari penyewa, unit, atau periode..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tanggal Bayar</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Penyewa</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Unit</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Periode Tagihan</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Nominal Alokasi</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Metode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlokasi.length > 0 ? (
                filteredAlokasi.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                      {formatTanggal(item.tanggal_bayar)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {item.penyewa}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold uppercase">
                        {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.periode_tagihan}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-700 text-right">
                      {formatRupiah(item.nominal_alokasi)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-0.5 bg-slate-100 rounded">
                        {item.metode}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    Belum ada data alokasi pembayaran.
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
