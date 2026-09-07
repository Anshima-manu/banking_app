import { ArrowDownLeft, ArrowUpRight, ReceiptText } from "lucide-react";

import EmptyState from "../ui/EmptyState";

import { formatCurrency, formatDateTime } from "../../utils/formatters";
import StatusBadge from "../ui/StatusBadge";

export default function TransactionList({ transactions = [] }) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={ReceiptText}
        title="No transactions yet"
        description="Financial activity for this account will appear here."
      />
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {transactions.map((transaction) => {
        const isDeposit = transaction.transaction_type === "DEPOSIT";

        const isWithdrawal = transaction.transaction_type === "WITHDRAWAL";

        const isIncoming =
          isDeposit || transaction.transaction_type === "INTEREST_CREDIT";

        return (
          <div
            key={transaction.transaction_id}
            className="
              grid
              grid-cols-1
              items-center
              gap-3
              px-5
              py-3
              transition
              hover:bg-slate-50
              sm:grid-cols-[minmax(180px,1fr)_auto]
            "
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  ${
                    isIncoming
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-600"
                  }
                `}
              >
                {isIncoming ? (
                  <ArrowDownLeft size={16} />
                ) : (
                  <ArrowUpRight size={16} />
                )}
              </div>

              <p
                className="
                    text-sm
                    font-semibold
                    uppercase
                  tracking-wide
                    text-slate-900
                  "
              >
                {transaction.transaction_type.replaceAll("_", " ")}
              </p>
              <StatusBadge
                  
                  value={transaction.transaction_type.replaceAll("_", " ")}
                  type="transaction"
                />


            </div>

            <div className="min-w-0">
              <p className="text-xs text-slate-400">
                {formatDateTime(transaction.transaction_time)}
              </p>

              {transaction.description && (
                <p className="mt-1 truncate text-sm text-slate-600">
                  {transaction.description}
                </p>
              )}

              <p className="mt-1 truncate font-mono text-[11px] text-slate-400">
                {transaction.reference_number}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p
                className={`
                  text-sm
                  font-bold
                  ${
                    isIncoming
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }
                `}
              >
                {isIncoming ? "+" : "-"}
                {formatCurrency(transaction.amount)}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Balance {formatCurrency(transaction.balance_after)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
