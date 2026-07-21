'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Trash2, Eye, FileText, ChevronRight } from 'lucide-react';
import { formatTanggal } from '@/lib/format';

export default function KontrakPage() {
  const router = useRouter();
  const [kontrak, setKontrak] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    fetchKontrak();
    const role = localStorage.getItem('role') || 'Admin';
    setUserRole(role);
  }, []);

  const fetchKontrak = async () => {
    try {
      const res = await fetch('/api/kontrak');
      if (!res.ok) throw new Error('Gagal mengambil data kontrak');
      const data = await res.json();
      setKontrak(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Yakin ingin menghapus kontrak ini?')) return;

    try {
      const res = await fetch(`/api/kontrak/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Gagal menghapus kontrak');
        return;
      }
      fetchKontrak();
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menghapus');
    }
  };

  const filteredKontrak = kontrak.filter((k) => {
    const matchSearch = k.nomor_kontrak.toLowerCase().includes(search.toLowerCase()) || 
                        k.penyewa?.nama.toLowerCase().includes(search.toLowerCase()) ||
                        k.unit?.kode_unit.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'Semua' ? true : k.status_kontrak === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Data Kontrak Sewa</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola perjanjian sewa unit dan penyewa</p>
        </div>
        <Link
          href="/kontrak/tambah"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Kontrak Baru
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
          <div className="relative rounded-md shadow-sm flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
              placeholder="Cari no kontrak, penyewa, atau unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Selesai">Selesai</option>
            <option value="Diputus">Diputus</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No Kontrak
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Penyewa
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredKontrak.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Tidak ada data kontrak
                  </td>
                </tr>
              ) : (
                filteredKontrak.map((k) => (
                  <tr 
                    key={k.id_kontrak} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/kontrak/${k.id_kontrak}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <FileText className="h-4 w-4 mr-2 text-gray-400" />
                        {k.nomor_kontrak}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{k.penyewa?.nama}</div>
                      <div className="text-xs text-gray-500">{k.penyewa?.whatsapp}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{k.unit?.kode_unit}</div>
                      
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Masuk: {formatTanggal(k.tanggal_masuk)}</div>
                      <div className="text-xs text-gray-500">Keluar: {k.tanggal_keluar ? formatTanggal(k.tanggal_keluar) : '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        k.status_kontrak === 'Aktif' ? 'bg-green-100 text-green-800' : 
                        k.status_kontrak === 'Selesai' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {k.status_kontrak}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {userRole === 'Owner' && (
                          <button
                            onClick={(e) => handleDelete(e, k.id_kontrak)}
                            className="text-red-600 hover:text-red-900 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <ChevronRight className="h-5 w-5 text-gray-400" />
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
