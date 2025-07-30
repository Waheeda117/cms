import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  hasNextPage, 
  hasPrevPage, 
  onPageChange,
  onLimitChange 
}) => {
  const { theme } = useTheme();

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than or equal to maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      // Calculate start and end for middle pages
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Add ellipsis if needed
      if (start > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // Show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePageClick = (page) => {
    if (page !== '...' && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    onLimitChange(newLimit);
  };

  // Calculate showing range
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between py-4 px-6 ${theme.borderSecondary} border-t`}>
      {/* Items per page selector */}
      <div className="flex items-center space-x-2 mb-4 sm:mb-0">
        <span className={`text-sm ${theme.textMuted}`}>Show</span>
        <select
          value={itemsPerPage}
          onChange={handleLimitChange}
          className={`px-3 py-1 rounded-md ${theme.input} ${theme.borderSecondary} border ${theme.textPrimary} text-sm focus:outline-none ${theme.focus} focus:ring-1`}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className={`text-sm ${theme.textMuted}`}>entries</span>
      </div>

      {/* Page info */}
      <div className={`text-sm ${theme.textMuted} mb-4 sm:mb-0`}>
        Showing {startItem} to {endItem} of {totalItems} entries
      </div>

      {/* Pagination controls */}
      <div className="flex items-center space-x-1">
        {/* Previous button */}
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={!hasPrevPage}
          className={`p-2 rounded-md ${
            hasPrevPage 
              ? `${theme.cardSecondary} hover:bg-opacity-70 ${theme.textPrimary}` 
              : `${theme.cardSecondary} ${theme.textMuted} cursor-not-allowed opacity-50`
          } transition-colors`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {pageNumbers.map((page, index) => (
          <button
            key={index}
            onClick={() => handlePageClick(page)}
            disabled={page === '...'}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              page === currentPage
                ? `bg-gradient-to-r ${theme.buttonGradient} text-white`
                : page === '...'
                ? `${theme.textMuted} cursor-default`
                : `${theme.cardSecondary} hover:bg-opacity-70 ${theme.textPrimary}`
            }`}
          >
            {page === '...' ? <MoreHorizontal className="w-4 h-4" /> : page}
          </button>
        ))}

        {/* Next button */}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={!hasNextPage}
          className={`p-2 rounded-md ${
            hasNextPage 
              ? `${theme.cardSecondary} hover:bg-opacity-70 ${theme.textPrimary}` 
              : `${theme.cardSecondary} ${theme.textMuted} cursor-not-allowed opacity-50`
          } transition-colors`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;