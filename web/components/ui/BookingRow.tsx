"use client";
import React from "react";
import { Diamond } from "lucide-react";
import StatusBadge from "./StatusBadge";

export interface BookingRowProps {
  clientName: string;
  consultantName: string;
  date: string;
  status: "completed" | "in-progress" | "pending" | "cancelled";
  onViewDetails?: (clientName: string, consultantName: string) => void;
  className?: string;
}

const BookingRow: React.FC<BookingRowProps> = ({
  clientName,
  consultantName,
  date,
  status,
  onViewDetails,
  className = "",
}) => {
  const handleViewDetails = () => {
    onViewDetails?.(clientName, consultantName);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "paid";
      case "in-progress":
        return "pending";
      case "pending":
        return "pending";
      case "cancelled":
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
      case "cancelled":
        return "Cancelled";
      default:
        return "Pending";
    }
  };

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-5 gap-4 items-center py-3 px-4 hover:bg-gray-50 transition-colors duration-200 ${className}`}
    >
      {/* Client Name */}
      <div className="flex items-center space-x-2">
        <Diamond className="h-4 w-4 text-gray-600 flex-shrink-0" />
        <span className="text-gray-900 text-sm font-medium">{clientName}</span>
      </div>

      {/* Consultant Name */}
      <div className="text-gray-700 text-sm font-medium">
        {consultantName}
      </div>

      {/* Date */}
      <div className="text-gray-700 text-sm font-medium">
        {date}
      </div>

      {/* Status */}
      <div className="flex justify-start sm:justify-center">
        <StatusBadge 
          status={getStatusVariant(status)}
          className={status === "in-progress" ? "bg-yellow-100 text-yellow-800" : ""}
        >
          {getStatusLabel(status)}
        </StatusBadge>
      </div>

      {/* Action */}
      <div className="flex justify-start sm:justify-end">
        <button
          onClick={handleViewDetails}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium underline transition-colors duration-200"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default BookingRow;
