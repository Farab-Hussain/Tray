"use client";
import React from "react";
import { Diamond } from "lucide-react";
import StatusBadge from "./StatusBadge";

export interface TransactionRowProps {
  clientName: string;
  date: string;
  amount: string;
  status: "completed" | "in-progress" | "pending" | "failed";
  onClientClick?: (clientName: string) => void;
  className?: string;
}

const TransactionRow: React.FC<TransactionRowProps> = ({
  clientName,
  date,
  amount,
  status,
  onClientClick,
  className = "",
}) => {
  const handleClientClick = () => {
    onClientClick?.(clientName);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "paid";
      case "in-progress":
        return "pending";
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
      case "completed":
        return "Completed";
      case "in-progress":
        return "In Progress";
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
      {/* Client Name */}
      <div className="flex items-center space-x-2">
        <Diamond className="h-4 w-4 text-gray-600 flex-shrink-0" />
        <button
          onClick={handleClientClick}
          className="text-gray-900 hover:text-blue-600 text-sm font-medium transition-colors duration-200"
        >
          {clientName}
        </button>
      </div>

      {/* Date */}
      <div className="text-gray-700 text-sm font-medium">
        {date}
      </div>

      {/* Amount */}
      <div className="text-gray-900 text-sm font-semibold">
        {amount}
      </div>

      {/* Status */}
      <div className="flex justify-start sm:justify-end">
        <StatusBadge 
          status={getStatusVariant(status)}
          className="bg-yellow-100 text-yellow-800"
        >
          {getStatusLabel(status)}
        </StatusBadge>
      </div>
    </div>
  );
};

export default TransactionRow;
