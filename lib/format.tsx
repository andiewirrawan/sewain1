import React from 'react';

export function formatTanggal(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatRupiah(angka: number | string | null | undefined): string {
  if (angka === null || angka === undefined) return '-';
  const value = typeof angka === 'string' ? parseFloat(angka) : angka;
  if (isNaN(value)) return 'Rp 0';
  return 'Rp ' + value.toLocaleString('id-ID');
}

export function safeValue(val: any): string {
  if (val === null || val === undefined || val === '') return '-';
  if (typeof val === 'object') return '-'; // Prevent JSON object rendering
  return String(val);
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-';
  return phone; // You can add actual formatting here if needed like 0812-XXXX-XXXX
}

export function formatStatus(status: string | null | undefined) {
  if (!status) return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">-</span>;
  const s = status.toLowerCase();
  let bg = 'bg-slate-100';
  let text = 'text-slate-600';

  // Unit Statuses
  if (s === 'kosong') {
    bg = 'bg-emerald-100';
    text = 'text-emerald-700';
  } else if (s === 'terisi') {
    bg = 'bg-blue-100';
    text = 'text-blue-700';
  } else if (s === 'booking') {
    bg = 'bg-amber-100';
    text = 'text-amber-700';
  } else if (s === 'renovasi') {
    bg = 'bg-rose-100';
    text = 'text-rose-700';
  }
  // Generic Statuses (Contract, Payment, etc)
  else if (s.includes('aktif') || s.includes('lunas')) {
    bg = 'bg-emerald-100';
    text = 'text-emerald-700';
  } else if (s.includes('selesai')) {
    bg = 'bg-blue-100';
    text = 'text-blue-800';
  } else if (s.includes('putus') || s.includes('belum') || s.includes('tunggak') || s.includes('nonaktif') || s.includes('batal')) {
    bg = 'bg-rose-100';
    text = 'text-rose-700';
  }

  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${bg} ${text}`}>{status}</span>;
}

