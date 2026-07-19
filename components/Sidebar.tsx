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
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const menuItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Unit', href: '/unit', icon: Building2 },
  { name: 'Penyewa', href: '/penyewa', icon: Users },
  { name: 'Kontrak', href: '/kontrak', icon: FileText },
  { name: 'Pembayaran', href: '/pembayaran', icon: CreditCard },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={cn(
        "fixed left-0 top-0 h-screen bg-slate-900 text-slate-300 transition-all duration-300 z-40 flex flex-col border-r border-slate-800",
        isOpen ? "w-60" : "w-0 -translate-x-full lg:w-20 lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shrink-0">S</div>
            <span className={cn("text-xl font-bold tracking-tight text-white uppercase", !isOpen && "lg:hidden")}>
              SEWAIN
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-all group",
                  isActive 
                    ? "bg-slate-800/50 text-blue-400" 
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
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 text-slate-400">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">AD</div>
            <div className={cn("flex-1 overflow-hidden", !isOpen && "lg:hidden")}>
              <p className="text-sm font-medium text-white truncate">Admin Utama</p>
              <p className="text-xs truncate text-slate-500">admin@sewain.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
