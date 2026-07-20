'use client';
import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function LaporanPage() {
  const [jenis, setJenis] = useState('occupancy');
  const [data, setData] = useState<any[]>([]);

  const fetchLaporan = async () => {
    const res = await fetch(`/api/laporan/${jenis}`);
    const json = await res.json();
    setData(json);
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
        <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}
