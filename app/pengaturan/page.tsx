'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { formatRupiah, formatTanggal, formatStatus } from '@/lib/format';
import { 
  Download, 
  Trash2, 
  UserPlus, 
  Shield, 
  History, 
  Database, 
  AlertTriangle,
  Eye
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

  // Modal states
  const [showAddUser, setShowAddUser] = useState(false);
  const [showLogDetail, setShowLogDetail] = useState<any>(null);
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

  const handleUpdateTarif = async (id: string, harga: number) => {
    try {
      const res = await apiFetch(`/api/pengaturan/tarif/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ harga_sewa: harga })
      });
      if (res.ok) {
        alert('Tarif berhasil diperbarui');
        fetchAllData();
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
      }
    } catch (err) {
      alert('Gagal menambahkan user');
    }
  };

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
                    <td className="px-5 py-3">
                      <input 
                        type="number" 
                        defaultValue={unit.harga_sewa}
                        className="w-32 px-2 py-1 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          if (val !== unit.harga_sewa) {
                            handleUpdateTarif(unit.id_unit, val);
                          }
                        }}
                      />
                    </td>
                    <td className="px-5 py-3 text-right text-slate-400 italic text-xs">
                      Simpan otomatis saat blur
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Kelola User */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Shield size={20} />
              </div>
              <h2 className="font-bold text-slate-800">Kelola Pengguna</h2>
            </div>
            <button 
              onClick={() => setShowAddUser(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              <UserPlus size={14} /> Tambah User
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left">Nama / Email</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{u.nama}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'Owner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {formatStatus(u.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Tambah Pengguna Baru</h3>
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
