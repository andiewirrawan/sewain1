'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Building2, User, History, Receipt, BarChart, AlertCircle, Clock } from 'lucide-react';
import { formatRupiah } from '@/lib/format';

export default function DetailUnitPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [unit, setUnit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [riwayat, setRiwayat] = useState<any>(null);

  const fetchUnit = async () => {
    try {
      const [resUnit, resRiwayat] = await Promise.all([
        fetch(`/api/unit/${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`/api/unit/${id}/riwayat`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (resUnit.ok) {
        const data = await resUnit.json();
        setUnit(data);
      }
      if (resRiwayat.ok) {
        const data = await resRiwayat.json();
        setRiwayat(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat data...</div>;
  if (!unit) return <div className="p-8 text-center text-red-500">Unit tidak ditemukan</div>;

  const activeContract = unit.kontrak_sewa?.find((k: any) => k.status_kontrak === 'Aktif');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/unit" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">Unit {unit.kode_unit}</h2>
              <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase 
                ${unit.status_unit === 'Kosong' ? 'bg-emerald-100 text-emerald-700' : 
                  unit.status_unit === 'Terisi' ? 'bg-blue-100 text-blue-700' : 
                  unit.status_unit === 'Booking' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                {unit.status_unit}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">Detail informasi, penyewa, dan riwayat</p>
          </div>
        </div>
        <Link 
          href={`/unit/${id}/edit`}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Edit size={16} />
          Edit Unit
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Info Unit & Penyewa Aktif */}
        <div className="space-y-6">
          {/* 1. Informasi Unit */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <Building2 size={18} className="text-slate-400" />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Informasi Unit</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-medium">Kategori</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{unit.kategori}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Jenis Unit</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{unit.jenis_unit}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Nomor Unit</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{unit.nomor_unit}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Harga Sewa Default</p>
                <p className="text-lg font-bold text-blue-600 mt-0.5">{formatRupiah(unit.harga_sewa)}<span className="text-xs text-slate-500 font-medium ml-1">/ bulan</span></p>
              </div>
            </div>
          </div>

          {/* 2. Penyewa Aktif */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <User size={18} className="text-slate-400" />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Penyewa Aktif</h3>
            </div>
            <div className="p-5">
              {activeContract ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Nama Penyewa</p>
                    <Link href={`/penyewa/${activeContract.id_penyewa}`} className="text-sm font-bold text-blue-600 hover:underline mt-0.5 block">
                      {activeContract.penyewa?.nama}
                    </Link>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Nomor Kontrak</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{activeContract.nomor_kontrak}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Jatuh Tempo</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">Tgl {activeContract.tanggal_jatuh_tempo} setiap bulan</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                    <User size={24} />
                  </div>
                  <p className="text-sm text-slate-500">Tidak ada penyewa aktif</p>
                  <Link href="/kontrak/tambah" className="text-xs font-medium text-blue-600 hover:underline mt-2 inline-block">Buat Kontrak Baru</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Riwayat & Ringkasan */}
        <div className="lg:col-span-2 space-y-6">
          {/* 5. Ringkasan */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 grid grid-cols-3 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                <BarChart size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Lunas</p>
                <p className="text-sm font-bold text-slate-900">{formatRupiah(riwayat?.summary?.total_pembayaran_lunas || 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 border-l border-slate-100 pl-4">
              <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tunggakan</p>
                <p className="text-sm font-bold text-slate-900">{riwayat?.summary?.jumlah_tunggakan || 0} Periode</p>
              </div>
            </div>
            <div className="flex items-center gap-4 border-l border-slate-100 pl-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lama Terisi</p>
                <p className="text-sm font-bold text-slate-900">{riwayat?.summary?.total_lama_terisi_hari || 0} Hari</p>
              </div>
            </div>
          </div>

          {/* 3. Riwayat Penyewa */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <History size={18} className="text-slate-400" />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Riwayat Penyewa</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Penyewa</th>
                    <th className="px-5 py-3">Periode</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {riwayat?.riwayat_kontrak?.length > 0 ? (
                    riwayat.riwayat_kontrak.map((k: any) => (
                      <tr key={k.id_kontrak} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-900">{k.penyewa?.nama}</td>
                        <td className="px-5 py-3 text-slate-600">{k.tanggal_masuk} s/d {k.tanggal_keluar || 'Sekarang'}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            k.status_kontrak === 'Aktif' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {k.status_kontrak}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-slate-400 italic">Belum ada riwayat penyewa</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Riwayat Pembayaran */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <Receipt size={18} className="text-slate-400" />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Riwayat Pembayaran Unit</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Periode</th>
                    <th className="px-5 py-3">Nominal</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {riwayat?.riwayat_pembayaran?.length > 0 ? (
                    riwayat.riwayat_pembayaran.slice(0, 10).map((p: any) => (
                      <tr key={p.id_pembayaran} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-900">{p.periode}</td>
                        <td className="px-5 py-3 text-slate-600">{formatRupiah(p.nominal)}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.status_pembayaran === 'Lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {p.status_pembayaran}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-slate-400 italic">Belum ada riwayat pembayaran</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
