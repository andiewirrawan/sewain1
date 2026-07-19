export function formatTanggal(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatRupiah(angka: number | string): string {
  const value = typeof angka === 'string' ? parseFloat(angka) : angka;
  if (isNaN(value)) return 'Rp 0';
  return 'Rp ' + value.toLocaleString('id-ID');
}
