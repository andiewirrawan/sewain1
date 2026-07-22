'use client';
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Building2, Wallet, AlertCircle, CalendarDays, Percent, BarChart3, ReceiptText } from 'lucide-react';
import { formatRupiah } from '@/lib/format';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/dashboard')
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Gagal memuat dashboard');
        }
        return res.json();
      })
      .then(setData)
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  const occupancyData = Object.entries(data?.occupancy_per_jenis || {}).map(([key, val]: any) => ({
    name: key,
    terisi: val.terisi,
    kosong: val.total - val.terisi
  }));

  const cards = [
    { title: 'Total Unit', value: data?.total_unit, icon: Building2, color: 'text-slate-600', bg: 'bg-slate-100' },
    { title: 'Unit Terisi', value: data?.unit_terisi, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Unit Kosong', value: data?.unit_kosong, icon: Building2, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Penyewa Aktif', value: data?.penyewa_aktif, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Kontrak Aktif', value: data?.kontrak_aktif, icon: ReceiptText, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Tunggakan', value: data?.tunggakan_bulan_ini, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-100' },
    { title: 'Pendapatan Bulan Ini', value: formatRupiah(data?.pendapatan_bulan_ini), icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Pendapatan Tahun Ini', value: formatRupiah(data?.pendapatan_tahun_ini), icon: Wallet, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard Sewain</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${c.bg} ${c.color}`}><c.icon size={24} /></div>
            <div>
              <p className="text-xs uppercase font-bold text-slate-400">{c.title}</p>
              <p className="text-lg font-bold text-slate-900">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 uppercase text-sm tracking-wider">Occupancy per Jenis</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={occupancyData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="terisi" fill="#2563eb" name="Terisi" />
              <Bar dataKey="kosong" fill="#f59e0b" name="Kosong" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Belum Bayar Bulan Ini</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr><th className="px-5 py-3">Penyewa</th><th className="px-5 py-3">Unit</th><th className="px-5 py-3">WhatsApp</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data?.belum_bayar_bulan_ini?.map((k: any) => (
                <tr key={k.nomor_kontrak}>
                  <td className="px-5 py-3">{k.penyewa?.nama}</td>
                  <td className="px-5 py-3">{k.unit?.kode_unit}</td>
                  <td className="px-5 py-3">
                    <a href={`https://wa.me/${k.penyewa?.whatsapp}`} target="_blank" className="text-blue-600 font-bold hover:underline">Chat</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Jatuh Tempo Minggu Ini</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr><th className="px-5 py-3">Penyewa</th><th className="px-5 py-3">Unit</th><th className="px-5 py-3">Jatuh Tempo</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data?.jatuh_tempo_minggu_ini?.map((k: any) => (
                <tr key={k.nomor_kontrak}>
                  <td className="px-5 py-3">{k.penyewa?.nama}</td>
                  <td className="px-5 py-3">{k.unit?.kode_unit}</td>
                  <td className="px-5 py-3">{k.tanggal_jatuh_tempo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
