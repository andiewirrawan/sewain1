'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TambahKontrakPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [units, setUnits] = useState<any[]>([]);
  const [penyewa, setPenyewa] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    id_unit: '',
    id_penyewa: '',
    tanggal_masuk: '',
    tanggal_jatuh_tempo: '1'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const resUnit = await fetch('/api/unit?status_unit=Kosong');
      const dataUnit = await resUnit.json();
      setUnits(dataUnit);

      const resPenyewa = await fetch('/api/penyewa');
      const dataPenyewa = await resPenyewa.json();
      setPenyewa(dataPenyewa);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/kontrak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tanggal_jatuh_tempo: parseInt(formData.tanggal_jatuh_tempo, 10)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan data');
      
      router.push('/kontrak');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Buat Kontrak Baru</h1>
        <p className="mt-1 text-sm text-gray-500">Isi form untuk membuat perjanjian sewa baru.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Pilih Unit *</label>
            <select
              name="id_unit"
              required
              value={formData.id_unit}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border py-2 px-3"
            >
              <option value="">-- Pilih Unit Kosong --</option>
              {units.map((u) => (
                <option key={u.id_unit} value={u.id_unit}>
                  {u.kode_unit} (Rp {u.harga_sewa.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Pilih Penyewa *</label>
            <select
              name="id_penyewa"
              required
              value={formData.id_penyewa}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border py-2 px-3"
            >
              <option value="">-- Pilih Penyewa --</option>
              {penyewa.map((p) => (
                <option key={p.id_penyewa} value={p.id_penyewa}>
                  {p.nama} ({p.nik})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tanggal Masuk *</label>
              <input
                type="date"
                name="tanggal_masuk"
                required
                value={formData.tanggal_masuk}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border py-2 px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tanggal Jatuh Tempo (1-31) *</label>
              <input
                type="number"
                name="tanggal_jatuh_tempo"
                min="1"
                max="31"
                required
                value={formData.tanggal_jatuh_tempo}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border py-2 px-3"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Link
              href="/kontrak"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Kontrak'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
