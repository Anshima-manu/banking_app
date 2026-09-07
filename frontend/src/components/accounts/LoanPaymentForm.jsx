import { useState } from "react";

import Button from "../ui/Button";
import ErrorMessage from "../ui/ErrorMessage";
import Input from "../ui/Input";

import {
  formatCurrency,
} from "../../utils/formatters";


export default function LoanPaymentForm({
  installment,
  loading = false,
  onSubmit,
  onCancel,
}) {
  const amountDue =
    Number(installment.amount_due);

  const amountPaid =
    Number(installment.amount_paid);

  const remainingAmount =
  Math.max(
    Math.round(
      (amountDue - amountPaid) * 100
    ) / 100,
    0
  );

  const [amount, setAmount] =
    useState("");

  const [error, setError] =
    useState("");


  function handleAmountChange(event) {
    setAmount(event.target.value);

    if (error) {
      setError("");
    }
  }


  function handlePayRemaining() {
    setAmount(
      remainingAmount.toFixed(2)
    );

    if (error) {
      setError("");
    }
  }


  async function handleSubmit(event) {
    event.preventDefault();

    const paymentAmount =
      Number(amount);

    if (
      !amount ||
      Number.isNaN(paymentAmount) ||
      paymentAmount <= 0
    ) {
      setError(
        "Enter a valid payment amount."
      );

      return;
    }

    if (
      paymentAmount >
      remainingAmount
    ) {
      setError(
        "Payment cannot exceed the remaining installment amount."
      );

      return;
    }

    try {
      setError("");

      await onSubmit(
        paymentAmount
      );
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail ||
        "Unable to process the loan payment.";

      setError(message);
    }
  }


  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <ErrorMessage
        message={error}
      />

      <div
        className="
          grid
          grid-cols-3
          gap-3
        "
      >
        <div
          className="
            rounded-2xl
            bg-gradient-to-br
            from-fuchsia-50
            to-purple-50
            p-4
          "
        >
          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-wide
              text-slate-400
            "
          >
            EMI
          </p>

          <p
            className="
              mt-2
              font-bold
              text-slate-900
            "
          >
            {formatCurrency(
              installment.amount_due
            )}
          </p>
        </div>

        <div
          className="
            rounded-2xl
            bg-gradient-to-br
            from-emerald-50
            to-teal-50
            p-4
          "
        >
          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-wide
              text-slate-400
            "
          >
            Paid
          </p>

          <p
            className="
              mt-2
              font-bold
              text-emerald-700
            "
          >
            {formatCurrency(
              installment.amount_paid
            )}
          </p>
        </div>

        <div
          className="
            rounded-2xl
            bg-gradient-to-br
            from-amber-50
            to-orange-50
            p-4
          "
        >
          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-wide
              text-slate-400
            "
          >
            Remaining
          </p>

          <p
            className="
              mt-2
              font-bold
              text-amber-700
            "
          >
            {formatCurrency(
              remainingAmount
            )}
          </p>
        </div>
      </div>

      <div
        className="
          rounded-2xl
          border
          border-slate-200
          bg-gradient-to-r
          from-white
          via-fuchsia-50/40
          to-rose-50/40
          p-4
        "
      >
        <p
          className="
            text-sm
            font-semibold
            text-slate-900
          "
        >
          Installment #{installment.installment_number}
        </p>

        <div
          className="
            mt-3
            grid
            grid-cols-2
            gap-4
          "
        >
          <div>
            <p
              className="
                text-xs
                font-medium
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Principal
            </p>

            <p
              className="
                mt-1
                text-sm
                font-semibold
                text-slate-800
              "
            >
              {formatCurrency(
                installment.principal_due
              )}
            </p>
          </div>

          <div>
            <p
              className="
                text-xs
                font-medium
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Interest
            </p>

            <p
              className="
                mt-1
                text-sm
                font-semibold
                text-slate-800
              "
            >
              {formatCurrency(
                installment.interest_due
              )}
            </p>
          </div>
        </div>
      </div>

      <Input
        id="loan_payment_amount"
        name="loan_payment_amount"
        label="Payment Amount"
        type="number"
        min="0.01"
        max={remainingAmount}
        step="0.01"
        value={amount}
        placeholder="Enter payment amount"
        required
        onChange={handleAmountChange}
      />

      <button
        type="button"
        onClick={handlePayRemaining}
        className="
          inline-flex
          items-center
          rounded-lg
          bg-fuchsia-50
          px-3
          py-2
          text-sm
          font-semibold
          text-fuchsia-700
          transition
          hover:bg-rose-50
          hover:text-rose-600
        "
      >
        Use full remaining amount:{" "}
        {formatCurrency(
          remainingAmount
        )}
      </button>

      <div
        className="
          flex
          items-center
          justify-end
          gap-3
          border-t
          border-slate-100
          pt-5
        "
      >
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={
            loading ||
            remainingAmount <= 0
          }
        >
          {loading
            ? "Processing..."
            : "Pay Installment"}
        </Button>
      </div>
    </form>
  );
}