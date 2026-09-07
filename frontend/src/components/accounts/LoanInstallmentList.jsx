import { CalendarDays, CheckCircle2, Clock3 } from "lucide-react";

import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";

import { formatCurrency, formatDate } from "../../utils/formatters";

function getStatusStyle(status) {
  if (status === "PAID") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }

  if (status === "PARTIAL") {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }

  if (status === "OVERDUE") {
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  }

  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
}

function getRemainingAmount(installment) {
  const amountDue = Number(
    installment.amount_due
  );

  const amountPaid = Number(
    installment.amount_paid
  );

  return Math.max(
    Math.round(
      (amountDue - amountPaid) * 100
    ) / 100,
    0
  );
}

export default function LoanInstallmentList({
  installments = [],
  accountStatus,
  onPay,
}) {
  if (installments.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No installments found"
        description="The repayment schedule for this Loan account is not available."
      />
    );
  }

  const accountIsActive = accountStatus === "ACTIVE";

  return (
    <div className="divide-y divide-slate-100">
      {installments.map((installment) => {
        const remainingAmount = getRemainingAmount(installment);

        const isPaid = installment.installment_status === "PAID";

        const isOverdue = installment.installment_status === "OVERDUE";

        return (
          <div
            key={installment.installment_id}
            className={`
                grid
                grid-cols-[100px_140px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_110px_150px]
                // grid-cols-1 md:grid-cols-2 lg:grid-cols-7
                

                items-center
                gap-5
                border-l-4
                px-5
                py-4
                transition
                ${
                    isOverdue
                    ? "border-l-rose-500 bg-gradient-to-r from-rose-50/70 via-white to-white"
                    : "border-l-transparent hover:bg-fuchsia-50/30"
                }
            `}
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Installment
              </p>

              <p className="mt-1 font-bold text-slate-900">
                #{installment.installment_number}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Due Date
              </p>

              <div className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                <CalendarDays size={14} className="text-fuchsia-600" />

                {formatDate(installment.due_date)}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                EMI
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {formatCurrency(installment.amount_due)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Principal / Interest
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {formatCurrency(installment.principal_due)}
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                Interest {formatCurrency(installment.interest_due)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Payment
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                Paid {formatCurrency(installment.amount_paid)}
              </p>

              <p
                className={`
                    mt-0.5
                    text-xs
                    ${
                    isOverdue
                        ? "font-semibold text-rose-600"
                        : "text-slate-400"
                    }
                `}
                >
                {isOverdue
                    ? "Overdue "
                    : "Remaining "}

                {formatCurrency(
                    remainingAmount
                )}
              </p>
            </div>

            <div>
              <span
                className={`
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  px-2.5
                  py-1
                  text-xs
                  font-semibold
                  ${getStatusStyle(installment.installment_status)}
                `}
              >
                {isPaid ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}

                {installment.installment_status}
              </span>
            </div>

            <div className="text-right">
              {isPaid ? (
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Paid</p>

                  <p className="mt-1 text-xs text-slate-400">
                    {installment.paid_at ? formatDate(installment.paid_at) : ""}
                  </p>
                </div>
              ) : (
                <Button
                  size="md"
                  disabled={!accountIsActive}
                  onClick={() => {
                    onPay(installment);
                  }}
                >
                  Pay Installment
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
