'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PengaturanPage() {
  const [role, setRole] = useState(null); // In real app, fetch user role
  const router = useRouter();

  // Mock role check for now
  useEffect(() => {
    // If not owner, router.push('/dashboard')
  }, []);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Pengaturan</h1>
      {/* 5 sections: Tarif, User, Backup, Reset, Audit */}
    </div>
  );
}
