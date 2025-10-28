"use client";
import React from "react";
import { MoreHorizontal } from "lucide-react";
import TransactionRow from "./TransactionRow";
import Button from "../custom/Button";

export interface Transaction {
  id: string;
  clientName: string;
  date: string;
  amount: string;
  status: "completed" | "in-progress" | "pending" | "failed";
}

export interface FundsTransactionsTableProps {
  transactions: Transaction[];
  onClientClick?: (clientName: string) => void;
  onOptionsClick?: () => void;
  className?: string;
}

const FundsTransactionsTable: React.FC<FundsTransactionsTableProps> = ({
  transactions,
  onClientClick,
  onOptionsClick,
  className = "",
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Funds Transactions</h2>
        <Button
          variant="ghost"
          size="sm"
          icon={MoreHorizontal}
          onClick={onOptionsClick}
          className="p-2"
        >
          {""}
        </Button>
      </div>

      {/* Table Headers - Hidden on mobile */}
      <div className="hidden sm:grid sm:grid-cols-4 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Client Name
        </div>
        <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Date
        </div>
        <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Amount
        </div>
        <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide text-right">
          Status
        </div>
      </div>

      {/* Transaction Rows */}
      <div className="divide-y divide-gray-200">
        {transactions.map((transaction, index) => (
          <TransactionRow
            key={`${transaction.id}-${index}`}
            clientName={transaction.clientName}
            date={transaction.date}
            amount={transaction.amount}
            status={transaction.status}
            onClientClick={onClientClick}
          />
        ))}
      </div>

      {/* Empty State */}
      {transactions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No transactions found
          </h3>
          <p className="text-gray-500">
            No transaction data available for the selected period.
          </p>
        </div>
      )}
    </div>
  );
};

export default FundsTransactionsTable;
