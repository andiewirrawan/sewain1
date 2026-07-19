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
        "fixed left-0 top-0 h-screen bg-slate-900 text-slate-300 transition-all duration-300 z-40 flex flex-col",
        isOpen ? "w-64" : "w-0 -translate-x-full lg:w-20 lg:translate-x-0"
      )}>
        <div className="h-16 flex items-center justify-center border-b border-slate-800">
          <h1 className={cn("font-bold text-xl tracking-wider text-white", !isOpen && "lg:hidden")}>
            SEWAIN
          </h1>
          {!isOpen && <span className="hidden lg:block font-bold text-xl text-white">S</span>}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                  isActive 
                    ? "bg-blue-600 text-white" 
                    : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon size={20} className={cn(isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                <span className={cn("font-medium", !isOpen && "lg:hidden")}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-slate-800 hover:text-white transition-colors group text-slate-400">
            <LogOut size={20} />
            <span className={cn("font-medium", !isOpen && "lg:hidden")}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
