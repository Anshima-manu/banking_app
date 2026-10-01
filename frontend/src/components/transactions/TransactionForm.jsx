import { useState } from "react";

import Button from "../ui/Button";
import ErrorMessage from "../ui/ErrorMessage";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";


export default function TransactionForm({
  transactionType,
  loading = false,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
  });

  const [error, setError] = useState("");


  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }


  async function handleSubmit(event) {
    event.preventDefault();

    const amount = Number(formData.amount);

    if (!formData.amount || amount <= 0) {
      setError("Enter a valid transaction amount.");
      return;
    }

    const payload = {
      amount: formData.amount,
      description:
        formData.description.trim() || null,
    };

    try {
      setError("");
      await onSubmit(payload);
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail ||
        `Unable to process ${transactionType.toLowerCase()}.`;

      setError(message);
    }
  }


  const isDeposit =
    transactionType === "DEPOSIT";

  const actionLabel =
    isDeposit
      ? "Deposit"
      : "Withdraw";


  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <ErrorMessage message={error} />

      <div
        className="
          rounded-2xl
          border
          border-violet-100
          bg-gradient-to-br
          from-violet-50
          to-indigo-50
          p-4
        "
      >
        <p
          className="
            text-xs
            font-semibold
            uppercase
            tracking-wide
            text-violet-600
          "
        >
          Transaction Type
        </p>

        <p
          className="
            mt-1
            font-semibold
            text-slate-900
          "
        >
          {isDeposit
            ? "Deposit"
            : "Withdrawal"}
        </p>
      </div>

      <Input
        id="amount"
        name="amount"
        label="Amount"
        type="number"
        min="0.01"
        step="0.01"
        value={formData.amount}
        placeholder="Enter amount"
        required
        onChange={handleChange}
      />

      <Textarea
        id="description"
        name="description"
        label="Description"
        value={formData.description}
        placeholder="Optional transaction note"
        rows={3}
        onChange={handleChange}
      />

      <div
        className="
          flex
          flex-col-reverse
          gap-3
          border-t
          border-slate-100
          pt-5
          sm:flex-row
          sm:justify-end
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
          disabled={loading}
          variant={isDeposit ? "primary" : "dark"}
        >
          {loading
            ? "Processing..."
            : actionLabel}
        </Button>
      </div>
    </form>
  );
}