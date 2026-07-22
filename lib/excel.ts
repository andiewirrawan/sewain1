import ExcelJS from 'exceljs';
import { formatTanggal, formatRupiah } from './format';

interface ExportExcelOptions {
  title: string;
  reportType: string;
  period?: string;
  userName: string;
  data: any[];
  headers: { header: string; key: string; width?: number; isCurrency?: boolean; isDate?: boolean; isDateTime?: boolean }[];
  summary?: { label: string; value: string | number; isCurrency?: boolean }[];
  fileName: string;
}

export async function exportToExcel({
  title,
  reportType,
  period,
  userName,
  data,
  headers,
  summary,
  fileName,
}: ExportExcelOptions) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(reportType);

  // 1. Add Header Info
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const exportTime = `${day}/${month}/${year} ${hours}:${minutes}`;

  worksheet.addRow(['SEWAIN - Property Management']).font = { bold: true, size: 14 };
  worksheet.addRow([title]).font = { bold: true, size: 12 };
  worksheet.addRow([`Jenis Laporan: ${reportType}`]);
  if (period) worksheet.addRow([`Periode: ${period}`]);
  worksheet.addRow([`Tanggal Export: ${exportTime}`]);
  worksheet.addRow([`Export Oleh: ${userName}`]);
  worksheet.addRow([]); // Spacer

  // 2. Add Table Headers
  const headerRow = worksheet.addRow(['No', ...headers.map(h => h.header)]);
  
  // Style Headers
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    cell.font = { bold: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // 3. Add Data Rows
  data.forEach((item, index) => {
    const rowValues = [
      index + 1,
      ...headers.map(h => {
        const val = item[h.key];
        if (val === null || val === undefined || val === '') return '-';
        if (h.isCurrency) return formatRupiah(val);
        if (h.isDate) return formatTanggal(val);
        if (h.isDateTime) {
          const d = new Date(val);
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          const HH = String(d.getHours()).padStart(2, '0');
          const MI = String(d.getMinutes()).padStart(2, '0');
          return `${dd}/${mm}/${yyyy} ${HH}:${MI}`;
        }
        return val;
      })
    ];
    const row = worksheet.addRow(rowValues);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { vertical: 'middle' };
    });
  });

  // 4. Add Summary
  if (summary && summary.length > 0) {
    worksheet.addRow([]); // Spacer
    summary.forEach(s => {
      const val = s.isCurrency ? formatRupiah(s.value as number) : s.value;
      const row = worksheet.addRow(['', '', '', s.label, val]);
      row.getCell(4).font = { bold: true };
      row.getCell(5).font = { bold: true };
    });
  }

  // 5. Auto width and Freeze Header
  worksheet.views = [{ state: 'frozen', ySplit: headerRow.number }];
  
  // Basic auto-width (ExcelJS doesn't have a perfect one, but we can estimate)
  worksheet.columns.forEach((column, i) => {
    let maxLength = 0;
    column?.eachCell?.({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(Math.max(maxLength + 2, 10), 50);
  });

  // Add Filters
  worksheet.autoFilter = {
    from: { row: headerRow.number, column: 1 },
    to: { row: headerRow.number, column: headers.length + 1 },
  };

  // 6. Generate and Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${fileName}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
