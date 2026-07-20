'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Phone, FileText, Briefcase, MapPin } from 'lucide-react';

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

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/penyewa/${id}`);
      if (!res.ok) throw new Error('Gagal mengambil data penyewa');
      const data = await res.json();
      setPenyewa(data);
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
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{penyewa.nama}</h1>
          <p className="text-sm text-gray-500">Detail informasi penyewa</p>
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
                        {kontrak.unit?.kode_unit} - {kontrak.unit?.nomor_unit}
                      </p>
                      <p className="text-xs text-gray-500">
                        Masuk: {kontrak.tanggal_masuk} | Jatuh Tempo: Tgl {kontrak.tanggal_jatuh_tempo}
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

          {/* 3. Riwayat Unit (Kosong) */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4">Riwayat Unit</h3>
            <p className="text-sm text-gray-500 text-center py-4">Akan ditampilkan pada tahap selanjutnya.</p>
          </div>

          {/* 4. Riwayat Pembayaran Penyewa (Kosong) */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4">Riwayat Pembayaran</h3>
            <p className="text-sm text-gray-500 text-center py-4">Akan ditampilkan pada tahap selanjutnya.</p>
          </div>

          {/* 5. Ringkasan (Kosong) */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4">Ringkasan</h3>
            <p className="text-sm text-gray-500 text-center py-4">Akan ditampilkan pada tahap selanjutnya.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
