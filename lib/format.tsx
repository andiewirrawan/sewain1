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
  if (!status) return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">-</span>;
  const s = status.toLowerCase();
  let bg = 'bg-gray-100';
  let text = 'text-gray-800';

  if (s.includes('aktif') || s.includes('lunas') || s.includes('terisi')) {
    bg = 'bg-green-100';
    text = 'text-green-800';
  } else if (s.includes('selesai') || s.includes('kosong')) {
    bg = 'bg-blue-100';
    text = 'text-blue-800';
  } else if (s.includes('putus') || s.includes('belum') || s.includes('tunggak')) {
    bg = 'bg-red-100';
    text = 'text-red-800';
  }

  return <span className={`px-2 py-1 rounded text-xs ${bg} ${text}`}>{status}</span>;
}

