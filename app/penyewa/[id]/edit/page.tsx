'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditPenyewaPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    nama: '',
    nik: '',
    alamat: '',
    whatsapp: '',
    kontak_darurat: '',
    jenis_usaha: ''
  });

  useEffect(() => {
    if (id) {
      fetchPenyewa();
    }
  }, [id]);

  const fetchPenyewa = async () => {
    try {
      const res = await fetch(`/api/penyewa/${id}`);
      if (!res.ok) throw new Error('Data tidak ditemukan');
      const data = await res.json();
      setFormData({
        nama: data.nama || '',
        nik: data.nik || '',
        alamat: data.alamat || '',
        whatsapp: data.whatsapp || '',
        kontak_darurat: data.kontak_darurat || '',
        jenis_usaha: data.jenis_usaha || ''
      });
    } catch (error) {
      console.error(error);
      alert('Gagal mengambil data penyewa');
      router.push('/penyewa');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/penyewa/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan data');
      
      router.push('/penyewa');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-4 text-center">Memuat data...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Edit Penyewa</h1>
        <p className="mt-1 text-sm text-gray-500">Ubah informasi detail penyewa unit.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nama Lengkap *</label>
            <input
              type="text"
              name="nama"
              required
              value={formData.nama}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border py-2 px-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">NIK (Nomor Induk Kependudukan) *</label>
            <input
              type="text"
              name="nik"
              required
              value={formData.nik}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border py-2 px-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Alamat Lengkap *</label>
            <textarea
              name="alamat"
              required
              rows={3}
              value={formData.alamat}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border py-2 px-3"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">WhatsApp *</label>
              <input
                type="text"
                name="whatsapp"
                required
                value={formData.whatsapp}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border py-2 px-3"
                placeholder="08..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Kontak Darurat *</label>
              <input
                type="text"
                name="kontak_darurat"
                required
                value={formData.kontak_darurat}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border py-2 px-3"
                placeholder="08..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Jenis Usaha (Opsional)</label>
            <input
              type="text"
              name="jenis_usaha"
              value={formData.jenis_usaha}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border py-2 px-3"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Link
              href="/penyewa"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
