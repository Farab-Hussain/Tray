"use client";
import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  percentage: string;
  trend: "up" | "down";
  variant: "success" | "warning";
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  percentage,
  trend,
  variant,
  className = "",
}) => {
  const isPositive = trend === "up";
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const cardClasses = {
    success: "bg-green-100",
    warning: "bg-yellow-100",
  };

  const percentageClasses = {
    success: "text-green-600",
    warning: "text-black",
  };

  const iconClasses = {
    success: "text-green-600",
    warning: "text-black",
  };

  return (
    <div
      className={`rounded-xl p-5 shadow-sm flex flex-col justify-between ${cardClasses[variant]} ${className}`}
    >
      <h3 className="text-gray-700 text-sm font-medium mb-2">{title}</h3>
      <div className="flex items-end justify-between">
        <span className="text-black text-3xl font-bold">{value}</span>
        <div className="flex items-center space-x-1">
          <span className={`text-sm font-medium ${percentageClasses[variant]}`}>
            {percentage}
          </span>
          <TrendIcon size={16} className={`${iconClasses[variant]}`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
