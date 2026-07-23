
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
  if (total === 0) return null;

  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
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
            value={limit}
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
          Menampilkan <span className="font-semibold text-slate-700">{(currentPage - 1) * limit + 1}</span> - <span className="font-semibold text-slate-700">{Math.min(currentPage * limit, total)}</span> dari <span className="font-semibold text-slate-700">{total}</span> data
        </p>
      </div>

      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Previous"
        >
          <ChevronLeft size={18} />
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className={`w-8 h-8 rounded text-xs font-medium transition-colors ${currentPage === 1 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
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
            className={`w-8 h-8 rounded text-xs font-medium transition-colors ${currentPage === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-1 text-slate-400 text-xs">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className={`w-8 h-8 rounded text-xs font-medium transition-colors ${currentPage === totalPages ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Next"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
