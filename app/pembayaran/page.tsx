'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '@/lib/format';

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export default function PembayaranPage() {
  const router = useRouter();
  const [pembayaran, setPembayaran] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    fetchPembayaran();
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserRole(user.role);
      } catch (e) {}
    }
  }, [selectedMonth, selectedYear, selectedStatus]);

  const fetchPembayaran = async () => {
    setLoading(true);
    try {
      let url = `/api/pembayaran?tahun=${selectedYear}`;
      if (selectedMonth) url += `&bulan=${selectedMonth}`;
      if (selectedStatus !== 'Semua') url += `&status=${selectedStatus}`;
      
      const token = localStorage.getItem('token');
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Gagal mengambil data pembayaran');
      const data = await res.json();
      setPembayaran(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Yakin ingin menghapus data pembayaran ini?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/pembayaran/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchPembayaran();
      } else {
        const data = await res.json();
        alert(data.message || 'Gagal menghapus');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan');
    }
  };

  const filteredData = pembayaran.filter((p) => {
    const searchLower = search.toLowerCase();
    const penyewaNama = p.kontrak_sewa?.penyewa?.nama?.toLowerCase() || '';
    const unitKode = p.kontrak_sewa?.unit?.kode_unit?.toLowerCase() || '';
    const periode = p.periode?.toLowerCase() || '';
    
    return penyewaNama.includes(searchLower) || unitKode.includes(searchLower) || periode.includes(searchLower);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Lunas':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Lunas
          </span>
        );
      case 'Belum Bayar':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Belum Bayar
          </span>
        );
      case 'Terlambat':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Terlambat
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Pembayaran</h1>
          <p className="text-sm text-gray-500 mt-1">Monitoring tagihan dan pembayaran sewa</p>
        </div>
        <Link
          href="/pembayaran/tambah"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Input Pembayaran
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari penyewa, unit, periode..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">Semua Bulan</option>
              {months.map((m, i) => (
                <option key={m} value={(i + 1).toString().padStart(2, '0')}>{m}</option>
              ))}
            </select>

            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {years.map((y) => (
                <option key={y} value={y.toString()}>{y}</option>
              ))}
            </select>

            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="Semua">Semua Status</option>
              <option value="Lunas">Lunas</option>
              <option value="Belum Bayar">Belum Bayar</option>
              <option value="Terlambat">Terlambat</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penyewa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tgl Bayar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nominal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metode</th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">Memuat data...</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">Tidak ada data pembayaran</td>
                </tr>
              ) : (
                filteredData.map((p) => (
                  <tr 
                    key={p.id_pembayaran} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/pembayaran/${p.id_pembayaran}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {p.periode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{p.kontrak_sewa?.penyewa?.nama}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {p.kontrak_sewa?.unit?.kode_unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTanggal(p.tanggal_bayar)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatRupiah(p.nominal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(p.status_pembayaran)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {p.metode_pembayaran}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {userRole === 'Owner' && (
                          <button
                            onClick={(e) => handleDelete(e, p.id_pembayaran)}
                            className="text-red-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
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
