'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  History,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { formatRupiah, formatTanggal } from '@/lib/format';

export default function RiwayatGeneratePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [riwayat, setRiwayat] = useState([]);

  useEffect(() => {
    fetchRiwayat();
  }, [fetchRiwayat]);

  const fetchRiwayat = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/tagihan/riwayat');
      const data = await res.json();
      setRiwayat(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft size={18} />
          Kembali ke Daftar
        </button>

        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <History className="text-blue-600" size={32} />
            Riwayat Generate Tagihan
          </h1>
          <p className="text-slate-500">Log aktivitas pembuatan tagihan massal oleh sistem</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase tracking-widest font-black">
                  <th className="px-6 py-4">Waktu Generate</th>
                  <th className="px-6 py-4 text-center">Periode</th>
                  <th className="px-6 py-4">Oleh</th>
                  <th className="px-6 py-4 text-center">Berhasil</th>
                  <th className="px-6 py-4 text-center">Skip</th>
                  <th className="px-6 py-4 text-right">Total Nominal</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-6 py-4"><div className="h-8 bg-slate-100 rounded w-full"></div></td>
                    </tr>
                  ))
                ) : riwayat.length > 0 ? (
                  riwayat.map((r: any) => (
                    <tr key={r.id_generate} className="hover:bg-slate-50/50 transition-colors text-sm">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{formatTanggal(r.tanggal_generate)}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(r.tanggal_generate).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg font-black text-[10px] uppercase">{r.periode}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                            {r.users?.nama?.[0]}
                          </div>
                          <span className="font-bold text-slate-700 truncate max-w-[120px]">{r.users?.nama}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600">
                        {r.jumlah_tagihan}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-amber-600">
                        {r.jumlah_skip || 0}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">
                        {formatRupiah(r.total_nominal)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 border border-emerald-100">
                            <CheckCircle2 size={10} /> {r.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <FileText size={48} className="text-slate-200" />
                        <p>Belum ada riwayat generate</p>
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
