'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Trash2, Edit, ChevronRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatStatus } from '@/lib/format';
import Pagination from '@/components/Pagination';

export default function PenyewaPage() {
  const router = useRouter();
  const [penyewa, setPenyewa] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const role = localStorage.getItem('role') || 'Admin';
    setUserRole(role);
  }, []);

  const fetchPenyewa = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/penyewa?page=${page}&limit=${limit}&search=${search}`);
      if (!res.ok) throw new Error('Gagal mengambil data penyewa');
      const json = await res.json();
      setPenyewa(json.data || []);
      setTotal(json.pagination?.total || 0);
      setTotalPages(json.pagination?.total_pages || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, limit]);

  useEffect(() => {
    fetchPenyewa();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Yakin ingin menghapus penyewa ini?')) return;

    try {
      const res = await apiFetch(`/api/penyewa/${id}`, {
        method: 'DELETE',
        });
      
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.message || 'Gagal menghapus penyewa');
        return;
      }
      
      fetchPenyewa();
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menghapus');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Daftar Penyewa</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data penyewa dan kontrak aktif</p>
        </div>
        <Link
          href="/penyewa/tambah"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Penyewa
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="relative rounded-md shadow-sm max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
              placeholder="Cari nama, NIK, atau nomor WA..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIK
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WhatsApp
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis Usaha
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Saat Ini
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
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : penyewa.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Tidak ada data penyewa
                  </td>
                </tr>
              ) : (
                penyewa.map((p) => (
                  <tr 
                    key={p.id_penyewa} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/penyewa/${p.id_penyewa}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{p.nama}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 font-mono">{p.nik || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{p.whatsapp}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{p.jenis_usaha || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{p.unit_saat_ini}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatStatus(p.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/penyewa/${p.id_penyewa}/edit`);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {userRole === 'Owner' && (
                          <button
                            onClick={(e) => handleDelete(e, p.id_penyewa)}
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
