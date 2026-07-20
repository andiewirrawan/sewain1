'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  CreditCard, 
  Calendar, 
  User, 
  Building2, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Printer
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '@/lib/format';

export default function PembayaranDetail() {
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/pembayaran/${params.id}`);
        if (!res.ok) throw new Error('Gagal mengambil detail pembayaran');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchDetail();
  }, [params.id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat detail...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Data tidak ditemukan</div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Lunas':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2"><CheckCircle2 size={16}/> Lunas</span>;
      case 'Belum Bayar':
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2"><AlertCircle size={16}/> Belum Bayar</span>;
      case 'Terlambat':
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2"><Clock size={16}/> Terlambat</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Kembali
        </button>
        <button 
          onClick={() => window.print()}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
        >
          <Printer className="w-4 h-4 mr-2" />
          Cetak Kuitansi
        </button>
      </div>

      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        <div className="bg-slate-900 p-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Kuitansi Pembayaran</h2>
              <p className="text-slate-400 mt-2">Periode Sewa: <span className="text-white font-medium">{data.periode}</span></p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400 uppercase tracking-widest font-semibold">Status</div>
              <div className="mt-2 inline-block">
                {getStatusBadge(data.status_pembayaran)}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Info Utama */}
          <div className="space-y-8">
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                <CreditCard size={14} className="mr-2"/> Rincian Pembayaran
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-50">
                  <span className="text-gray-500">Nominal Bayar</span>
                  <span className="text-2xl font-bold text-gray-900">{formatRupiah(data.nominal)}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-50">
                  <span className="text-gray-500">Tanggal Bayar</span>
                  <span className="font-medium">{formatTanggal(data.tanggal_bayar)}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-50">
                  <span className="text-gray-500">Metode</span>
                  <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-700 text-sm">{data.metode_pembayaran}</span>
                </div>
                <div className="pt-2">
                  <span className="text-gray-500 block mb-2">Catatan</span>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg text-sm italic">
                    {data.catatan || 'Tidak ada catatan.'}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Info Terkait */}
          <div className="space-y-8">
            <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center">
                <FileText size={14} className="mr-2"/> Informasi Kontrak
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <User size={16}/>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600/70 font-semibold uppercase">Penyewa</p>
                    <p className="font-bold text-gray-900">{data.kontrak_sewa?.penyewa?.nama}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <Building2 size={16}/>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600/70 font-semibold uppercase">Unit</p>
                    <p className="font-bold text-gray-900">{data.kontrak_sewa?.unit?.kode_unit} - {data.kontrak_sewa?.unit?.nomor_unit}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-blue-200 mt-4">
                  <p className="text-sm text-blue-800">No. Kontrak: <span className="font-mono font-bold">{data.kontrak_sewa?.nomor_kontrak}</span></p>
                </div>
              </div>
            </section>

            <div className="text-center p-8 border-2 border-dashed border-gray-100 rounded-2xl">
              <p className="text-sm text-gray-400">Pembayaran ini telah dicatat dalam sistem pada {new Date(data.tanggal_bayar).toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
