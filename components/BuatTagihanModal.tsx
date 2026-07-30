'use client';

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatRupiah } from '@/lib/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  kontrakId?: string;
  onSuccess?: () => void;
}

export default function BuatTagihanModal({ isOpen, onClose, kontrakId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedKontrakId, setSelectedKontrakId] = useState<string>(kontrakId || '');
  const [activeKontraks, setActiveKontraks] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    bulan: String(new Date().getMonth() + 1).padStart(2, '0'),
    tahun: String(new Date().getFullYear()),
    jatuh_tempo: ''
  });

  const months = [
    { v: '01', l: 'Januari' }, { v: '02', l: 'Februari' }, { v: '03', l: 'Maret' },
    { v: '04', l: 'April' }, { v: '05', l: 'Mei' }, { v: '06', l: 'Juni' },
    { v: '07', l: 'Juli' }, { v: '08', l: 'Agustus' }, { v: '09', l: 'September' },
    { v: '10', l: 'Oktober' }, { v: '11', l: 'November' }, { v: '12', l: 'Desember' }
  ];

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i - 1);

  const fetchActiveKontraks = async () => {
    try {
      const res = await apiFetch('/api/kontrak?status=Aktif');
      const data = await res.json();
      setActiveKontraks(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen && !kontrakId) {
      fetchActiveKontraks();
    }
    if (kontrakId) setSelectedKontrakId(kontrakId);
  }, [isOpen, kontrakId]);

  const fetchPreview = React.useCallback(async () => {
    if (!selectedKontrakId) return;
    try {
      setLoading(true);
      setError(null);
      const periode = `${formData.bulan}-${formData.tahun}`;
      const res = await apiFetch(`/api/tagihan/preview-single?id_kontrak=${selectedKontrakId}&periode=${periode}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memuat preview');
      
      setPreview(data);
      setFormData(prev => ({ ...prev, jatuh_tempo: data.jatuh_tempo }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedKontrakId, formData.bulan, formData.tahun]);

  useEffect(() => {
    if (isOpen && selectedKontrakId) {
      fetchPreview();
    } else {
      setPreview(null);
    }
  }, [isOpen, selectedKontrakId, fetchPreview]);

  const handleSubmit = async () => {
    if (!formData.jatuh_tempo || !selectedKontrakId) {
      alert('Data belum lengkap');
      return;
    }

    try {
      setSaving(true);
      const res = await apiFetch('/api/tagihan/generate-single', {
        method: 'POST',
        body: JSON.stringify({
          id_kontrak: selectedKontrakId,
          periode: `${formData.bulan}-${formData.tahun}`,
          jatuh_tempo: formData.jatuh_tempo,
          nominal_tagihan: preview.nominal_tagihan,
          id_promo: preview.promo?.id_promo,
          nominal_diskon: preview.nominal_diskon,
          total_tagihan: preview.total_tagihan
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal membuat tagihan');

      alert('Tagihan berhasil dibuat.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-900">Buat Tagihan Manual</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!kontrakId && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Pilih Kontrak Aktif</label>
              <select 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={selectedKontrakId}
                onChange={(e) => setSelectedKontrakId(e.target.value)}
              >
                <option value="">-- Pilih Kontrak --</option>
                {activeKontraks.map(k => (
                  <option key={k.id_kontrak} value={k.id_kontrak}>
                    {k.penyewa.nama} - {k.unit.kode_unit}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Bulan</label>
              <select 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={formData.bulan}
                onChange={(e) => setFormData({...formData, bulan: e.target.value})}
              >
                {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Tahun</label>
              <select 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={formData.tahun}
                onChange={(e) => setFormData({...formData, tahun: e.target.value})}
              >
                {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Tanggal Jatuh Tempo</label>
            <input 
              type="date"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
              value={formData.jatuh_tempo}
              onChange={(e) => setFormData({...formData, jatuh_tempo: e.target.value})}
            />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="animate-spin text-blue-600" size={24} />
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700">
              <AlertCircle size={20} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : preview ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Penyewa</span>
                  <span className="font-bold text-slate-900">{preview.kontrak.penyewa.nama}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Unit</span>
                  <span className="font-bold text-blue-600">{preview.kontrak.unit.kode_unit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Harga Sewa</span>
                  <span className="font-bold text-slate-900">{formatRupiah(preview.nominal_tagihan)}</span>
                </div>
                {preview.promo && (
                  <div className="flex justify-between items-center text-emerald-600 font-medium">
                    <span>Promo: {preview.promo.nama_promo}</span>
                    <span>- {formatRupiah(preview.nominal_diskon)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-base font-bold text-slate-900">Total Tagihan</span>
                  <span className="text-lg font-black text-blue-700">{formatRupiah(preview.total_tagihan)}</span>
                </div>
              </div>
              {preview.is_existing && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 text-amber-800">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-sm font-bold">Tagihan periode ini sudah dibuat.</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
          >
            Batal
          </button>
          <button 
            onClick={handleSubmit}
            disabled={saving || loading || !preview || preview?.is_existing}
            className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
            Konfirmasi & Buat
          </button>
        </div>
      </div>
    </div>
  );
}
