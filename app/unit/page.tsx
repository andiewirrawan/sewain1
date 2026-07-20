'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Trash2, Edit, Eye } from 'lucide-react';
import { formatRupiah } from '@/lib/format';

export default function UnitPage() {
  const router = useRouter();
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kategori, setKategori] = useState('Semua');
  const [status, setStatus] = useState('Semua');
  const [user, setUser] = useState<{ role: string } | null>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      try { return storedUser ? JSON.parse(storedUser) : null; } catch(e) { return null; }
    }
    return null;
  });

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/unit?kategori=${kategori}&status_unit=${status}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      setUnits(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kategori, status]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Apakah Anda yakin ingin menghapus unit ini?')) return;

    try {
      const res = await fetch(`/api/unit/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.ok) {
        fetchUnits();
      } else {
        const error = await res.json();
        alert(error.message || 'Gagal menghapus unit');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Kosong': return 'bg-emerald-100 text-emerald-700';
      case 'Terisi': return 'bg-blue-100 text-blue-700';
      case 'Booking': return 'bg-amber-100 text-amber-700';
      case 'Renovasi': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Master Unit</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola data unit properti yang disewakan</p>
        </div>
        <Link 
          href="/unit/tambah" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Tambah Unit
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
        <div className="space-y-1.5 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategori</label>
          <select 
            value={kategori} 
            onChange={(e) => setKategori(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="Semua">Semua Kategori</option>
            <option value="Kios">Kios</option>
            <option value="Stand">Stand</option>
            <option value="Kos AC">Kos AC</option>
            <option value="Kos Non-AC">Kos Non-AC</option>
            <option value="Ruko">Ruko</option>
            <option value="Gudang">Gudang</option>
          </select>
        </div>
        <div className="space-y-1.5 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</label>
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="Semua">Semua Status</option>
            <option value="Kosong">Kosong</option>
            <option value="Terisi">Terisi</option>
            <option value="Booking">Booking</option>
            <option value="Renovasi">Renovasi</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Kode Unit</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold">Jenis</th>
                <th className="px-6 py-4 font-semibold">Harga Sewa</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Penyewa Aktif</th>
                <th className="px-6 py-4 font-semibold">Jatuh Tempo</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">Memuat data...</td>
                </tr>
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">Tidak ada data unit.</td>
                </tr>
              ) : (
                units.map((unit) => (
                  <tr 
                    key={unit.id_unit} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/unit/${unit.id_unit}`)}
                  >
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700">{unit.kode_unit}</td>
                    <td className="px-6 py-4 text-slate-600">{unit.kategori}</td>
                    <td className="px-6 py-4 text-slate-600">{unit.jenis_unit}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{formatRupiah(unit.harga_sewa)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${statusColor(unit.status_unit)}`}>
                        {unit.status_unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{unit.penyewa_aktif || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{unit.jatuh_tempo ? `Tgl ${unit.jatuh_tempo}` : '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push(`/unit/${unit.id_unit}/edit`); }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        {user?.role === 'Owner' && (
                          <button 
                            onClick={(e) => handleDelete(unit.id_unit, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
