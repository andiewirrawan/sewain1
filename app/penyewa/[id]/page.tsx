'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Phone, FileText, Briefcase, MapPin } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatRupiah, formatTanggal, formatStatus, safeValue } from '@/lib/format';

export default function DetailPenyewaPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [penyewa, setPenyewa] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const [riwayat, setRiwayat] = useState<any>(null);

  const fetchDetail = async () => {
    try {
      const [resPenyewa, resRiwayat] = await Promise.all([
        apiFetch(`/api/penyewa/${id}`),
        apiFetch(`/api/penyewa/${id}/riwayat`)
      ]);

      if (!resPenyewa.ok) throw new Error('Gagal mengambil data penyewa');
      const data = await resPenyewa.json();
      console.log('API Response:', data);
      setPenyewa(data);

      if (resRiwayat.ok) {
        const riwayatData = await resRiwayat.json();
        setRiwayat(riwayatData);
      }
    } catch (error) {
      console.error(error);
      alert('Data tidak ditemukan');
      router.push('/penyewa');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Memuat detail penyewa...</div>;
  }

  if (!penyewa) {
    return null;
  }

  const activeContracts = penyewa.kontrak_sewa?.filter((k: any) => k.status_kontrak === 'Aktif') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/penyewa" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <h1 className="text-2xl font-semibold text-gray-900">{penyewa.nama}</h1>
          <div className="mt-1 sm:mt-0">
            {formatStatus(penyewa.status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Profil Penyewa */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4">Profil Penyewa</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">NIK</p>
                  <p className="text-sm text-gray-900">{penyewa.nik}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Alamat</p>
                  <p className="text-sm text-gray-900">{penyewa.alamat}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">WhatsApp</p>
                  <p className="text-sm text-gray-900">{penyewa.whatsapp}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Kontak Darurat</p>
                  <p className="text-sm text-gray-900">{penyewa.kontak_darurat}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Briefcase className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Jenis Usaha</p>
                  <p className="text-sm text-gray-900">{penyewa.jenis_usaha || '-'}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t">
              <Link
                href={`/penyewa/${penyewa.id_penyewa}/edit`}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Edit Profil
              </Link>
            </div>
          </div>
        </div>

        {/* Sections on the Right */}
        <div className="md:col-span-2 space-y-6">
          {/* 5. Ringkasan */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4">Ringkasan Penyewa</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Total Bayar</p>
                <p className="text-sm font-bold text-gray-900">{formatRupiah(riwayat?.summary?.total_pembayaran || 0)}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Tunggakan</p>
                <p className="text-sm font-bold text-red-600">{riwayat?.summary?.jumlah_tunggakan || 0} Periode</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Lama Sewa</p>
                <p className="text-sm font-bold text-blue-600">{riwayat?.summary?.total_lama_menyewa_hari || 0} Hari</p>
              </div>
            </div>
          </div>

          {/* 2. Unit Aktif */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4">Unit Aktif</h3>
            {activeContracts.length === 0 ? (
              <p className="text-sm text-gray-500">Tidak ada unit aktif saat ini.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {activeContracts.map((kontrak: any) => (
                  <li key={kontrak.id_kontrak} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {kontrak.unit?.kode_unit}
                      </p>
                      <p className="text-xs text-gray-500">
                        Masuk: {formatTanggal(kontrak.tanggal_masuk)} | Jatuh Tempo: Tgl {kontrak.tanggal_jatuh_tempo}
                      </p>
                    </div>
                    <Link
                      href={`/kontrak/${kontrak.id_kontrak}`}
                      className="text-sm text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Detail Kontrak
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 3. Riwayat Unit */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4">Riwayat Unit</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Unit</th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Periode</th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {riwayat?.riwayat_kontrak?.length > 0 ? (
                    riwayat.riwayat_kontrak.map((k: any) => (
                      <tr key={k.id_kontrak}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{k.unit?.kode_unit}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{formatTanggal(k.tanggal_masuk)} - {k.tanggal_keluar ? formatTanggal(k.tanggal_keluar) : 'Sekarang'}</td>
                        <td className="px-4 py-3">
                          {formatStatus(k.status_kontrak)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-400 italic">Belum ada riwayat unit</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Riwayat Pembayaran Penyewa */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4">Riwayat Pembayaran</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Periode</th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Unit</th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {riwayat?.riwayat_pembayaran?.length > 0 ? (
                    riwayat.riwayat_pembayaran.slice(0, 5).map((p: any) => (
                      <tr key={p.id_pembayaran}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.periode}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{p.kontrak_sewa?.unit?.kode_unit}</td>
                        <td className="px-4 py-3">
                          {formatStatus(p.status_pembayaran)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-400 italic">Belum ada transaksi pembayaran</td>
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
