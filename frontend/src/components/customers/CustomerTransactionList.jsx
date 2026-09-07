import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  ReceiptText,
  WalletCards,
} from "lucide-react";

import EmptyState from "../ui/EmptyState";
import StatusBadge from "../ui/StatusBadge";

import {
  formatCurrency,
  formatDateTime,
  maskAccountNumber,
} from "../../utils/formatters";


export default function CustomerTransactionList({
  transactions = [],
}) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={ReceiptText}
        title="No transactions yet"
        description="Transactions from this customer's accounts will appear here."
      />
    );
  }


  return (
    <div className="divide-y divide-slate-100">
      {transactions.map((transaction) => {
        const isSavings =
          transaction.account_type === "SAVINGS";

        const isIncoming =
          transaction.transaction_type === "DEPOSIT" ||
          transaction.transaction_type === "INTEREST_CREDIT";

        const AccountIcon =
          isSavings
            ? WalletCards
            : Landmark;


        return (
          <div
            key={transaction.transaction_id}
            className="
              grid
              grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_160px]
              items-center
              gap-6
              px-5
              py-4
              transition
              hover:bg-slate-50
            "
          >
            <div className="flex min-w-0 items-center gap-4">
              <div
                className={`
                  flex
                  h-11
                  w-11
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
                  <ArrowDownLeft size={19} />
                ) : (
                  <ArrowUpRight size={19} />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {transaction.transaction_type.replaceAll(
                      "_",
                      " "
                    )}
                  </p>

                  <StatusBadge
                    value={transaction.transaction_type}
                    type="transaction"
                  />
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  {formatDateTime(
                    transaction.transaction_time
                  )}
                </p>

                {transaction.description && (
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {transaction.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-violet-50
                  text-violet-700
                "
              >
                <AccountIcon size={17} />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {transaction.account_type}
                </p>

                <p className="mt-1 font-mono text-xs text-slate-400">
                  {maskAccountNumber(
                    transaction.account_number
                  )}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Reference
              </p>

              <p className="mt-1 truncate font-mono text-xs text-slate-600">
                {transaction.reference_number}
              </p>
            </div>

            <div className="text-right">
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
                {formatCurrency(
                  transaction.amount
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Balance{" "}
                {formatCurrency(
                  transaction.balance_after
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}