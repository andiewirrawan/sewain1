'use client';
import React, { useState, useEffect } from 'react';

export default function LaporanPage() {
  const [jenis, setJenis] = useState('occupancy');
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLaporan = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/laporan/${jenis}`);
      if (!res.ok) throw new Error('Gagal mengambil data laporan');
      const json = await res.json();
      setData(Array.isArray(json) ? json : (json ? [json] : []));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLaporan(); }, [jenis]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Laporan</h1>
      <select value={jenis} onChange={(e) => setJenis(e.target.value)} className="p-2 border rounded">
        <option value="occupancy">Occupancy</option>
        <option value="pendapatan">Pendapatan</option>
        <option value="tunggakan">Tunggakan</option>
        <option value="pembayaran">Pembayaran</option>
        <option value="penyewa-aktif">Penyewa Aktif</option>
        <option value="riwayat-penyewa">Riwayat Penyewa</option>
      </select>
      
      <div className="flex gap-2">
        <a href={`/api/laporan/${jenis}/export?format=excel`} className="bg-emerald-600 text-white px-4 py-2 rounded">Export Excel</a>
        <a href={`/api/laporan/${jenis}/export?format=pdf`} className="bg-rose-600 text-white px-4 py-2 rounded">Export PDF</a>
      </div>

      <div className="bg-white p-4 rounded shadow">
        {loading && <p>Memuat data...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {!loading && !error && (!data || data.length === 0) && <p>Belum ada data</p>}
        {!loading && !error && data && data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(data[0]).map((key) => (
                    <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item, i) => (
                  <tr key={i}>
                    {Object.values(item).map((val: any, j) => (
                      <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</td>
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
