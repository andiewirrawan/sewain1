'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, User, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react';
import { formatTanggal, formatRupiah, formatStatus, safeValue } from '@/lib/format';
import { apiFetch } from '@/lib/api';

export default function DetailKontrakPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [kontrak, setKontrak] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const fetchDetail = async () => {
    try {
      const res = await apiFetch(`/api/kontrak/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengambil data kontrak');
      setKontrak(data);
    } catch (error: any) {
      console.error('Fetch detail error:', error);
      alert(error.message || 'Data tidak ditemukan');
      router.push('/kontrak');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    const isConfirm = confirm(`Yakin ingin mengubah status kontrak menjadi ${status}?`);
    if (!isConfirm) return;

    try {
      const tanggal_keluar = new Date().toISOString().split('T')[0];
      const res = await apiFetch(`/api/kontrak/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          },
        body: JSON.stringify({ status_kontrak: status, tanggal_keluar })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      alert(`Kontrak berhasil ${status === 'Selesai' ? 'diakhiri' : 'diputus'}`);
      fetchDetail();
    } catch (error: any) {
      alert(error.message || 'Terjadi kesalahan');
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Memuat detail kontrak...</div>;
  }

  if (!kontrak) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/kontrak" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{kontrak.nomor_kontrak}</h1>
          <div className="flex items-center mt-1 space-x-2">
            {formatStatus(kontrak.status_kontrak)}
            <span className="text-sm text-gray-500">
              Dibuat pada {formatTanggal(kontrak.tanggal_masuk)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-3 flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-gray-500" /> Informasi Unit
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Kode Unit</p>
              <p className="font-medium">{kontrak.unit?.kode_unit}</p>
            </div>
            <div>
              <p className="text-gray-500">Jenis Unit</p>
              <p className="font-medium">{kontrak.unit?.jenis_unit}</p>
            </div>
            <div>
              <p className="text-gray-500">Harga Sewa</p>
              <p className="font-medium">{formatRupiah(kontrak.unit?.harga_sewa)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-3 flex items-center">
            <User className="h-5 w-5 mr-2 text-gray-500" /> Informasi Penyewa
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Nama</p>
              <p className="font-medium">{kontrak.penyewa?.nama}</p>
            </div>
            <div>
              <p className="text-gray-500">NIK</p>
              <p className="font-medium">{kontrak.penyewa?.nik}</p>
            </div>
            <div>
              <p className="text-gray-500">WhatsApp</p>
              <p className="font-medium">{kontrak.penyewa?.whatsapp}</p>
            </div>
            <div>
              <p className="text-gray-500">Jenis Usaha</p>
              <p className="font-medium">{kontrak.penyewa?.jenis_usaha || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-gray-500" /> Periode Kontrak
        </h3>
        <div className="flex flex-col sm:flex-row gap-8 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Tanggal Masuk</p>
            <p className="font-medium text-gray-900 text-lg">{formatTanggal(kontrak.tanggal_masuk)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Jatuh Tempo Pembayaran</p>
            <p className="font-medium text-gray-900 text-lg">Tgl {kontrak.tanggal_jatuh_tempo} Setiap Bulan</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Tanggal Keluar</p>
            <p className="font-medium text-gray-900 text-lg">{kontrak.tanggal_keluar ? formatTanggal(kontrak.tanggal_keluar) : '-'}</p>
          </div>
        </div>

        {kontrak.status_kontrak === 'Aktif' && (
          <div className="mt-8 pt-4 border-t flex flex-wrap gap-3">
            <button
              onClick={() => updateStatus('Selesai')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Akhiri Kontrak (Selesai Normal)
            </button>
            <button
              onClick={() => updateStatus('Diputus')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Putus Kontrak (Bermasalah)
            </button>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4">Riwayat Pembayaran</h3>
        <p className="text-sm text-gray-500 text-center py-8">Akan ditampilkan pada tahap selanjutnya.</p>
      </div>
    </div>
  );
}
