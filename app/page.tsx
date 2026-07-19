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
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
        <p className="text-slate-500">Selamat datang kembali di panel administrasi SEWAIN.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.name}</p>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-900">Aktivitas Terakhir</h3>
            <button className="text-blue-600 text-sm font-medium hover:underline">Lihat Semua</button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <TrendingUp size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Pembayaran diterima dari Unit A-0{i}</p>
                  <p className="text-xs text-slate-500">2 jam yang lalu • Oleh Admin</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">+Rp 2.500.000</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-amber-600">
            <AlertCircle size={20} />
            <h3 className="font-bold text-lg text-slate-900">Perlu Perhatian</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-sm font-bold text-amber-800">5 Kontrak Akan Berakhir</p>
              <p className="text-xs text-amber-700 mt-1">Ada 5 kontrak yang akan habis masa berlakunya dalam 30 hari ke depan.</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <p className="text-sm font-bold text-red-800">3 Pembayaran Menunggak</p>
              <p className="text-xs text-red-700 mt-1">Segera hubungi penyewa untuk unit B-12, C-05, dan A-08.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
