import { useState } from "react";

import Button from "../ui/Button";
import ErrorMessage from "../ui/ErrorMessage";
import Input from "../ui/Input";
import Select from "../ui/Select";


const accountTypeOptions = [
  {
    value: "SAVINGS",
    label: "Savings Account",
  },
  {
    value: "LOAN",
    label: "Loan Account",
  },
];


const initialFormData = {
  account_type: "",
  opening_balance: "",
  interest_rate: "",
  minimum_balance: "",
  daily_withdrawal_limit: "",
  principal_amount: "",
  tenure_months: "",
  repayment_start_date: "",
};


export default function AccountForm({
  loading = false,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState(
    initialFormData
  );

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

    if (!formData.account_type) {
      setError("Select an account type.");
      return;
    }

    let payload;


    if (formData.account_type === "SAVINGS") {
      const openingBalance = Number(formData.opening_balance);
      const minimumBalance = Number(formData.minimum_balance);

      if (
        formData.opening_balance === "" ||
        formData.minimum_balance === "" ||
        Number.isNaN(openingBalance) ||
        Number.isNaN(minimumBalance)
      ) {
        setError("Opening balance and minimum balance are required.");
        return;
      }

      if (openingBalance < minimumBalance) {
        setError(
          "Opening balance must be greater than or equal to the minimum balance."
        );
        return;
      }

      payload = {
        account_type: "SAVINGS",
        opening_balance: formData.opening_balance,
        savings_profile: {
          minimum_balance: formData.minimum_balance,
          daily_withdrawal_limit:
            formData.daily_withdrawal_limit,
        },
        loan_profile: null,
      };
    }


    if (formData.account_type === "LOAN") {
      if (
        !formData.principal_amount ||
        !formData.interest_rate ||
        !formData.tenure_months ||
        !formData.repayment_start_date
      ) {
        setError(
          "Complete all Loan account fields."
        );

        return;
      }

      payload = {
        account_type: "LOAN",
        savings_profile: null,
        loan_profile: {
          principal_amount: formData.principal_amount,
          interest_rate: formData.interest_rate,
          tenure_months: Number(formData.tenure_months),
          repayment_start_date: formData.repayment_start_date,
        },
      };
    }


    try {
      setError("");

      await onSubmit(payload);
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail ||
        "Unable to create account.";

      setError(message);
    }
  }


  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <ErrorMessage message={error} />

      <Select
        id="account_type"
        name="account_type"
        label="Account Type"
        value={formData.account_type}
        placeholder="Select account type"
        options={accountTypeOptions}
        required
        onChange={handleChange}
      />

      {formData.account_type === "SAVINGS" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            id="opening_balance"
            name="opening_balance"
            label="Opening Balance"
            type="number"
            min={formData.minimum_balance || "0"}
            step="0.01"
            value={formData.opening_balance}
            placeholder="0.00"
            required
            onChange={handleChange}
          />

          <Input
            id="minimum_balance"
            name="minimum_balance"
            label="Minimum Balance"
            type="number"
            min="0"
            step="0.01"
            value={formData.minimum_balance}
            placeholder="5000"
            required
            onChange={handleChange}
          />

          <Input
            id="daily_withdrawal_limit"
            name="daily_withdrawal_limit"
            label="Daily Withdrawal Limit"
            type="number"
            min="0.01"
            step="0.01"
            value={
              formData.daily_withdrawal_limit
            }
            placeholder="50000"
            required
            onChange={handleChange}
            className="sm:col-span-2"
          />
        </div>
      )}

      {formData.account_type === "LOAN" && (
        <div
          className="
            grid
            gap-5
            sm:grid-cols-2
          "
        >
          <Input
            id="principal_amount"
            name="principal_amount"
            label="Principal Amount"
            type="number"
            min="0.01"
            step="0.01"
            value={formData.principal_amount}
            placeholder="500000"
            required
            onChange={handleChange}
          />

          <Input
            id="interest_rate"
            name="interest_rate"
            label="Interest Rate (%)"
            type="number"
            min="0"
            max="100"
            step="0.001"
            value={formData.interest_rate}
            placeholder="8.5"
            required
            onChange={handleChange}
          />

          <Input
            id="tenure_months"
            name="tenure_months"
            label="Tenure (Months)"
            type="number"
            min="1"
            step="1"
            value={formData.tenure_months}
            placeholder="60"
            required
            onChange={handleChange}
          />

          <Input
            id="repayment_start_date"
            name="repayment_start_date"
            label="Repayment Start Date"
            type="date"
            value={
              formData.repayment_start_date
            }
            required
            onChange={handleChange}
          />
        </div>
      )}

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
          disabled={
            loading ||
            !formData.account_type
          }
        >
          {loading
            ? "Creating..."
            : "Create Account"}
        </Button>
      </div>
    </form>
  );
}