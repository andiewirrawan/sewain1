'use client';

import React from 'react';
import { Bell, Search, User } from 'lucide-react';

export default function Topbar() {
  const [user, setUser] = React.useState<{ nama: string; role: string } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
      } catch(e) { 
        console.warn('localStorage not accessible', e);
        return null; 
      }
    }
    return null;
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center bg-slate-100 px-3 py-1.5 rounded-md w-full max-w-md">
        <Search size={18} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Cari data..." 
          className="bg-transparent border-none outline-none ml-2 text-sm w-full placeholder:text-slate-400"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900">{user?.nama || 'Administrator'}</p>
            <p className="text-xs text-slate-500">{user?.role || 'Owner'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 border border-slate-300">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}

