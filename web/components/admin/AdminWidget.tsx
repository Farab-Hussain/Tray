'use client';

import React, { useState } from 'react';
import { LucideIcon, ChevronDown, ChevronUp } from 'lucide-react';

interface AdminWidgetProps {
  id: string;
  title: string;
  icon: LucideIcon;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  color: 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray';
  expanded?: boolean;
  onToggle?: (id: string) => void;
  children?: React.ReactNode;
}

const AdminWidget: React.FC<AdminWidgetProps> = ({
  id,
  title,
  icon: Icon,
  value,
  change,
  color,
  expanded = false,
  onToggle,
  children
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-50 border-green-200 text-green-600';
      case 'red':
        return 'bg-red-50 border-red-200 text-red-600';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200 text-yellow-600';
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-600';
      case 'purple':
        return 'bg-purple-50 border-purple-200 text-purple-600';
      case 'gray':
        return 'bg-gray-50 border-gray-200 text-gray-600';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded ${getColorClasses(color)}`}>
            <Icon className="w-3 h-3" />
          </div>
          <span className="text-xs font-medium text-gray-600">{title}</span>
        </div>
        {onToggle && (
          <button
            onClick={() => onToggle(id)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-3 h-3 text-gray-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-gray-400" />
            )}
          </button>
        )}
      </div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
      {expanded && change && (
        <div className="mt-1 flex items-center gap-1">
          <span className={`text-xs font-medium ${
            change.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {change.isPositive ? '+' : ''}{change.value}%
          </span>
          <span className="text-xs text-gray-500">vs last week</span>
        </div>
      )}
      {expanded && children && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
};

export default AdminWidget;
