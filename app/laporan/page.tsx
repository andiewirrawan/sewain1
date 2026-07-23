'use client';
import React, { useState, useEffect } from 'react';
import { formatTanggal, formatRupiah, safeValue } from '@/lib/format';
import { apiFetch } from '@/lib/api';
import { exportToExcel } from '@/lib/excel';
import Pagination from '@/components/Pagination';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  FileText, 
  Search, 
  Filter,
  PieChart,
  Wallet,
  Users,
  Clock,
  Home,
  LayoutDashboard,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';

const REPORT_TYPES = [
  { id: 'occupancy', label: 'Occupancy', icon: PieChart, color: 'text-purple-600', bg: 'bg-purple-100' },
  { id: 'pendapatan', label: 'Pendapatan', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { id: 'tunggakan', label: 'Tunggakan', icon: Clock, color: 'text-rose-600', bg: 'bg-rose-100' },
  { id: 'pembayaran', label: 'Pembayaran', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 'penyewa-aktif', label: 'Penyewa Aktif', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { id: 'riwayat-penyewa', label: 'Riwayat Penyewa', icon: History, color: 'text-slate-600', bg: 'bg-slate-100' },
  { id: 'kontrak', label: 'Kontrak', icon: LayoutDashboard, color: 'text-orange-600', bg: 'bg-orange-100' },
  { id: 'unit', label: 'Daftar Unit', icon: Home, color: 'text-cyan-600', bg: 'bg-cyan-100' },
];

export default function LaporanPage() {
  const [user, setUser] = useState<{ nama: string; role: string } | null>(null);
  const [jenis, setJenis] = useState('occupancy');
  const [bulan, setBulan] = useState('');
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [data, setData] = useState<any[] | null>(null);
  const [rawJson, setRawJson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const fetchLaporan = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const queryParams = new URLSearchParams({ 
        bulan, 
        tahun, 
        page: page.toString(), 
        limit: limit.toString() 
      });
      const res = await apiFetch(`/api/laporan/${jenis}?${queryParams.toString()}`);
      if (!res.ok) {
        if (res.status === 401) throw new Error('Unauthorized: Sesi anda telah habis. Silakan login kembali.');
        throw new Error(`Gagal mengambil data laporan (HTTP ${res.status})`);
      }
      const json = await res.json();
      
      let reportData = [];
      if (json.pagination) {
        reportData = json.data || [];
        setTotal(json.pagination.total);
        setTotalPages(json.pagination.total_pages);
      } else {
        reportData = Array.isArray(json) ? json : (json ? [json] : []);
        setTotal(reportData.length);
        setTotalPages(1);
      }
      
      setRawJson(reportData);
      
      // Flatten relations for display
      const flattenedData = reportData.map(item => {
          let flat: any = { ...item };
          const display: any = {};
          if (jenis === 'occupancy') {
            display['Jenis Unit'] = flat.jenis_unit;
            display['Total Unit'] = flat.total;
            display['Terisi'] = flat.terisi;
            display['Kosong'] = flat.kosong;
            display['Occupancy'] = `${Math.round((flat.total > 0 ? (flat.terisi / flat.total) : 0) * 100)}%`;
          } else if (jenis === 'pendapatan') {
            display['Tanggal Bayar'] = formatTanggal(flat.tanggal_bayar);
            display['Periode'] = flat.periode;
            display['Penyewa'] = typeof flat.penyewa === 'object' ? flat.penyewa?.nama : flat.penyewa;
            display['Unit'] = typeof flat.unit === 'object' ? flat.unit?.kode_unit : flat.unit;
            display['Nominal'] = formatRupiah(flat.nominal);
            display['Metode'] = flat.metode_pembayaran;
          } else if (jenis === 'tunggakan') {
            display['Penyewa'] = typeof flat.penyewa === 'object' ? flat.penyewa?.nama : flat.penyewa;
            display['Unit'] = typeof flat.unit === 'object' ? flat.unit?.kode_unit : flat.unit;
            display['Periode'] = flat.periode;
            display['Nominal'] = formatRupiah(flat.nominal);
            display['Jatuh Tempo'] = formatTanggal(flat.jatuh_tempo);
            display['Status'] = flat.status_pembayaran;
          } else if (jenis === 'pembayaran') {
            display['Periode'] = flat.periode;
            display['Penyewa'] = typeof flat.penyewa === 'object' ? flat.penyewa?.nama : flat.penyewa;
            display['Unit'] = typeof flat.unit === 'object' ? flat.unit?.kode_unit : flat.unit;
            display['Tanggal Bayar'] = formatTanggal(flat.tanggal_bayar);
            display['Nominal'] = formatRupiah(flat.nominal);
            display['Status'] = flat.status_pembayaran;
            display['Metode'] = flat.metode_pembayaran;
          } else if (jenis === 'penyewa-aktif') {
            display['Nama Penyewa'] = typeof flat.penyewa === 'object' ? flat.penyewa?.nama : (flat.penyewa || '-');
            display['WhatsApp'] = flat.whatsapp || flat.penyewa?.whatsapp || '-';
            display['Unit'] = typeof flat.unit === 'object' ? flat.unit?.kode_unit : (flat.unit || '-');
            display['Tanggal Masuk'] = formatTanggal(flat.tanggal_masuk);
            display['Status'] = flat.status_kontrak;
          } else if (jenis === 'riwayat-penyewa') {
            display['Nama Penyewa'] = typeof flat.penyewa === 'object' ? flat.penyewa?.nama : (flat.penyewa || '-');
            display['Unit'] = typeof flat.unit === 'object' ? flat.unit?.kode_unit : (flat.unit || '-');
            display['Tanggal Masuk'] = formatTanggal(flat.tanggal_masuk);
            display['Tanggal Keluar'] = formatTanggal(flat.tanggal_keluar);
            display['Status'] = flat.status_kontrak;
          } else if (jenis === 'kontrak') {
            display['No Kontrak'] = flat.nomor_kontrak;
            display['Penyewa'] = typeof flat.penyewa === 'object' ? flat.penyewa?.nama : (flat.penyewa || '-');
            display['Unit'] = typeof flat.unit === 'object' ? flat.unit?.kode_unit : (flat.unit || '-');
            display['Masuk'] = formatTanggal(flat.tanggal_masuk);
            display['Keluar'] = formatTanggal(flat.tanggal_keluar);
            display['Status'] = flat.status_kontrak;
          } else if (jenis === 'unit') {
            display['Unit'] = flat.unit || flat.kode_unit;
            display['Jenis'] = flat.jenis_unit;
            display['Tarif'] = formatRupiah(flat.harga_sewa);
            display['Status'] = flat.status_unit;
            display['Penyewa Saat Ini'] = flat.penyewa || '-';
          }
          return display;
      });
      setData(flattenedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    setPage(1); 
  }, [jenis, bulan, tahun, limit]);

  useEffect(() => { 
    fetchLaporan(); 
  }, [jenis, bulan, tahun, page, limit]);

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({ 
        bulan, 
        tahun, 
        no_pagination: 'true' 
      });
      const res = await apiFetch(`/api/laporan/${jenis}?${queryParams.toString()}`);
      const exportJson = await res.json();
      
      const reportLabel = REPORT_TYPES.find(r => r.id === jenis)?.label || jenis;
      const dateStr = new Date().toISOString().split('T')[0];
      const periodStr = bulan ? `${bulan}-${tahun}` : tahun;
      
      let excelHeaders: any[] = [];
      let excelData = exportJson.map((item: any) => {
        let flat: any = { ...item };
        if (typeof flat.unit === 'object' && flat.unit !== null) flat.unit = flat.unit.kode_unit;
        if (typeof flat.penyewa === 'object' && flat.penyewa !== null) {
          flat.whatsapp = flat.penyewa.whatsapp;
          flat.penyewa = flat.penyewa.nama;
        }
        if (flat.kontrak_sewa) {
          const k = flat.kontrak_sewa;
          flat.unit = k.unit?.kode_unit;
          flat.penyewa = k.penyewa?.nama;
          flat.whatsapp = k.penyewa?.whatsapp;
          flat.jatuh_tempo = k.tanggal_jatuh_tempo;
        }
        return flat;
      });

      let summary: any[] = [];

      if (jenis === 'occupancy') {
        excelHeaders = [
          { header: 'Jenis Unit', key: 'jenis_unit' },
          { header: 'Total Unit', key: 'total' },
          { header: 'Terisi', key: 'terisi' },
          { header: 'Kosong', key: 'kosong' },
        ];
        const total = excelData.reduce((s: number, i: any) => s + i.total, 0);
        const terisi = excelData.reduce((s: number, i: any) => s + i.terisi, 0);
        summary = [
          { label: 'Total Unit', value: total },
          { label: 'Total Terisi', value: terisi },
          { label: 'Persentase', value: `${Math.round((terisi / total) * 100)}%` }
        ];
      } else if (jenis === 'pendapatan') {
        excelHeaders = [
          { header: 'Tanggal Bayar', key: 'tanggal_bayar', isDate: true },
          { header: 'Periode', key: 'periode' },
          { header: 'Penyewa', key: 'penyewa' },
          { header: 'Unit', key: 'unit' },
          { header: 'Nominal', key: 'nominal', isCurrency: true },
          { header: 'Metode', key: 'metode_pembayaran' },
        ];
        const total = excelData.reduce((s: number, i: any) => s + (i.nominal || 0), 0);
        summary = [{ label: 'Total Pendapatan', value: total, isCurrency: true }];
      } else if (jenis === 'tunggakan') {
        excelHeaders = [
          { header: 'Penyewa', key: 'penyewa' },
          { header: 'Unit', key: 'unit' },
          { header: 'Periode', key: 'periode' },
          { header: 'Nominal', key: 'nominal', isCurrency: true },
          { header: 'Jatuh Tempo', key: 'jatuh_tempo', isDate: true },
          { header: 'Status', key: 'status_pembayaran' },
        ];
        const total = excelData.reduce((s: number, i: any) => s + (i.nominal || 0), 0);
        summary = [
          { label: 'Jumlah Tunggakan', value: excelData.length },
          { label: 'Total Nominal', value: total, isCurrency: true }
        ];
      } else if (jenis === 'pembayaran') {
        excelHeaders = [
          { header: 'Periode', key: 'periode' },
          { header: 'Penyewa', key: 'penyewa' },
          { header: 'Unit', key: 'unit' },
          { header: 'Tanggal Bayar', key: 'tanggal_bayar', isDate: true },
          { header: 'Nominal', key: 'nominal', isCurrency: true },
          { header: 'Status', key: 'status_pembayaran' },
          { header: 'Metode', key: 'metode_pembayaran' },
        ];
        const total = excelData.reduce((s: number, i: any) => s + (i.nominal || 0), 0);
        summary = [{ label: 'Total Pembayaran', value: total, isCurrency: true }];
      } else if (jenis === 'penyewa-aktif') {
        excelHeaders = [
          { header: 'Nama Penyewa', key: 'penyewa' },
          { header: 'WhatsApp', key: 'whatsapp' },
          { header: 'Unit', key: 'unit' },
          { header: 'Tanggal Masuk', key: 'tanggal_masuk', isDate: true },
          { header: 'Status', key: 'status_kontrak' },
        ];
        summary = [{ label: 'Total Penyewa Aktif', value: excelData.length }];
      } else if (jenis === 'riwayat-penyewa') {
        excelHeaders = [
          { header: 'Nama Penyewa', key: 'penyewa' },
          { header: 'Unit', key: 'unit' },
          { header: 'Tanggal Masuk', key: 'tanggal_masuk', isDate: true },
          { header: 'Tanggal Keluar', key: 'tanggal_keluar', isDate: true },
          { header: 'Status', key: 'status_kontrak' },
        ];
      } else if (jenis === 'kontrak') {
        excelHeaders = [
          { header: 'No Kontrak', key: 'nomor_kontrak' },
          { header: 'Penyewa', key: 'penyewa' },
          { header: 'Unit', key: 'unit' },
          { header: 'Tanggal Masuk', key: 'tanggal_masuk', isDate: true },
          { header: 'Tanggal Keluar', key: 'tanggal_keluar', isDate: true },
          { header: 'Status', key: 'status_kontrak' },
        ];
        summary = [{ label: 'Total Kontrak', value: excelData.length }];
      } else if (jenis === 'unit') {
        excelHeaders = [
          { header: 'Unit', key: 'unit' },
          { header: 'Jenis Unit', key: 'jenis_unit' },
          { header: 'Tarif Sewa', key: 'harga_sewa' },
          { header: 'Status', key: 'status_unit' },
          { header: 'Penyewa Saat Ini', key: 'penyewa' },
        ];
        summary = [{ label: 'Total Unit', value: excelData.length }];
      }

      await exportToExcel({
        title: `Laporan ${reportLabel}`,
        reportType: reportLabel,
        period: periodStr,
        userName: user?.nama || 'Admin',
        data: excelData,
        headers: excelHeaders,
        summary,
        fileName: `Laporan_${reportLabel.replace(' ', '_')}_${dateStr}`
      });
    } catch (err: any) {
      alert(`Gagal export: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderSummary = () => {
    if (!data || data.length === 0) return null;
    
    if (jenis === 'occupancy') {
        const totalUnit = data.reduce((sum, item) => sum + (item['Total Unit'] || 0), 0);
        const terisi = data.reduce((sum, item) => sum + (item['Terisi'] || 0), 0);
        const kosong = data.reduce((sum, item) => sum + (item['Kosong'] || 0), 0);
        const percent = totalUnit > 0 ? Math.round((terisi / totalUnit) * 100) : 0;
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard label="Total Unit" value={totalUnit} icon={Home} color="blue" />
                <SummaryCard label="Terisi" value={terisi} icon={Users} color="emerald" />
                <SummaryCard label="Kosong" value={kosong} icon={Home} color="slate" />
                <SummaryCard label="Occupancy" value={`${percent}%`} icon={PieChart} color="purple" />
            </div>
        );
    }
    
    // For other reports, we might want the total across all data (not just the current page)
    // But for simplicity in this summary view, we'll show the current page summary or total from API if available
    
    if (jenis === 'pendapatan' || jenis === 'pembayaran' || jenis === 'tunggakan') {
        return (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <LayoutDashboard size={24} />
                </div>
                <div>
                <div className="text-sm font-medium text-slate-500">Total Records</div>
                <div className="text-2xl font-bold text-slate-800">{total}</div>
                </div>
            </div>
        );
    }

    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <LayoutDashboard size={24} />
        </div>
        <div>
          <div className="text-sm font-medium text-slate-500">Total Data</div>
          <div className="text-2xl font-bold text-slate-800">{total}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Laporan</h1>
          <p className="text-slate-500 mt-1">Analisis data operasional dan keuangan property</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchLaporan} 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw size={18} className={cn(loading && "animate-spin")} />
            Refresh
          </button>
          <button 
            onClick={handleExportExcel}
            disabled={!data || data.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-30 disabled:shadow-none active:scale-95"
          >
            <FileSpreadsheet size={18} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block ml-1">Jenis Laporan</label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-1 gap-2">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setJenis(type.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                    jenis === type.id 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.02]" 
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <type.icon size={18} className={jenis === type.id ? "text-white" : type.color} />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="flex flex-wrap items-end gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block ml-1">Filter Periode</label>
                <div className="flex items-center gap-2">
                  {(jenis === 'pendapatan' || jenis === 'pembayaran') && (
                    <input 
                      type="text" 
                      placeholder="MM (07)" 
                      value={bulan} 
                      onChange={e => setBulan(e.target.value)} 
                      className="w-24 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  )}
                  <input 
                    type="text" 
                    placeholder="YYYY (2026)" 
                    value={tahun} 
                    onChange={e => setTahun(e.target.value)} 
                    className="w-32 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                  <div className="text-[10px] text-slate-400 italic max-w-[200px]">
                    Kosongkan bulan untuk melihat laporan tahunan.
                  </div>
                </div>
              </div>
            </div>

            {renderSummary()}

            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm min-h-[400px] flex flex-col">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-slate-500 font-medium animate-pulse">Menyiapkan laporan...</p>
                </div>
              ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="p-4 bg-rose-50 text-rose-600 rounded-full">
                    <Filter size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Gagal Memuat Laporan</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">{error}</p>
                  </div>
                  <button onClick={fetchLaporan} className="px-6 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all">
                    Coba Lagi
                  </button>
                </div>
              ) : !data || data.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="p-4 bg-slate-50 text-slate-400 rounded-full">
                    <Search size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Tidak Ada Data</h3>
                    <p className="text-slate-500 text-sm">Coba ubah periode atau jenis laporan lain.</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest w-12">No</th>
                        {Object.keys(data[0]).map((key) => (
                          <th key={key} className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.map((item, i) => (
                        <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-6 py-4 text-slate-400 font-medium">{i + 1}</td>
                          {Object.values(item).map((val: any, j) => (
                            <td key={j} className="px-6 py-4 text-slate-600 font-medium group-hover:text-slate-900">
                              {safeValue(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {jenis !== 'occupancy' && data && data.length > 0 && (
              <div className="mt-4">
                <Pagination 
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  limit={limit}
                  onLimitChange={setLimit}
                  total={total}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, full }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-50 text-slate-600',
    purple: 'bg-purple-50 text-purple-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className={cn(
      "bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 transition-all hover:shadow-md",
      full && "w-full"
    )}>
      <div className={cn("p-3 rounded-2xl", colors[color] || colors.blue)}>
        <Icon size={24} />
      </div>
      <div>
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{label}</div>
        <div className="text-2xl font-bold text-slate-800 leading-tight mt-0.5">{value}</div>
      </div>
    </div>
  );
}
