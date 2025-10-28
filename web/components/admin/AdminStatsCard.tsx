import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminStatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'yellow' | 'green' | 'red' | 'blue';
  subtitle?: string;
  onClick?: () => void;
}

const AdminStatsCard: React.FC<AdminStatsCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  onClick,
}) => {
  const colorClasses = {
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      icon: 'text-yellow-600',
      border: 'border-yellow-200',
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      icon: 'text-green-600',
      border: 'border-green-200',
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      icon: 'text-red-600',
      border: 'border-red-200',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      icon: 'text-blue-600',
      border: 'border-blue-200',
    },
  };

  const styles = colorClasses[color];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border ${styles.border} p-6 ${
        onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${styles.text}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-full ${styles.bg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${styles.icon}`} />
        </div>
      </div>
    </div>
  );
};

export default AdminStatsCard;

