'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { formatRupiah, formatTanggal, formatStatus } from '@/lib/format';
import { cn } from '@/lib/utils';
import { 
  Download, 
  Trash2, 
  UserPlus, 
  Shield, 
  History, 
  Database, 
  AlertTriangle,
  Eye,
  Edit2,
  Power,
  PowerOff,
  X
} from 'lucide-react';

export default function PengaturanPage() {
  const [user, setUser] = useState<{ id: string; nama: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // State for data
  const [units, setUnits] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [logCount, setLogCount] = useState(0);
  const [logPage, setLogPage] = useState(1);

  // User list filters & pagination
  const [searchUser, setSearchUser] = useState('');
  const [filterRole, setFilterRole] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 10;

  // Modal states
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<any>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showLogDetail, setShowLogDetail] = useState<any>(null);
  const [editingTarif, setEditingTarif] = useState<any>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [resetConfirm, setResetConfirm] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState({ nama: '', email: '', password: '', role: 'Admin' });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    setUser(parsedUser);
    
    if (parsedUser?.role !== 'Owner') {
      router.push('/dashboard');
    } else {
      fetchAllData();
    }
  }, [router]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [unitsRes, usersRes, logsRes] = await Promise.all([
        apiFetch('/api/unit'),
        apiFetch('/api/users'),
        apiFetch(`/api/audit-log?page=${logPage}`)
      ]);

      const [unitsData, usersData, logsData] = await Promise.all([
        unitsRes.json(),
        usersRes.json(),
        logsRes.json()
      ]);

      setUnits(unitsData);
      setUsers(usersData);
      setLogs(logsData.data);
      setLogCount(logsData.count);
    } catch (err) {
      console.error('Gagal mengambil data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Owner') {
      fetchLogs();
    }
  }, [logPage]);

  const fetchLogs = async () => {
    try {
      const res = await apiFetch(`/api/audit-log?page=${logPage}`);
      const data = await res.json();
      setLogs(data.data);
      setLogCount(data.count);
    } catch (err) {
      console.error('Gagal mengambil logs:', err);
    }
  };

  useEffect(() => {
    if (viewingUser) {
      fetchUserActivities(viewingUser.id);
    } else {
      setUserActivities([]);
    }
  }, [viewingUser]);

  const fetchUserActivities = async (userId: string) => {
    setLoadingActivities(true);
    try {
      const res = await apiFetch(`/api/audit-log?user_id=${userId}&page=1`);
      const data = await res.json();
      setUserActivities(data.data || []);
    } catch (err) {
      console.error('Gagal mengambil riwayat aktivitas user:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleUpdateTarif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarif) return;
    
    try {
      const res = await apiFetch(`/api/pengaturan/tarif/${editingTarif.id_unit}`, {
        method: 'PUT',
        body: JSON.stringify({ harga_sewa: editingTarif.harga_sewa })
      });
      if (res.ok) {
        alert('Tarif berhasil diperbarui');
        setEditingTarif(null);
        fetchAllData();
      } else {
        const errData = await res.json();
        alert(`Gagal memperbarui tarif: ${errData.message}`);
      }
    } catch (err) {
      alert('Gagal memperbarui tarif');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        alert('User berhasil ditambahkan');
        setShowAddUser(false);
        setNewUser({ nama: '', email: '', password: '', role: 'Admin' });
        fetchAllData();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("API error adding user:", errData);
        alert(`Gagal menambahkan user: ${errData.message || 'Kesalahan Server'}`);
      }
    } catch (err: any) {
      console.error("Fetch error adding user:", err);
      alert(`Gagal menambahkan user: ${err.message}`);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      const res = await apiFetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nama: editingUser.nama,
          role: editingUser.role,
          status: editingUser.status,
          password: editingUser.password // Optional
        })
      });
      
      if (res.ok) {
        alert('User berhasil diperbarui');
        setEditingUser(null);
        fetchAllData();
      } else {
        const errData = await res.json();
        alert(`Gagal memperbarui user: ${errData.message}`);
      }
    } catch (err) {
      alert('Gagal memperbarui user');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Aktif' ? 'Nonaktif' : 'Aktif';
    try {
      const res = await apiFetch(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchAllData();
      } else {
        const errData = await res.json();
        alert(`Gagal mengubah status: ${errData.message}`);
      }
    } catch (err) {
      alert('Gagal mengubah status');
    }
  };

  const handleDeleteUser = async () => {
    if (!showDeleteConfirm) return;
    const u = showDeleteConfirm;
    
    if (deleteConfirmText !== 'HAPUS USER') {
      alert('Teks konfirmasi salah');
      return;
    }

    try {
      const res = await apiFetch(`/api/users/${u.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('User berhasil dinonaktifkan (Soft Delete)');
        setShowDeleteConfirm(null);
        setDeleteConfirmText('');
        fetchAllData();
      } else {
        const errData = await res.json();
        alert(`Gagal menghapus user: ${errData.message}`);
      }
    } catch (err) {
      alert('Gagal menghapus user');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = 
      u.nama.toLowerCase().includes(searchUser.toLowerCase()) || 
      u.email.toLowerCase().includes(searchUser.toLowerCase());
    const matchRole = filterRole === 'Semua' || u.role === filterRole;
    const matchStatus = filterStatus === 'Semua' || u.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const paginatedUsers = filteredUsers.slice((userPage - 1) * usersPerPage, userPage * usersPerPage);
  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleBackup = async () => {
    try {
      const res = await apiFetch('/api/pengaturan/backup');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_sewain_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Gagal melakukan backup');
    }
  };

  const handleReset = async () => {
    if (resetConfirm !== 'HAPUS SEMUA DATA') {
      alert('Teks konfirmasi salah');
      return;
    }

    if (!confirm('TINDAKAN INI TIDAK DAPAT DIBATALKAN. Anda yakin?')) return;

    setIsResetting(true);
    try {
      const res = await apiFetch('/api/pengaturan/reset', {
        method: 'POST',
        body: JSON.stringify({ konfirmasi: resetConfirm })
      });
      if (res.ok) {
        alert('Seluruh data berhasil dihapus');
        setResetConfirm('');
        fetchAllData();
      }
    } catch (err) {
      alert('Gagal meriset data');
    } finally {
      setIsResetting(false);
    }
  };

  if (!user || user.role !== 'Owner' || (loading && units.length === 0)) {
    return <div className="p-8 text-center text-slate-500">Memuat data pengaturan...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pengaturan Sistem</h1>
          <p className="text-slate-500 mt-1">Kelola tarif, pengguna, dan pemeliharaan database.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tarif Sewa */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Database size={20} />
              </div>
              <h2 className="font-bold text-slate-800">Tarif Sewa Unit</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left">Unit</th>
                  <th className="px-5 py-3 text-left">Harga Sewa</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.map((unit) => (
                  <tr key={unit.id_unit} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-900">{unit.kode_unit}</td>
                    <td className="px-5 py-3 text-slate-600 font-bold">
                      {formatRupiah(unit.harga_sewa)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button 
                        onClick={() => setEditingTarif(unit)}
                        className="px-3 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 rounded-lg text-[10px] font-bold transition-all"
                      >
                        Edit Tarif
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Kelola User */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Shield size={20} />
              </div>
              <h2 className="font-bold text-slate-800">Kelola Pengguna</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input 
                type="text" 
                placeholder="Cari nama/email..."
                value={searchUser}
                onChange={(e) => { setSearchUser(e.target.value); setUserPage(1); }}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 w-40"
              />
              <select 
                value={filterRole}
                onChange={(e) => { setFilterRole(e.target.value); setUserPage(1); }}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Semua">Semua Role</option>
                <option value="Owner">Owner</option>
                <option value="Admin">Admin</option>
              </select>
              <select 
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setUserPage(1); }}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Semua">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
              <button 
                onClick={() => setShowAddUser(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                <UserPlus size={14} /> Tambah User
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left">Nama / Email</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Informasi</th>
                  <th className="px-5 py-3 text-left">Login Terakhir</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <button 
                        onClick={() => setViewingUser(u)}
                        className="text-left group"
                      >
                        <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{u.nama}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold",
                        u.role === 'Owner' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {formatStatus(u.status)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-[10px] text-slate-500">
                        <div className="font-bold uppercase text-slate-400 mb-0.5">Dibuat Pada:</div>
                        {u.created_at ? formatTanggal(u.created_at) : '-'}
                        <div className="font-bold uppercase text-slate-400 mt-1 mb-0.5">Dibuat Oleh:</div>
                        {u.created_by || '-'}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-slate-600 font-medium">{u.last_login ? new Date(u.last_login).toLocaleString('id-ID') : '-'}</div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setViewingUser(u)}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                          title="Detail User"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => setEditingUser({...u, password: ''})}
                          className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            u.status === 'Aktif' 
                              ? "hover:bg-amber-50 text-slate-400 hover:text-amber-600" 
                              : "hover:bg-green-50 text-slate-400 hover:text-green-600"
                          )}
                          title={u.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {u.status === 'Aktif' ? <PowerOff size={14} /> : <Power size={14} />}
                        </button>
                        {u.role !== 'Owner' && u.id !== user?.id && (
                          <button 
                            onClick={() => {
                              setShowDeleteConfirm(u);
                              setDeleteConfirmText('');
                            }}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                            title="Hapus User"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400 italic">
                      Tidak ada user yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalUserPages > 1 && (
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <button 
                disabled={userPage === 1}
                onClick={() => setUserPage(p => p - 1)}
                className="px-3 py-1 border border-slate-200 rounded-md disabled:opacity-30 bg-white"
              >
                Prev
              </button>
              <span className="text-slate-500 font-medium">Halaman {userPage} dari {totalUserPages}</span>
              <button 
                disabled={userPage === totalUserPages}
                onClick={() => setUserPage(p => p + 1)}
                className="px-3 py-1 border border-slate-200 rounded-md disabled:opacity-30 bg-white"
              >
                Next
              </button>
            </div>
          )}
        </section>

        {/* Maintenance Tools */}
        <section className="space-y-6">
          {/* Backup */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <Download size={20} />
              </div>
              <h2 className="font-bold text-slate-800">Ekspor & Backup</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6">Unduh seluruh data aplikasi (Unit, Penyewa, Kontrak, Pembayaran) dalam format JSON untuk cadangan.</p>
            <button 
              onClick={handleBackup}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              <Download size={18} /> Unduh Backup JSON
            </button>
          </div>

          {/* Reset */}
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <h2 className="font-bold text-red-800">Zona Bahaya</h2>
            </div>
            <p className="text-sm text-red-600/80 mb-6 font-medium">Reset akan menghapus seluruh data Unit, Penyewa, Kontrak, dan Pembayaran secara permanen.</p>
            
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-bold text-red-700 block tracking-widest">Ketik "HAPUS SEMUA DATA" untuk konfirmasi</label>
              <input 
                type="text" 
                placeholder="HAPUS SEMUA DATA"
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
                className="w-full px-4 py-3 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none placeholder:text-red-200 text-red-700 font-bold"
              />
              <button 
                onClick={handleReset}
                disabled={resetConfirm !== 'HAPUS SEMUA DATA' || isResetting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-red-100"
              >
                <Trash2 size={18} /> {isResetting ? 'Mereset...' : 'Kosongkan Seluruh Database'}
              </button>
            </div>
          </div>
        </section>

        {/* Audit Log */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col lg:col-span-1">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <History size={20} />
              </div>
              <h2 className="font-bold text-slate-800">Audit Log Terbaru</h2>
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left">Waktu</th>
                  <th className="px-5 py-3 text-left">Aktivitas</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="text-slate-900 font-medium">{formatTanggal(log.created_at)}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{new Date(log.created_at).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-slate-700 font-semibold">{log.aktivitas}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{log.tabel} - {log.user_nama}</div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button 
                        onClick={() => setShowLogDetail(log)}
                        className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-blue-600 transition-all"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <button 
              disabled={logPage === 1}
              onClick={() => setLogPage(p => p - 1)}
              className="px-3 py-1 border border-slate-200 rounded-md disabled:opacity-30"
            >
              Prev
            </button>
            <span className="text-slate-500 font-medium">Halaman {logPage}</span>
            <button 
              disabled={logs.length < 20}
              onClick={() => setLogPage(p => p + 1)}
              className="px-3 py-1 border border-slate-200 rounded-md disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </section>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Tambah Pengguna Baru</h3>
              <button onClick={() => setShowAddUser(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Nama Lengkap</label>
                <input 
                  required
                  type="text" 
                  value={newUser.nama}
                  onChange={(e) => setNewUser({...newUser, nama: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                <input 
                  required
                  type="email" 
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                <input 
                  required
                  type="password" 
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                <select 
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Admin">Admin</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 bg-red-50 border-b border-red-100 flex items-center gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-900">Konfirmasi Hapus</h3>
                <p className="text-sm text-red-700/80">Soft delete untuk user {showDeleteConfirm.nama}</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                User ini akan dinonaktifkan. Data tetap tersimpan untuk audit namun user tidak dapat login.
              </p>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 block tracking-widest">Ketik "HAPUS USER" untuk konfirmasi</label>
                <input 
                  type="text" 
                  placeholder="HAPUS USER"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-red-600 font-bold"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setShowDeleteConfirm(null);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={handleDeleteUser}
                  disabled={deleteConfirmText !== 'HAPUS USER'}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-red-100"
                >
                  Nonaktifkan User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Edit Pengguna</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Nama Lengkap</label>
                <input 
                  required
                  type="text" 
                  value={editingUser.nama}
                  onChange={(e) => setEditingUser({...editingUser, nama: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Email (Tidak dapat diubah)</label>
                <input 
                  disabled
                  type="email" 
                  value={editingUser.email}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Password Baru (Kosongkan jika tidak diubah)</label>
                <input 
                  type="password" 
                  placeholder="********"
                  value={editingUser.password}
                  onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                  <select 
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Owner">Owner</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select 
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tarif Modal */}
      {editingTarif && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Edit Tarif Sewa</h3>
              <button onClick={() => setEditingTarif(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateTarif} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nama / Kode Unit</label>
                <input 
                  disabled
                  type="text" 
                  value={editingTarif.kode_unit}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tarif Sewa (Rupiah)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</div>
                  <input 
                    required
                    type="number" 
                    value={editingTarif.harga_sewa}
                    onChange={(e) => setEditingTarif({...editingTarif, harga_sewa: parseInt(e.target.value)})}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600"
                  />
                </div>
                <p className="text-[10px] text-slate-400 italic">Masukkan angka saja tanpa titik atau koma.</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingTarif(null)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  Simpan Tarif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-100">
                  {viewingUser.nama.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{viewingUser.nama}</h3>
                  <p className="text-sm text-slate-500">{viewingUser.email}</p>
                </div>
              </div>
              <button onClick={() => setViewingUser(null)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Role</div>
                  <div className="font-bold text-slate-700">{viewingUser.role}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</div>
                  <div>{formatStatus(viewingUser.status)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Terakhir Login</div>
                  <div className="text-slate-700 font-medium">{viewingUser.last_login ? new Date(viewingUser.last_login).toLocaleString('id-ID') : '-'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dibuat Pada</div>
                  <div className="text-slate-700 font-medium">{viewingUser.created_at ? formatTanggal(viewingUser.created_at) : '-'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dibuat Oleh</div>
                  <div className="text-slate-700 font-medium">{viewingUser.created_by || '-'}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <History size={16} className="text-slate-400" />
                    Riwayat Aktivitas
                  </h4>
                  <span className="text-[10px] text-slate-400 italic">Menampilkan 20 aktivitas terakhir</span>
                </div>

                {loadingActivities ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="text-xs font-medium">Memuat aktivitas...</p>
                  </div>
                ) : userActivities.length > 0 ? (
                  <div className="space-y-4">
                    {userActivities.map((log) => (
                      <div key={log.id_log} className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-300 mt-2 group-hover:bg-blue-500 transition-colors border-2 border-white ring-2 ring-slate-100 group-hover:ring-blue-100"></div>
                          <div className="w-px flex-1 bg-slate-100 my-1 group-hover:bg-blue-100 transition-colors"></div>
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="text-[10px] text-slate-400 font-medium">{new Date(log.created_at || log.waktu).toLocaleString('id-ID')}</div>
                          <div className="font-bold text-slate-800 text-sm mt-0.5">{log.aktivitas}</div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold uppercase tracking-tighter">
                              {log.nama_tabel}
                            </span>
                            <span className="text-xs text-slate-400 truncate max-w-[200px] font-mono">
                              ID: {log.id_data}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-400 italic text-sm">
                    Belum ada riwayat aktivitas yang tercatat.
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setViewingUser(null)}
                className="px-8 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all shadow-sm active:scale-95"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {showLogDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Detail Aktivitas</h3>
              <button onClick={() => setShowLogDetail(null)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Aktivitas</div>
                  <div className="font-bold text-slate-800">{showLogDetail.aktivitas}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Waktu</div>
                  <div className="font-bold text-slate-800">{new Date(showLogDetail.created_at).toLocaleString('id-ID')}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">User</div>
                  <div className="font-bold text-slate-800">{showLogDetail.user_nama} ({showLogDetail.user_role})</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Target</div>
                  <div className="font-bold text-slate-800">{showLogDetail.tabel} ID: {showLogDetail.id_data}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Data Lama</h4>
                  <pre className="p-4 bg-slate-900 text-slate-300 rounded-xl text-[10px] overflow-auto max-h-48 font-mono">
                    {JSON.stringify(showLogDetail.data_lama, null, 2) || 'None'}
                  </pre>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Data Baru</h4>
                  <pre className="p-4 bg-slate-900 text-slate-300 rounded-xl text-[10px] overflow-auto max-h-48 font-mono">
                    {JSON.stringify(showLogDetail.data_baru, null, 2) || 'None'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
