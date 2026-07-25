import { formatRupiah } from './format';

export function generateWhatsAppTagihan(penyewa: any, tagihanList: any[]) {
  const unpaid = tagihanList.filter(t => t.status_tagihan !== 'Lunas');
  
  if (unpaid.length === 0) return null;

  let message = `Halo Bapak/Ibu *${penyewa.nama}*,\n\n`;
  message += `Berikut adalah rincian tagihan sewa unit Anda yang belum terlunasi:\n\n`;

  let totalKurang = 0;

  unpaid.forEach((t) => {
    const kurang = t.total_tagihan - t.terbayar;
    totalKurang += kurang;

    message += `📅 *Periode ${t.periode}*\n`;
    message += `Tagihan: ${formatRupiah(t.total_tagihan)}\n`;
    message += `Terbayar: ${formatRupiah(t.terbayar)}\n`;
    message += `*Kurang: ${formatRupiah(kurang)}*\n\n`;
  });

  message += `--------------------------\n`;
  message += `*TOTAL KEKURANGAN: ${formatRupiah(totalKurang)}*\n`;
  message += `--------------------------\n\n`;
  message += `Mohon segera melakukan pembayaran melalui kasir atau transfer ke rekening kami.\n\n`;
  message += `Terima kasih atas kerjasamanya. 🙏`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${penyewa.telepon?.replace(/[^0-9]/g, '') || ''}?text=${encodedMessage}`;
}
