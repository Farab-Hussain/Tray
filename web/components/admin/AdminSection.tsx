'use client';

import React from 'react';

interface AdminSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

const AdminSection: React.FC<AdminSectionProps> = ({
  title,
  subtitle,
  children,
  className = ''
}) => {
  return (
    <div className={`mb-6 sm:mb-8 ${className}`}>
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        {subtitle && (
          <p className="text-sm sm:text-base text-gray-600">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
};

export default AdminSection;
