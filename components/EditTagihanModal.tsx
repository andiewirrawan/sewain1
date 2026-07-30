'use client';

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatRupiah } from '@/lib/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tagihan: any;
  onSuccess?: () => void;
}

export default function EditTagihanModal({ isOpen, onClose, tagihan, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nominal_tagihan: tagihan?.nominal_tagihan || 0,
    nominal_diskon: tagihan?.nominal_diskon || 0,
    jatuh_tempo: tagihan?.jatuh_tempo || '',
    catatan: tagihan?.catatan || ''
  });

  useEffect(() => {
    if (tagihan) {
      setFormData({
        nominal_tagihan: tagihan.nominal_tagihan,
        nominal_diskon: tagihan.nominal_diskon,
        jatuh_tempo: tagihan.jatuh_tempo,
        catatan: tagihan.catatan || ''
      });
    }
  }, [tagihan]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/tagihan/${tagihan.id_tagihan}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          alasan_perubahan: 'Edit tagihan manual'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengedit tagihan');

      alert('Berhasil mengedit tagihan');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-900">Edit Tagihan</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Nominal Tagihan</label>
            <input 
              type="number"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
              value={formData.nominal_tagihan}
              onChange={(e) => setFormData({...formData, nominal_tagihan: parseFloat(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Diskon/Promo</label>
            <input 
              type="number"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
              value={formData.nominal_diskon}
              onChange={(e) => setFormData({...formData, nominal_diskon: parseFloat(e.target.value)})}
            />
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
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Catatan</label>
            <textarea 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
              value={formData.catatan}
              onChange={(e) => setFormData({...formData, catatan: e.target.value})}
            />
          </div>
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
            disabled={loading}
            className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}
