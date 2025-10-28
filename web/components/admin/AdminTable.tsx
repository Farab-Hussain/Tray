'use client';

import React from 'react';

interface AdminTableProps {
  children: React.ReactNode;
  className?: string;
  minWidth?: string;
}

const AdminTable: React.FC<AdminTableProps> = ({ 
  children, 
  className = '', 
  minWidth = '600px' 
}) => {
  return (
    <div 
      className={`admin-table-container overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 ${className}`}
      style={{ 
        minWidth: '100%',
        WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
      }}
    >
      <table className="w-full divide-y divide-gray-200" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
};

export default AdminTable;
