'use client';
import React, { useState, useEffect } from 'react';
import { formatTanggal, formatRupiah } from '@/lib/format';
import { apiFetch } from '@/lib/api';

export default function LaporanPage() {
  const [jenis, setJenis] = useState('occupancy');
  const [bulan, setBulan] = useState('');
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLaporan = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const query = new URLSearchParams({ bulan, tahun }).toString();
      const res = await apiFetch(`/api/laporan/${jenis}?${query}`);
      if (!res.ok) {
        if (res.status === 401) throw new Error('Unauthorized: Sesi anda telah habis. Silakan login kembali.');
        throw new Error(`Gagal mengambil data laporan (HTTP ${res.status})`);
      }
      const json = await res.json();
      setData(Array.isArray(json) ? json : (json ? [json] : []));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLaporan(); }, [jenis, bulan, tahun]);

  const renderSummary = () => {
    if (!data || data.length === 0) return null;
    
    if (jenis === 'occupancy') {
        const totalUnit = data.reduce((sum, item) => sum + item.total, 0);
        const terisi = data.reduce((sum, item) => sum + item.terisi, 0);
        const kosong = data.reduce((sum, item) => sum + item.kosong, 0);
        const percent = totalUnit > 0 ? Math.round((terisi / totalUnit) * 100) : 0;
        return (
            <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-4 rounded shadow">Total Unit: {totalUnit}</div>
                <div className="bg-white p-4 rounded shadow">Terisi: {terisi}</div>
                <div className="bg-white p-4 rounded shadow">Kosong: {kosong}</div>
                <div className="bg-white p-4 rounded shadow">Occupancy: {percent}%</div>
            </div>
        );
    }
    
    if (jenis === 'pendapatan') {
        const total = data.reduce((sum, item) => sum + (item.nominal || 0), 0);
        return <div className="bg-white p-4 rounded shadow mb-4">Total Pendapatan: {formatRupiah(total)}</div>;
    }

    if (jenis === 'tunggakan') {
        const totalNominal = data.reduce((sum, item) => sum + (item.nominal || 0), 0);
        return (
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-4 rounded shadow">Jumlah Tunggakan: {data.length}</div>
                <div className="bg-white p-4 rounded shadow">Total Nominal: {formatRupiah(totalNominal)}</div>
            </div>
        );
    }

    return <div className="bg-white p-4 rounded shadow mb-4">Total Data: {data.length}</div>;
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Laporan</h1>
      <div className="flex gap-4 items-center">
        <select value={jenis} onChange={(e) => setJenis(e.target.value)} className="p-2 border rounded">
            <option value="occupancy">Occupancy</option>
            <option value="pendapatan">Pendapatan</option>
            <option value="tunggakan">Tunggakan</option>
            <option value="pembayaran">Pembayaran</option>
            <option value="penyewa-aktif">Penyewa Aktif</option>
            <option value="riwayat-penyewa">Riwayat Penyewa</option>
            <option value="kontrak">Kontrak</option>
            <option value="unit">Unit</option>
        </select>
        {(jenis === 'pendapatan') && (
            <>
                <input type="text" placeholder="Bulan (07)" value={bulan} onChange={e => setBulan(e.target.value)} className="p-2 border rounded" />
                <input type="text" placeholder="Tahun (2026)" value={tahun} onChange={e => setTahun(e.target.value)} className="p-2 border rounded" />
            </>
        )}
        <button onClick={fetchLaporan} className="bg-blue-600 text-white px-4 py-2 rounded">Refresh</button>
      </div>
      
      {renderSummary()}

      <div className="bg-white p-4 rounded shadow">
        {loading && <p>Memuat data...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {!loading && !error && (!data || data.length === 0) && <p>Belum ada data.</p>}
        {!loading && !error && data && data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(data[0]).map((key) => (
                    <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{key.replace('_', ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item, i) => (
                  <tr key={i}>
                    {Object.entries(item).map(([key, val]: any, j) => (
                      <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
