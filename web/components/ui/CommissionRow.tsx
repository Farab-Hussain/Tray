"use client";
import React from "react";
import { Diamond } from "lucide-react";
import StatusBadge from "./StatusBadge";

export interface CommissionRowProps {
  serviceId: string;
  date: string;
  amount: string;
  payoutStatus: "paid" | "pending" | "failed" | "cancelled";
  onServiceIdClick?: (serviceId: string) => void;
  className?: string;
}

const CommissionRow: React.FC<CommissionRowProps> = ({
  serviceId,
  date,
  amount,
  payoutStatus,
  onServiceIdClick,
  className = "",
}) => {
  const handleServiceIdClick = () => {
    onServiceIdClick?.(serviceId);
  };

  const isNegativeAmount = amount.startsWith("$-");

  return (
    <div
      className={`bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200 ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
        {/* Service ID */}
        <div className="flex items-center space-x-2">
          <Diamond className="h-4 w-4 text-gray-600 flex-shrink-0" />
          <button
            onClick={handleServiceIdClick}
            className="text-blue-600 hover:text-blue-800 underline text-sm font-medium transition-colors duration-200"
          >
            {serviceId}
          </button>
        </div>

        {/* Date */}
        <div className="text-gray-700 text-sm font-medium">
          {date}
        </div>

        {/* Amount */}
        <div className={`text-sm font-semibold ${isNegativeAmount ? "text-red-600" : "text-green-600"}`}>
          {amount}
        </div>

        {/* Payout Status */}
        <div className="flex justify-start sm:justify-end">
          <StatusBadge status={payoutStatus} />
        </div>
      </div>
    </div>
  );
};

export default CommissionRow;
