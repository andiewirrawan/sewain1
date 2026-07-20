import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jenis: string }> }
) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format');
  const { jenis } = await params;
  
  // Fetch data again (simplification: same logic as route.ts)
  // ...
  
  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan');
    // ... add data to worksheet ...
    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=laporan_${jenis}.xlsx`,
      },
    });
  } else if (format === 'pdf') {
    const doc = new PDFDocument();
    // ... add data to doc ...
    const stream = new Promise<Buffer>((resolve) => {
        const buffers: any[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.end();
    });
    const buffer = await stream;
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=laporan_${jenis}.pdf`,
      },
    });
  }
  return NextResponse.json({ message: 'Format tidak didukung' }, { status: 400 });
}
