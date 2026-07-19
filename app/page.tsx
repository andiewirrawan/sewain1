import React from 'react';
import { 
  Building2, 
  Users, 
  FileText, 
  CreditCard,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { name: 'Total Unit', value: '48', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Penyewa Aktif', value: '32', icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Kontrak Berjalan', value: '32', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Pendapatan Bulan Ini', value: 'Rp 45.000.000', icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Unit</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold">48</h3>
            <span className="text-xs text-green-600 font-medium mb-1">+2 bln ini</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Penyewa Aktif</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold text-blue-600">32</h3>
            <span className="text-xs text-slate-400 mb-1">92% Okupansi</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Belum Bayar</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold text-rose-500">14</h3>
            <span className="text-xs text-rose-500 font-medium mb-1">Perlu Audit</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pendapatan (Bln)</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold">Rp45jt</h3>
            <span className="text-xs text-green-600 font-medium mb-1">+12%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <h4 className="font-bold text-slate-800">Aktivitas Terakhir</h4>
            <button className="text-blue-600 text-xs font-bold hover:underline uppercase tracking-wide">Lihat Semua</button>
          </div>
          <div className="divide-y divide-slate-50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                  <TrendingUp size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Pembayaran diterima dari Unit A-0{i}</p>
                  <p className="text-xs text-slate-400">2 jam yang lalu • Oleh Admin</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">+Rp 2.500.000</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={18} className="text-amber-500" />
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Peringatan</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100 transition-hover hover:bg-amber-50">
                <p className="text-xs font-bold text-amber-800">5 Kontrak Akan Berakhir</p>
                <p className="text-[11px] text-amber-700 mt-0.5">Masa berlaku habis dalam 30 hari.</p>
              </div>
              <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100 transition-hover hover:bg-rose-50">
                <p className="text-xs font-bold text-rose-800">3 Pembayaran Menunggak</p>
                <p className="text-[11px] text-rose-700 mt-0.5">Unit B-12, C-05, dan A-08.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
