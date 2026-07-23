'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  CreditCard, 
  Calendar, 
  FileText, 
  User, 
  Building2 
} from 'lucide-react';
import { formatRupiahString, parseRupiahString } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

export default function TambahPembayaran() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [kontrakAktif, setKontrakAktif] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    id_kontrak: '',
    periode_bulan: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    periode_tahun: new Date().getFullYear().toString(),
    tanggal_bayar: new Date().toISOString().split('T')[0],
    nominal: '',
    status_pembayaran: 'Lunas',
    metode_pembayaran: 'Transfer',
    catatan: ''
  });

  useEffect(() => {
    fetchKontrak();
  }, []);

  const fetchKontrak = async () => {
    try {
      const res = await apiFetch('/api/kontrak?status=Aktif&limit=1000');
      if (!res.ok) throw new Error('Gagal mengambil data kontrak');
      const json = await res.json();
      setKontrakAktif(json.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleKontrakChange = (id: string) => {
    const selected = kontrakAktif.find(k => k.id_kontrak === id);
    if (selected) {
      setFormData({
        ...formData,
        id_kontrak: id,
        nominal: selected.unit?.harga_sewa?.toString() || ''
      });
    } else {
      setFormData({ ...formData, id_kontrak: id });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        periode: `${formData.periode_bulan}-${formData.periode_tahun}`,
        nominal: parseFloat(formData.nominal) || 0
      };
      
      // Remove temporary form fields
      const { periode_bulan, periode_tahun, ...submitData } = payload as any;
      submitData.periode = payload.periode;

      const res = await apiFetch('/api/pembayaran', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          },
        body: JSON.stringify(submitData)
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Gagal menyimpan pembayaran');
      }

      router.push('/pembayaran');
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' }, { value: '04', label: 'April' },
    { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' }, { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button 
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Kembali
      </button>

      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        <div className="bg-blue-600 p-6 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CreditCard /> Input Pembayaran Baru
          </h2>
          <p className="text-blue-100 text-sm mt-1">Catat pembayaran sewa dari penyewa aktif</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FileText size={16} className="text-blue-500"/> Pilih Kontrak Aktif
              </label>
              <select
                required
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.id_kontrak}
                onChange={(e) => handleKontrakChange(e.target.value)}
              >
                <option value="">-- Pilih Kontrak --</option>
                {kontrakAktif.map((k) => (
                  <option key={k.id_kontrak} value={k.id_kontrak}>
                    {k.nomor_kontrak} - {k.penyewa?.nama} ({k.unit?.kode_unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-blue-500"/> Periode Bulan
              </label>
              <select
                required
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.periode_bulan}
                onChange={(e) => setFormData({ ...formData, periode_bulan: e.target.value })}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-blue-500"/> Periode Tahun
              </label>
              <select
                required
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.periode_tahun}
                onChange={(e) => setFormData({ ...formData, periode_tahun: e.target.value })}
              >
                {years.map((y) => (
                  <option key={y} value={y.toString()}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-blue-500"/> Tanggal Bayar
              </label>
              <input
                type="date"
                required
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.tanggal_bayar}
                onChange={(e) => setFormData({ ...formData, tanggal_bayar: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <CreditCard size={16} className="text-blue-500"/> Nominal (Rp)
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Masukkan nominal"
                value={formatRupiahString(formData.nominal)}
                onChange={(e) => setFormData({ ...formData, nominal: parseRupiahString(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status Pembayaran</label>
              <select
                required
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.status_pembayaran}
                onChange={(e) => setFormData({ ...formData, status_pembayaran: e.target.value })}
              >
                <option value="Lunas">Lunas</option>
                <option value="Belum Bayar">Belum Bayar</option>
                <option value="Terlambat">Terlambat</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Metode Pembayaran</label>
              <select
                required
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.metode_pembayaran}
                onChange={(e) => setFormData({ ...formData, metode_pembayaran: e.target.value })}
              >
                <option value="Transfer">Transfer</option>
                <option value="Tunai">Tunai</option>
                <option value="Debit">Debit</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan</label>
              <textarea
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24"
                placeholder="Tambahkan catatan jika ada"
                value={formData.catatan}
                onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              ></textarea>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:bg-blue-300"
            >
              <Save size={20} />
              {loading ? 'Menyimpan...' : 'Simpan Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
