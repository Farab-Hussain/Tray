"use client";
import React from "react";
import { Diamond } from "lucide-react";
import StatusBadge from "./StatusBadge";

export interface ConsultantPayoutRowProps {
  consultantName: string;
  totalEarned: string;
  platformCommission: string;
  payoutStatus: "paid" | "pending" | "failed";
  onConsultantClick?: (consultantName: string) => void;
  className?: string;
}

const ConsultantPayoutRow: React.FC<ConsultantPayoutRowProps> = ({
  consultantName,
  totalEarned,
  platformCommission,
  payoutStatus,
  onConsultantClick,
  className = "",
}) => {
  const handleConsultantClick = () => {
    onConsultantClick?.(consultantName);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "paid";
      case "pending":
        return "pending";
      case "failed":
        return "failed";
      default:
        return "pending";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Paid";
      case "pending":
        return "Pending";
      case "failed":
        return "Failed";
      default:
        return "Pending";
    }
  };

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-4 gap-4 items-center py-3 px-4 hover:bg-gray-50 transition-colors duration-200 ${className}`}
    >
      {/* Consultant Name */}
      <div className="flex items-center space-x-2">
        <Diamond className="h-4 w-4 text-gray-600 flex-shrink-0" />
        <button
          onClick={handleConsultantClick}
          className="text-gray-900 text-sm font-medium hover:text-blue-600 transition-colors duration-200"
        >
          {consultantName}
        </button>
      </div>

      {/* Total Earned */}
      <div className="text-gray-700 text-sm font-medium">
        {totalEarned}
      </div>

      {/* Platform Commission */}
      <div className="text-red-600 text-sm font-medium">
        {platformCommission}
      </div>

      {/* Payout Status */}
      <div className="flex justify-start sm:justify-center">
        <StatusBadge 
          status={getStatusVariant(payoutStatus)}
          className={payoutStatus === "pending" ? "bg-yellow-100 text-yellow-800" : ""}
        >
          {getStatusLabel(payoutStatus)}
        </StatusBadge>
      </div>
    </div>
  );
};

export default ConsultantPayoutRow;
