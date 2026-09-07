import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  TrendingDown,
} from "lucide-react";

import Card from "../ui/Card";

import { formatCurrency } from "../../utils/formatters";

export default function LoanRepaymentProgress({
  installments = [],
  outstandingPrincipal = 0,
}) {
  const totalInstallments = installments.length;

  const paidInstallments = installments.filter(
    (installment) => installment.installment_status === "PAID",
  ).length;

  const overdueInstallments = installments.filter(
    (installment) => installment.installment_status === "OVERDUE",
  ).length;

  const totalAmountDue = installments.reduce(
    (total, installment) => total + Number(installment.amount_due || 0),
    0,
  );

  const totalAmountPaid = installments.reduce(
    (total, installment) => total + Number(installment.amount_paid || 0),
    0,
  );

  const remainingAmount = Math.max(totalAmountDue - totalAmountPaid, 0);

  const progressPercentage =
    totalAmountDue > 0
      ? Math.min(Math.round((totalAmountPaid / totalAmountDue) * 100), 100)
      : 0;

  const isFullyRepaid =
    totalInstallments > 0 &&
    paidInstallments === totalInstallments &&
    Number(outstandingPrincipal) === 0;

  return (
    <Card
      className="
        overflow-hidden
        bg-gradient-to-br
        from-white
        via-fuchsia-50/30
        to-rose-50/40
      "
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-6
        "
      >
        <div>
          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-[0.15em]
              text-fuchsia-600
            "
          >
            Loan Repayment
          </p>

          <h2
            className="
              mt-2
              text-xl
              font-bold
              text-slate-950
            "
          >
            Repayment Progress
          </h2>

          <p
            className="
              mt-1
              text-sm
              text-slate-500
            "
          >
            Overall payment progress for this Loan account.
          </p>
        </div>

        

        <div className="text-right">
          <p
            className="
              text-3xl
              font-bold
              text-fuchsia-700
            "
          >
            {progressPercentage}%
          </p>

          <p
            className="
              mt-1
              text-xs
              text-slate-400
            "
          >
            repaid
          </p>
        </div>
      </div>

      <div
        className="
          mt-6
          h-3
          overflow-hidden
          rounded-full
          bg-white
          shadow-inner
          ring-1
          ring-slate-200
        "
      >
        <div
          className="
            h-full
            rounded-full
            bg-gradient-to-r
            from-fuchsia-600
            via-purple-600
            to-rose-500
            transition-all
            duration-500
          "
          style={{
            width: `${progressPercentage}%`,
          }}
        />
      </div>

       {isFullyRepaid && (
  <div
    className="
      mt-6
      flex
      items-center
      gap-4
      rounded-2xl
      border
      border-emerald-200
      bg-gradient-to-r
      from-emerald-50
      via-teal-50
      to-emerald-50
      px-5
      py-4
    "
  >
    <div
      className="
        flex
        h-11
        w-11
        shrink-0
        items-center
        justify-center
        rounded-xl
        bg-emerald-500
        text-white
        shadow-md
        shadow-emerald-500/20
      "
    >
      <CheckCircle2 size={20} />
    </div>

    <div>
      <p
        className="
          font-bold
          text-emerald-900
        "
      >
        Loan Fully Repaid
      </p>

      <p
        className="
          mt-1
          text-sm
          text-emerald-700
        "
      >
        All installments have been paid and the
        outstanding principal is zero.
      </p>
    </div>
  </div>
)}

      <div
        className="
          mt-7
          grid
          grid-cols-4
          gap-4
        "
      >
        <div
          className="
            rounded-2xl
            bg-white/80
            p-4
            ring-1
            ring-slate-100
          "
        >
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-emerald-50
              text-emerald-600
            "
          >
            <CheckCircle2 size={17} />
          </div>

          <p
            className="
              mt-3
              text-xs
              font-medium
              uppercase
              tracking-wide
              text-slate-400
            "
          >
            Paid Installments
          </p>

          <p
            className="
              mt-1
              text-xl
              font-bold
              text-slate-950
            "
          >
            {paidInstallments}
            <span
              className="
                ml-1
                text-sm
                font-medium
                text-slate-400
              "
            >
              / {totalInstallments}
            </span>
          </p>
        </div>

        <div
          className="
            rounded-2xl
            bg-white/80
            p-4
            ring-1
            ring-slate-100
          "
        >
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-fuchsia-50
              text-fuchsia-600
            "
          >
            <CircleDollarSign size={17} />
          </div>

          <p
            className="
              mt-3
              text-xs
              font-medium
              uppercase
              tracking-wide
              text-slate-400
            "
          >
            Total Paid
          </p>

          <p
            className="
              mt-1
              text-lg
              font-bold
              text-slate-950
            "
          >
            {formatCurrency(totalAmountPaid)}
          </p>
        </div>

        <div
          className="
            rounded-2xl
            bg-white/80
            p-4
            ring-1
            ring-slate-100
          "
        >
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-amber-50
              text-amber-600
            "
          >
            <TrendingDown size={17} />
          </div>

          <p
            className="
              mt-3
              text-xs
              font-medium
              uppercase
              tracking-wide
              text-slate-400
            "
          >
            Remaining Payments
          </p>

          <p
            className="
              mt-1
              text-lg
              font-bold
              text-slate-950
            "
          >
            {formatCurrency(remainingAmount)}
          </p>

          <p
            className="
              mt-1
              text-xs
              text-slate-400
            "
          >
            Principal outstanding {formatCurrency(outstandingPrincipal)}
          </p>
        </div>

        <div
          className="
            rounded-2xl
            bg-white/80
            p-4
            ring-1
            ring-slate-100
          "
        >
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-rose-50
              text-rose-600
            "
          >
            <Clock3 size={17} />
          </div>

          <p
            className="
              mt-3
              text-xs
              font-medium
              uppercase
              tracking-wide
              text-slate-400
            "
          >
            Overdue
          </p>

          <p
            className="
              mt-1
              text-xl
              font-bold
              text-slate-950
            "
          >
            {overdueInstallments}
          </p>

          <p
            className="
              mt-1
              text-xs
              text-slate-400
            "
          >
            installments
          </p>
        </div>
      </div>
    </Card>
  );
}
