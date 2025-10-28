'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminStatItemProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
}

const AdminStatItem: React.FC<AdminStatItemProps> = ({
  label,
  value,
  icon: Icon,
  color = 'gray'
}) => {
  const colorClasses = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    gray: 'text-gray-600',
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`w-4 h-4 ${colorClasses[color]}`} />}
        <span className="text-gray-600">{label}</span>
      </div>
      <span className={`font-semibold ${colorClasses[color]}`}>{value}</span>
    </div>
  );
};

export default AdminStatItem;
