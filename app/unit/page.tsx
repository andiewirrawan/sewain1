'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import { formatRupiah, formatTanggal, formatStatus } from '@/lib/format';
import { apiFetch } from '@/lib/api';
import Pagination from '@/components/Pagination';

export default function UnitPage() {
  const router = useRouter();
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jenisUnit, setJenisUnit] = useState('Semua');
  const [status, setStatus] = useState('Semua');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [user, setUser] = useState<{ role: string } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
      } catch(e) { 
        return null; 
      }
    }
    return null;
  });

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/unit?jenis_unit=${jenisUnit}&status_unit=${status}&page=${page}&limit=${limit}&search=${search}`);
      const json = await res.json();
      setUnits(json.data || []);
      setTotal(json.pagination?.total || 0);
      setTotalPages(json.pagination?.total_pages || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1); // Reset to page 1 on filter/search change
  }, [jenisUnit, status, search, limit]);

  useEffect(() => {
    fetchUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, jenisUnit, status, search]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Apakah Anda yakin ingin menghapus unit ini?')) return;

    try {
      const res = await apiFetch(`/api/unit/${id}`, {
        method: 'DELETE',
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

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-end">
        <div className="space-y-1.5 w-full lg:flex-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cari Unit</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari berdasarkan kode unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <div className="space-y-1.5 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jenis Unit</label>
          <select 
            value={jenisUnit} 
            onChange={(e) => setJenisUnit(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="Semua">Semua Jenis</option>
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
                <th className="px-6 py-4 font-semibold">Jenis Unit</th>
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
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">Memuat data...</td>
                </tr>
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">Tidak ada data unit.</td>
                </tr>
              ) : (
                units.map((unit) => (
                  <tr 
                    key={unit.id_unit} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/unit/${unit.id_unit}`)}
                  >
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700">{unit.kode_unit}</td>
                    <td className="px-6 py-4 text-slate-600">{unit.jenis_unit}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{formatRupiah(unit.harga_sewa)}</td>
                    <td className="px-6 py-4">
                      {formatStatus(unit.status_unit)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{unit.penyewa_aktif || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{unit.jatuh_tempo ? formatTanggal(unit.jatuh_tempo) : '-'}</td>
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

        <Pagination 
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={setLimit}
          total={total}
        />
      </div>
    </div>
  );
}
