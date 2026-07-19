import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SEWAIN - Property Management System',
  description: 'Sistem Informasi Sewa Unit ERP Style',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body suppressHydrationWarning className={inter.className}>
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar />
          <div className="flex-1 flex flex-col lg:pl-60 transition-all duration-300">
            <Topbar />
            <main className="p-6 flex-1">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
