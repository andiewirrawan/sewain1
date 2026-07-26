'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  RefreshCw, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function GenerateTagihanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  
  const [jatuhTempo, setJatuhTempo] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMonth) {
      alert('Pilih bulan dan tahun terlebih dahulu.');
      return;
    }
    if (!jatuhTempo) {
      alert('Tentukan tanggal jatuh tempo.');
      return;
    }

    const periode = `${selectedMonth}-${selectedYear}`;

    try {
      setLoading(true);
      setResult(null);
      const res = await apiFetch('/api/tagihan/generate', {
        method: 'POST',
        body: JSON.stringify({ periode, jatuh_tempo: jatuhTempo })
      });
      const data = await res.json();
      
      if (res.ok) {
        setResult({ success: true, message: data.message, count: data.count });
      } else {
        setResult({ success: false, message: data.message || 'Terjadi kesalahan' });
      }
    } catch (err: any) {
      setResult({ success: false, message: 'Terjadi kesalahan sistem' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
      >
        <ArrowLeft size={18} />
        Kembali ke Daftar
      </button>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <h1 className="text-2xl font-bold">Generate Tagihan Bulanan</h1>
          <p className="text-blue-100/80 mt-1">Sistem akan otomatis membuat tagihan untuk seluruh kontrak aktif</p>
        </div>

        <div className="p-8">
          {result ? (
            <div className={`p-6 rounded-2xl flex flex-col items-center text-center gap-4 ${
              result.success ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {result.success ? <CheckCircle2 size={48} /> : <AlertTriangle size={48} />}
              <div>
                <h3 className="text-xl font-bold mb-1">{result.success ? 'Berhasil!' : 'Gagal Generate'}</h3>
                <p className="font-medium opacity-90">{result.message}</p>
              </div>
              {result.success ? (
                <button 
                  onClick={() => router.push('/tagihan')}
                  className="mt-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-md"
                >
                  Lihat Daftar Tagihan
                </button>
              ) : (
                <button 
                  onClick={() => setResult(null)}
                  className="mt-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md"
                >
                  Coba Lagi
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Calendar size={16} className="text-blue-600" />
                    Pilih Bulan
                  </label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    <option value="">Pilih Bulan</option>
                    {months.map((m, i) => (
                      <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Tahun</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {years.map(y => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Clock size={16} className="text-blue-600" />
                  Batas Jatuh Tempo
                </label>
                <input 
                  type="date"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                  value={jatuhTempo}
                  onChange={(e) => setJatuhTempo(e.target.value)}
                />
                <p className="text-[11px] text-slate-400 font-medium italic">* Tagihan akan ditandai terlambat setelah tanggal ini</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                <Info className="text-blue-600 shrink-0" size={20} />
                <div className="text-sm text-blue-700 leading-relaxed">
                  <p className="font-bold mb-1">Informasi:</p>
                  <ul className="list-disc list-inside space-y-1 opacity-90">
                    <li>Hanya kontrak berstatus <b>Aktif</b> yang akan dibuatkan tagihan.</li>
                    <li>Sistem mencegah pembuatan tagihan ganda untuk periode yang sama.</li>
                    <li>Promo/Diskon yang aktif akan otomatis diterapkan.</li>
                  </ul>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={24} />
                ) : (
                  <>
                    <RefreshCw size={24} />
                    Generate Sekarang
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
