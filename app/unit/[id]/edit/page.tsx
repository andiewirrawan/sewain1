'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { formatRupiahString, parseRupiahString } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

export default function EditUnitPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    kode_unit: '',
    jenis_unit: 'Kios',
    harga_sewa: '',
    status_unit: 'Kosong'
  });

  useEffect(() => {
    fetchUnit();
  }, [id]);

  const fetchUnit = async () => {
    try {
      const res = await apiFetch(`/api/unit/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          kode_unit: data.kode_unit,
          jenis_unit: data.jenis_unit,
          harga_sewa: data.harga_sewa.toString(),
          status_unit: data.status_unit
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name === 'harga_sewa') {
      setFormData({ ...formData, [e.target.name]: parseRupiahString(e.target.value) });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        harga_sewa: Number(formData.harga_sewa)
      };

      const res = await apiFetch(`/api/unit/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        router.push(`/unit/${id}`);
      } else {
        const error = await res.json();
        alert(error.message || 'Gagal mengubah unit');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 text-center text-slate-500">Memuat data...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/unit/${id}`} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Edit Unit</h2>
          <p className="text-slate-500 text-sm mt-1">Ubah informasi detail unit properti</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Kode Unit</label>
              <input 
                type="text" 
                name="kode_unit"
                required
                value={formData.kode_unit}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Jenis Unit</label>
              <select 
                name="jenis_unit"
                value={formData.jenis_unit}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="Kios">Kios</option>
                <option value="Stand">Stand</option>
                <option value="Kos AC">Kos AC</option>
                <option value="Kos Non-AC">Kos Non-AC</option>
                <option value="Ruko">Ruko</option>
                <option value="Gudang">Gudang</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Harga Sewa (Rp)</label>
              <input 
                type="text" 
                inputMode="numeric"
                name="harga_sewa"
                required
                value={formatRupiahString(formData.harga_sewa)}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Status Awal</label>
              <select 
                name="status_unit"
                value={formData.status_unit}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="Kosong">Kosong</option>
                <option value="Terisi">Terisi</option>
                <option value="Booking">Booking</option>
                <option value="Renovasi">Renovasi</option>
              </select>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link 
              href={`/unit/${id}`}
              className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Batal
            </Link>
            <button 
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : (
                <>
                  <Save size={18} />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
