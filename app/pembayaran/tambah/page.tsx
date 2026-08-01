'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  CreditCard, 
  Calendar, 
  User, 
  Info,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { formatRupiahString, parseRupiahString } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { formatRupiah } from '@/lib/format';

export default function TambahPembayaranFIFO() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [penyewaList, setPenyewaList] = useState<any[]>([]);
  const [tagihanTertunggak, setTagihanTertunggak] = useState<any[]>([]);
  const [loadingTagihan, setLoadingTagihan] = useState(false);
  
  const [formData, setFormData] = useState({
    id_penyewa: '',
    id_kontrak: '',
    tanggal_bayar: new Date().toISOString().split('T')[0],
    periode: (new Date().getMonth() + 1).toString().padStart(2, '0') + '-' + new Date().getFullYear(),
    nominal: '',
    status_pembayaran: 'Lunas',
    metode_pembayaran: 'Transfer',
    catatan: ''
  });

  useEffect(() => {
    fetchPenyewa();
  }, []);

  const fetchPenyewa = async () => {
    try {
      const res = await apiFetch('/api/penyewa?limit=1000');
      const json = await res.json();
      setPenyewaList(json.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePenyewaChange = async (id: string) => {
    const selectedPenyewa = penyewaList.find(p => p.id_penyewa === id);
    setFormData(prev => ({ ...prev, id_penyewa: id, id_kontrak: '' }));
    if (id && selectedPenyewa) {
      try {
        setLoadingTagihan(true);
        // Find active contract
        const resKontrak = await apiFetch(`/api/kontrak?status=Aktif&search=${encodeURIComponent(selectedPenyewa.nama)}`);
        const jsonKontrak = await resKontrak.json();
        const activeContract = jsonKontrak.data?.find((k: any) => k.penyewa?.id_penyewa === id);
        if (activeContract) {
            setFormData(prev => ({ ...prev, id_kontrak: activeContract.id_kontrak }));
        }

        const res = await apiFetch(`/api/tagihan?id_penyewa=${id}&status=Belum Bayar`);
        const data = await res.json();
        // Also fetch 'Sebagian'
        const res2 = await apiFetch(`/api/tagihan?id_penyewa=${id}&status=Sebagian`);
        const data2 = await res2.json();
        
        const allUnpaid = [...data, ...data2].sort((a, b) => {
          const [ma, ya] = a.periode.split('-');
          const [mb, yb] = b.periode.split('-');
          return `${ya}-${ma}`.localeCompare(`${yb}-${mb}`);
        });
        setTagihanTertunggak(allUnpaid);
        
        // Auto-fill nominal with total debt if any
        const totalDebt = allUnpaid.reduce((acc, curr) => acc + (curr.total_tagihan - curr.terbayar), 0);
        if (totalDebt > 0) {
          setFormData(prev => ({ ...prev, nominal: totalDebt.toString() }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTagihan(false);
      }
    } else {
      setTagihanTertunggak([]);
    }
  };

  const handleTanggalBayarChange = (dateStr: string) => {
    // Sync periode automatically when tanggal_bayar changes (format: MM-YYYY)
    const [year, month] = dateStr.split('-');
    const newPeriode = `${month}-${year}`;
    setFormData({ ...formData, tanggal_bayar: dateStr, periode: newPeriode });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug log for payload audit
    console.log('Submitting Payment Payload:', formData);

    if (!formData.id_penyewa || !formData.id_kontrak || !formData.nominal || !formData.periode) {
      alert('Mohon lengkapi data wajib: Penyewa, Kontrak, Nominal, dan Periode');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/pembayaran', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Gagal menyimpan pembayaran');
      }
      router.push('/pembayaran');
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button 
        onClick={() => router.back()}
        className="flex items-center text-slate-500 hover:text-slate-900 transition-colors font-medium"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Kembali
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden border border-slate-100">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CreditCard /> Input Pembayaran (FIFO)
              </h2>
              <p className="text-blue-100 text-sm mt-1">Dana akan otomatis dialokasikan ke tagihan tertua</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <User size={16} className="text-blue-600"/> Pilih Penyewa
                  </label>
                  <select
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all"
                    value={formData.id_penyewa}
                    onChange={(e) => handlePenyewaChange(e.target.value)}
                  >
                    <option value="">-- Pilih Penyewa --</option>
                    {penyewaList.map((p) => (
                      <option key={p.id_penyewa} value={p.id_penyewa}>
                        {p.nama} - {p.nik || 'No NIK'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <Calendar size={16} className="text-blue-600"/> Tanggal Bayar
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all"
                      value={formData.tanggal_bayar}
                      onChange={(e) => handleTanggalBayarChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <CreditCard size={16} className="text-blue-600"/> Nominal Bayar (Rp)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all font-bold text-xl text-blue-600"
                      placeholder="0"
                      value={formatRupiahString(formData.nominal)}
                      onChange={(e) => setFormData({ ...formData, nominal: parseRupiahString(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Metode Pembayaran</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['Transfer', 'Tunai', 'Debit', 'QRIS'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFormData({ ...formData, metode_pembayaran: m })}
                        className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                          formData.metode_pembayaran === m 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 text-slate-400">Catatan (Opsional)</label>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all h-24"
                    placeholder="Contoh: Titipan bapak X"
                    value={formData.catatan}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading || !formData.id_penyewa}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <Save size={24} />
                  {loading ? 'Memproses FIFO...' : 'Konfirmasi Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500" />
              Antrian Tagihan (FIFO)
            </h3>
            
            {loadingTagihan ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-2xl"></div>)}
              </div>
            ) : tagihanTertunggak.length > 0 ? (
              <div className="space-y-3">
                {tagihanTertunggak.map((t) => (
                  <div key={t.id_tagihan} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-900 text-sm">{t.periode}</span>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-500 uppercase">
                        {t.kontrak_sewa?.unit?.kode_unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="text-xs text-slate-500 font-medium">Sisa Tagihan:</div>
                      <div className="font-bold text-red-600 text-sm">{formatRupiah(t.total_tagihan - t.terbayar)}</div>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-dashed border-slate-200">
                  <div className="flex justify-between items-center text-slate-900">
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Total Piutang</span>
                    <span className="text-lg font-black">
                      {formatRupiah(tagihanTertunggak.reduce((acc, curr) => acc + (curr.total_tagihan - curr.terbayar), 0))}
                    </span>
                  </div>
                </div>
              </div>
            ) : formData.id_penyewa ? (
              <div className="text-center py-8">
                <div className="bg-green-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="text-green-600" size={24} />
                </div>
                <p className="text-sm font-bold text-slate-900">Lunas</p>
                <p className="text-xs text-slate-500">Penyewa ini tidak memiliki tagihan tertunggak</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Info className="text-slate-200 mx-auto mb-2" size={32} />
                <p className="text-xs text-slate-400">Pilih penyewa untuk melihat daftar tagihan</p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
            <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-2">
              <Info size={16} /> Cara Kerja FIFO
            </h4>
            <p className="text-xs text-blue-700 leading-relaxed">
              Pembayaran akan melunasi tagihan paling lama terlebih dahulu. 
              Jika nominal melebihi satu tagihan, sisanya akan dialokasikan ke tagihan berikutnya secara otomatis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
