'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  count?: number;
  onClick: () => void;
}

const AdminActionCard: React.FC<AdminActionCardProps> = ({
  title,
  description,
  icon: Icon,
  color = 'blue',
  count,
  onClick
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100',
    green: 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100',
    red: 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100',
    purple: 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100',
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 sm:p-6 border rounded-xl transition-all duration-200 text-left group ${colorClasses[color]}`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`p-2 sm:p-3 rounded-lg bg-white flex-shrink-0 ${iconColorClasses[color]}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 group-hover:text-gray-700 truncate">
              {title}
            </h3>
            {count !== undefined && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                color === 'green' ? 'bg-green-100 text-green-800' :
                color === 'red' ? 'bg-red-100 text-red-800' :
                color === 'blue' ? 'bg-blue-100 text-blue-800' :
                color === 'purple' ? 'bg-purple-100 text-purple-800' :
                'bg-indigo-100 text-indigo-800'
              }`}>
                {count}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-600 group-hover:text-gray-500 line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
};

export default AdminActionCard;
