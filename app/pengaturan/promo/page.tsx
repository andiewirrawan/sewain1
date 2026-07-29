'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye,
  Power,
  PowerOff,
  Ticket,
  Users,
  Calendar,
  X,
  Check,
  History
} from 'lucide-react';
import Pagination from '@/components/Pagination';

export default function PromoPage() {
  const [, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [promos, setPromos] = useState<any[]>([]);
  const [penyewaList, setPenyewaList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const router = useRouter();

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<any>(null);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    nama_promo: '',
    jenis_diskon: 'Persen',
    nilai_diskon: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    status: 'Aktif',
    deskripsi: '',
    prioritas: '0',
    id_penyewa_list: [] as string[]
  });

  const [searchPenyewa, setSearchPenyewa] = useState('');

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/promo?page=${page}&limit=${limit}&search=${search}&status=${filterStatus}`);
      const data = await res.json();
      setPromos(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching promos:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filterStatus]);

  const fetchPenyewa = useCallback(async () => {
    try {
      const res = await apiFetch('/api/penyewa?limit=1000');
      const data = await res.json();
      setPenyewaList(data.data || []);
    } catch (err) {
      console.error('Error fetching penyewa:', err);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    
    if (parsedUser.role !== 'Owner') {
      router.push('/dashboard');
      return;
    }

    fetchPromos();
    fetchPenyewa();
  }, [router, fetchPromos, fetchPenyewa]);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/promo', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowAddModal(false);
        resetForm();
        fetchPromos();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Gagal membuat promo');
      }
    } catch {
      alert('Terjadi kesalahan');
    }
  };

  const handleUpdatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/promo/${editingPromo.id_promo}`, {
        method: 'PATCH',
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setEditingPromo(null);
        resetForm();
        fetchPromos();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Gagal update promo');
      }
    } catch {
      alert('Terjadi kesalahan');
    }
  };

  const handleDeletePromo = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await apiFetch(`/api/promo/${deleteConfirm.id_promo}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchPromos();
      }
    } catch {
      alert('Gagal menghapus');
    }
  };

  const handleToggleStatus = async (promo: any) => {
    const newStatus = promo.status === 'Aktif' ? 'Tidak Aktif' : 'Aktif';
    try {
      const res = await apiFetch(`/api/promo/${promo.id_promo}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchPromos();
      }
    } catch {
      alert('Gagal mengubah status');
    }
  };

  const resetForm = () => {
    setFormData({
      nama_promo: '',
      jenis_diskon: 'Persen',
      nilai_diskon: '',
      tanggal_mulai: '',
      tanggal_selesai: '',
      status: 'Aktif',
      deskripsi: '',
      prioritas: '0',
      id_penyewa_list: []
    });
  };

  const openEdit = (promo: any) => {
    // Fetch detail to get selected tenants
    apiFetch(`/api/promo/${promo.id_promo}`).then(res => res.json()).then(data => {
      setEditingPromo(data);
      setFormData({
        nama_promo: data.nama_promo,
        jenis_diskon: data.jenis_diskon,
        nilai_diskon: data.nilai_diskon.toString(),
        tanggal_mulai: data.tanggal_mulai,
        tanggal_selesai: data.tanggal_selesai,
        status: data.status,
        deskripsi: data.deskripsi || '',
        prioritas: (data.prioritas || 0).toString(),
        id_penyewa_list: data.promo_penyewa?.map((pp: any) => pp.id_penyewa) || []
      });
    });
  };

  const openDetail = (promo: any) => {
    apiFetch(`/api/promo/${promo.id_promo}`).then(res => res.json()).then(data => {
      setShowDetailModal(data);
    });
  };

  const togglePenyewa = (id: string) => {
    setFormData(prev => ({
      ...prev,
      id_penyewa_list: prev.id_penyewa_list.includes(id)
        ? prev.id_penyewa_list.filter(item => item !== id)
        : [...prev.id_penyewa_list, id]
    }));
  };

  const filteredPenyewaSelection = penyewaList.filter(p => 
    p.nama.toLowerCase().includes(searchPenyewa.toLowerCase()) || 
    p.nik.includes(searchPenyewa)
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <button onClick={() => router.push('/pengaturan')} className="hover:text-blue-600 transition-colors">Pengaturan</button>
            <span>/</span>
            <span className="text-slate-900 font-medium">Promo & Diskon</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Ticket className="text-blue-600" size={32} />
            Promo & Diskon
          </h1>
          <p className="text-slate-500 mt-1">Kelola program promosi dan potongan harga untuk penyewa.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Tambah Promo
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama promo..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="text-slate-400" size={18} />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 md:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Tidak Aktif">Tidak Aktif</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Promo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Jenis</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nilai</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Prioritas</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Periode</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Penyewa</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : promos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data promo.
                  </td>
                </tr>
              ) : promos.map((promo) => (
                <tr key={promo.id_promo} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-900">{promo.nama_promo}</td>
                  <td className="px-6 py-4 text-slate-600">{promo.jenis_diskon}</td>
                  <td className="px-6 py-4 font-bold text-blue-600">
                    {promo.jenis_diskon === 'Persen' ? `${promo.nilai_diskon}%` : formatRupiah(promo.nilai_diskon)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                      P{promo.prioritas || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {formatTanggal(promo.tanggal_mulai)} - {formatTanggal(promo.tanggal_selesai)}
                  </td>
                  <td className="px-6 py-4 text-slate-600 flex items-center gap-1.5">
                    <Users size={14} className="text-slate-400" />
                    {promo.jumlah_penyewa}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      promo.status === 'Aktif' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {promo.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openDetail(promo)}
                        className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                        title="Detail"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => openEdit(promo)}
                        className="p-2 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(promo)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          promo.status === 'Aktif' ? "hover:bg-red-50 text-slate-400 hover:text-red-600" : "hover:bg-green-50 text-slate-400 hover:text-green-600"
                        )}
                        title={promo.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {promo.status === 'Aktif' ? <PowerOff size={16} /> : <Power size={16} />}
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(promo)}
                        className="p-2 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {total > limit && (
          <div className="p-4 border-t border-slate-100">
            <Pagination 
              currentPage={page} 
              totalPages={Math.ceil(total / limit)} 
              onPageChange={setPage} 
            />
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingPromo) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editingPromo ? 'Edit Promo' : 'Tambah Promo Baru'}</h2>
                <p className="text-sm text-slate-500">Lengkapi informasi promosi di bawah ini.</p>
              </div>
              <button 
                onClick={() => { setShowAddModal(false); setEditingPromo(null); resetForm(); }}
                className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={editingPromo ? handleUpdatePromo : handleCreatePromo} className="overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nama Promo</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Contoh: Promo Agustus Merdeka"
                      value={formData.nama_promo}
                      onChange={(e) => setFormData({...formData, nama_promo: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Jenis Diskon</label>
                      <select 
                        value={formData.jenis_diskon}
                        onChange={(e) => setFormData({...formData, jenis_diskon: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="Persen">Persen (%)</option>
                        <option value="Nominal">Nominal (Rp)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Nilai</label>
                      <input 
                        required
                        type="number" 
                        value={formData.nilai_diskon}
                        onChange={(e) => setFormData({...formData, nilai_diskon: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Tanggal Mulai</label>
                      <input 
                        required
                        type="date" 
                        value={formData.tanggal_mulai}
                        onChange={(e) => setFormData({...formData, tanggal_mulai: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Tanggal Selesai</label>
                      <input 
                        required
                        type="date" 
                        value={formData.tanggal_selesai}
                        onChange={(e) => setFormData({...formData, tanggal_selesai: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="Aktif">Aktif</option>
                        <option value="Tidak Aktif">Tidak Aktif</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Prioritas</label>
                        <p className="text-[10px] text-slate-400 italic font-normal">(Angka tinggi = Lebih Utama)</p>
                      </div>
                      <input 
                        type="number" 
                        value={formData.prioritas}
                        onChange={(e) => setFormData({...formData, prioritas: e.target.value})}
                        placeholder="0"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Deskripsi</label>
                    <textarea 
                      rows={3}
                      value={formData.deskripsi}
                      onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                      placeholder="Catatan tambahan mengenai promo ini..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-4 flex flex-col h-full">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase">Pilih Penyewa ({formData.id_penyewa_list.length})</label>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, id_penyewa_list: penyewaList.map(p => p.id_penyewa)})}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      Pilih Semua
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Cari penyewa..."
                      value={searchPenyewa}
                      onChange={(e) => setSearchPenyewa(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1 border border-slate-100 rounded-2xl overflow-y-auto max-h-[300px] p-2 space-y-1">
                    {filteredPenyewaSelection.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">Tidak ada penyewa ditemukan.</div>
                    ) : (
                      filteredPenyewaSelection.map(p => (
                        <div 
                          key={p.id_penyewa}
                          onClick={() => togglePenyewa(p.id_penyewa)}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all border",
                            formData.id_penyewa_list.includes(p.id_penyewa)
                              ? "bg-blue-50 border-blue-200"
                              : "hover:bg-slate-50 border-transparent"
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">{p.nama}</span>
                            <span className="text-[10px] text-slate-500">{p.nik}</span>
                          </div>
                          {formData.id_penyewa_list.includes(p.id_penyewa) ? (
                            <div className="bg-blue-600 text-white p-0.5 rounded-full">
                              <Check size={12} />
                            </div>
                          ) : (
                            <div className="w-4 h-4 border-2 border-slate-200 rounded-full" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-3">
                <button 
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingPromo(null); resetForm(); }}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  {editingPromo ? 'Simpan Perubahan' : 'Buat Promo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                  <Ticket size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{showDetailModal.nama_promo}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      showDetailModal.status === 'Aktif' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {showDetailModal.status}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{showDetailModal.jenis_diskon} {showDetailModal.nilai_diskon}{showDetailModal.jenis_diskon === 'Persen' ? '%' : ''}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailModal(null)}
                className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Info Utama */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Calendar size={16} className="text-blue-600" />
                      Informasi Promo
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Masa Berlaku</p>
                        <p className="text-sm font-bold text-slate-700">{formatTanggal(showDetailModal.tanggal_mulai)} - {formatTanggal(showDetailModal.tanggal_selesai)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nilai Diskon</p>
                        <p className="text-lg font-black text-blue-600">
                          {showDetailModal.jenis_diskon === 'Persen' ? `${showDetailModal.nilai_diskon}%` : formatRupiah(showDetailModal.nilai_diskon)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Prioritas</p>
                        <p className="text-sm font-bold text-slate-700">P{showDetailModal.prioritas || 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Deskripsi</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{showDetailModal.deskripsi || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-600 p-5 rounded-2xl text-white shadow-lg shadow-blue-100">
                    <h3 className="text-xs font-bold uppercase opacity-70 mb-1">Total Nilai Diskon</h3>
                    <p className="text-2xl font-black">{formatRupiah(showDetailModal.total_potongan || 0)}</p>
                    <p className="text-[10px] mt-2 opacity-70">Total akumulasi potongan harga yang pernah diberikan melalui promo ini.</p>
                  </div>
                </div>

                {/* Daftar Penyewa & Riwayat */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Users size={18} className="text-blue-600" />
                      Daftar Penyewa Terdaftar ({showDetailModal.promo_penyewa?.length || 0})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {showDetailModal.promo_penyewa?.length === 0 ? (
                        <div className="col-span-2 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-500 text-sm">
                          Belum ada penyewa yang terdaftar dalam promo ini.
                        </div>
                      ) : (
                        showDetailModal.promo_penyewa?.map((pp: any) => (
                          <div key={pp.id_penyewa} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">
                              {pp.penyewa?.nama?.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{pp.penyewa?.nama}</p>
                              <p className="text-[10px] text-slate-500 truncate">{pp.penyewa?.whatsapp}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <History size={18} className="text-blue-600" />
                      Riwayat Penggunaan Promo
                    </h3>
                    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                          <tr>
                            <th className="px-5 py-3">Tanggal</th>
                            <th className="px-5 py-3">Penyewa</th>
                            <th className="px-5 py-3 text-right">Potongan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {showDetailModal.riwayat_penggunaan?.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-5 py-8 text-center text-slate-400">Belum ada riwayat penggunaan.</td>
                            </tr>
                          ) : (
                            showDetailModal.riwayat_penggunaan?.map((u: any) => (
                              <tr key={u.id_pembayaran} className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3 text-slate-600">{formatTanggal(u.tanggal_bayar)}</td>
                                <td className="px-5 py-3 font-bold text-slate-800">{u.kontrak_sewa?.penyewa?.nama}</td>
                                <td className="px-5 py-3 text-right font-bold text-red-600">-{formatRupiah(u.nominal_diskon)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center space-y-4">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Nonaktifkan Promo?</h3>
              <p className="text-slate-500 leading-relaxed">
                Anda akan menonaktifkan promo <span className="font-bold text-slate-900">&quot;{deleteConfirm.nama_promo}&quot;</span>. 
                Penyewa yang terdaftar tidak akan lagi mendapatkan diskon ini. Histori penggunaan tetap tersimpan.
              </p>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={handleDeletePromo}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  Nonaktifkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
