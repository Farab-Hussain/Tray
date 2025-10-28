"use client";
import React from "react";

export interface StatusBadgeProps {
  status: "paid" | "pending" | "failed" | "cancelled";
  children?: React.ReactNode;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children,
  className = "",
}) => {
  const statusConfig = {
    paid: {
      bgColor: "bg-green-100",
      textColor: "text-green-800",
      label: "Paid To Broker",
    },
    pending: {
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-800",
      label: "Payment Pending",
    },
    failed: {
      bgColor: "bg-red-100",
      textColor: "text-red-800",
      label: "Payment Failed",
    },
    cancelled: {
      bgColor: "bg-gray-100",
      textColor: "text-gray-800",
      label: "Cancelled",
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor} ${className}`}
    >
      {children || config.label}
    </span>
  );
};

export default StatusBadge;
