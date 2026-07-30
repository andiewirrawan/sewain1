'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  CreditCard, 
  LogOut,
  Menu,
  X,
  Settings,
  PieChart,
  Receipt,
  Tag,
  History
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const menuGroups = [
  {
    title: 'Dashboard',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Master',
    items: [
      { name: 'Daftar Unit', href: '/unit', icon: Building2 },
      { name: 'Penyewa', href: '/penyewa', icon: Users },
      { name: 'Kontrak', href: '/kontrak', icon: FileText },
      { name: 'Promo', href: '/pengaturan/promo', icon: Tag, roles: ['Owner'] },
    ]
  },
  {
    title: 'Keuangan',
    items: [
      { name: 'Daftar Piutang', href: '/tagihan', icon: Receipt },
      { name: 'Riwayat Generate', href: '/tagihan/riwayat', icon: History },
      { name: 'Pembayaran', href: '/pembayaran', icon: CreditCard },
    ]
  },
  {
    title: 'Laporan',
    items: [
      { name: 'Laporan', href: '/laporan', icon: PieChart },
    ]
  },
  {
    title: 'Pengaturan',
    items: [
      { name: 'Pengaturan', href: '/pengaturan', icon: Settings, roles: ['Owner'] },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(true);
  const [user, setUser] = React.useState<{ nama: string; role: string; is_system_owner: boolean } | null>(null);

  React.useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.warn('localStorage not accessible', err);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "h-screen bg-slate-900 text-slate-300 transition-all duration-300 z-40 flex flex-col border-r border-slate-800 shrink-0",
        "fixed left-0 top-0 lg:sticky",
        isOpen ? "w-60 translate-x-0" : "w-60 -translate-x-full lg:w-20 lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shrink-0">S</div>
            <span className={cn("text-xl font-bold tracking-tight text-white uppercase", !isOpen && "lg:hidden")}>
              SEWAIN
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
          {menuGroups.map((group) => {
            // Filter items in group based on role
            const visibleItems = group.items.filter(item => {
              if (item.roles && !item.roles.includes(user?.role || '') && !user?.is_system_owner) {
                return false;
              }
              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                {isOpen && (
                  <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    {group.title}
                  </h3>
                )}
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md transition-all group",
                        isActive 
                          ? "bg-slate-800 text-blue-400" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                      )}
                    >
                      <Icon size={18} className={cn(isActive ? "text-blue-400" : "text-slate-400 group-hover:text-white")} />
                      <span className={cn("text-sm font-medium", !isOpen && "lg:hidden")}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 text-slate-400 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.nama?.substring(0, 2).toUpperCase() || '??'}
            </div>
            <div className={cn("flex-1 overflow-hidden", !isOpen && "lg:hidden")}>
              <p className="text-sm font-medium text-white truncate">{user?.nama || 'Loading...'}</p>
              <p className="text-xs truncate text-slate-500">{user?.role || 'User'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-slate-800 hover:text-white transition-colors group text-slate-400"
          >
            <LogOut size={18} />
            <span className={cn("text-sm font-medium", !isOpen && "lg:hidden")}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

