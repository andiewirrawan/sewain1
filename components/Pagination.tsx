
'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  total: number;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  limit, 
  onLimitChange,
  total 
}: PaginationProps) {
  const current = Math.max(1, Number(currentPage) || 1);
  const totalP = Math.max(0, Number(totalPages) || 0);
  const tot = Math.max(0, Number(total) || 0);
  const lim = Math.max(1, Number(limit) || 10);

  if (tot === 0) return null;

  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, current - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalP, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-4 order-2 sm:order-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Tampilkan:</span>
          <select 
            value={lim}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <p className="text-xs text-slate-500">
          Menampilkan <span className="font-semibold text-slate-700">{(current - 1) * lim + 1}</span> - <span className="font-semibold text-slate-700">{Math.min(current * lim, tot)}</span> dari <span className="font-semibold text-slate-700">{tot}</span> data
        </p>
      </div>

      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(current - 1)}
          disabled={current === 1}
          className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Previous"
        >
          <ChevronLeft size={18} />
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className={`w-8 h-8 rounded text-xs font-medium transition-colors ${current === 1 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              1
            </button>
            {startPage > 2 && <span className="px-1 text-slate-400 text-xs">...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded text-xs font-medium transition-colors ${current === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {page}
          </button>
        ))}

        {endPage < totalP && (
          <>
            {endPage < totalP - 1 && <span className="px-1 text-slate-400 text-xs">...</span>}
            <button
              onClick={() => onPageChange(totalP)}
              className={`w-8 h-8 rounded text-xs font-medium transition-colors ${current === totalP ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {totalP}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(current + 1)}
          disabled={current === totalP || totalP === 0}
          className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Next"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
