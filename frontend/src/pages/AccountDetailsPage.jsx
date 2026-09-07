import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Landmark,
  Percent,
  WalletCards,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getAccount,
  getLoanInstallments,
  getLoanProfile,
  getSavingsProfile,
  payLoanInstallment,
} from "../api/accountApi";

import {
  depositFunds,
  getTransactions,
  withdrawFunds,
} from "../api/transactionApi";

import AccountStatusActions from "../components/accounts/AccountStatusActions";
import TransactionForm from "../components/transactions/TransactionForm";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorMessage from "../components/ui/ErrorMessage";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import StatusBadge from "../components/ui/StatusBadge";
import TransactionList from "../components/transactions/TransactionList";
import LoanInstallmentList from "../components/accounts/LoanInstallmentList";
import LoanPaymentForm from "../components/accounts/LoanPaymentForm";
import LoanRepaymentProgress from "../components/accounts/LoanRepaymentProgress";

import { accountGradientStyles } from "../utils/theme";

import {
  formatCurrency,
  formatDate,
  maskAccountNumber,
} from "../utils/formatters";

export default function AccountDetailsPage() {
  const { accountId } = useParams();
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [installments, setInstallments] = useState([]);

  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [loanPaymentLoading, setLoanPaymentLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [transactionLoading, setTransactionLoading] = useState(false);

  const [transactionType, setTransactionType] = useState(null);

  const [error, setError] = useState("");

  async function loadAccountDetails() {
    try {
      setLoading(true);
      setError("");

      const accountResult = await getAccount(accountId);

      setAccount(accountResult);

      if (accountResult.account_type === "SAVINGS") {
        const savingsProfile = await getSavingsProfile(accountId);

        setProfile(savingsProfile);
      } else if (accountResult.account_type === "LOAN") {
        const [loanProfile, loanInstallments] = await Promise.all([
          getLoanProfile(accountId),
          getLoanInstallments(accountId),
        ]);
        setProfile(loanProfile);
        setInstallments(loanInstallments);
      }

      const transactionResult = await getTransactions(accountId);

      setTransactions(transactionResult);
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail ||
        "Unable to load account details.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccountDetails();
  }, [accountId]);

  async function handleTransaction(data) {
    try {
      setTransactionLoading(true);

      if (transactionType === "DEPOSIT") {
        await depositFunds(accountId, data);
      }

      if (transactionType === "WITHDRAWAL") {
        await withdrawFunds(accountId, data);
      }

      setTransactionType(null);

      await loadAccountDetails();
    } finally {
      setTransactionLoading(false);
    }
  }

  function closeTransactionModal() {
    if (!transactionLoading) {
      setTransactionType(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading account details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={17} />
          Go Back
        </Button>

        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!account) {
    return (
      <EmptyState
        icon={WalletCards}
        title="Account not found"
        description="The requested account could not be found."
        actionLabel="Go Back"
        onAction={() => navigate(-1)}
      />
    );
  }

  const isSavings = account.account_type === "SAVINGS";

  const isLoan = account.account_type === "LOAN";

  const isActive = account.account_status === "ACTIVE";

  const gradientClass =
    accountGradientStyles[account.account_type] ||
    accountGradientStyles.SAVINGS;

  async function handleLoanPayment(amount) {
    if (!selectedInstallment) {
      return;
    }

    try {
      setLoanPaymentLoading(true);

      await payLoanInstallment(
        accountId,
        selectedInstallment.installment_id,
        amount,
      );

      setSelectedInstallment(null);

      await loadAccountDetails();
    } finally {
      setLoanPaymentLoading(false);
    }
  }

  return (
    <div className="space-y-7">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="
          inline-flex
          items-center
          gap-2
          text-sm
          font-medium
          text-slate-500
          transition
          hover:text-violet-700
        "
      >
        <ArrowLeft size={17} />
        Back
      </button>

      <div
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1
              className="
                text-2xl
                font-bold
                tracking-tight
                text-slate-950
                sm:text-3xl
              "
            >
              {isSavings ? "Savings Account" : "Loan Account"}
            </h1>

            <StatusBadge value={account.account_status} />
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Account ID #{account.account_id}
          </p>
        </div>

        {isSavings && (
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              disabled={!isActive}
              onClick={() => setTransactionType("WITHDRAWAL")}
            >
              <ArrowUpRight size={17} />
              Withdraw
            </Button>

            <Button
              disabled={!isActive}
              onClick={() => setTransactionType("DEPOSIT")}
            >
              <ArrowDownLeft size={17} />
              Deposit
            </Button>
          </div>
        )}
      </div>

      <AccountStatusActions
        account={account}
        onStatusChanged={loadAccountDetails}
      />

      {!isActive && isSavings && (
        <div
          className="
            rounded-2xl
            border
            border-amber-200
            bg-amber-50
            px-4
            py-3
            text-sm
            text-amber-800
          "
        >
          Deposits and withdrawals are unavailable while this account is not
          active.
        </div>
      )}

      <section
        className="
          grid
          gap-6
          xl:grid-cols-[380px_minmax(0,1fr)]
        "
      >
        <div
          className={`
            relative
            min-h-60
            overflow-hidden
            rounded-3xl
            p-7
            text-white
            shadow-xl
            ${gradientClass}
          `}
        >
          <div
            className="
              absolute
              -right-16
              -top-16
              h-48
              w-48
              rounded-full
              bg-white/10
              blur-2xl
            "
          />

          <div
            className="
              absolute
              -bottom-20
              -left-10
              h-52
              w-52
              rounded-full
              bg-white/5
              blur-3xl
            "
          />

          <div
            className="
              relative
              z-10
              flex
              h-full
              flex-col
              justify-between
            "
          >
            <div className="flex items-center justify-between">
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-2xl
                  bg-white/10
                  ring-1
                  ring-white/15
                  backdrop-blur
                "
              >
                {isSavings ? <CreditCard size={20} /> : <Landmark size={20} />}
              </div>

              <span
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.18em]
                  text-white/70
                "
              >
                {account.account_type}
              </span>
            </div>

            <div className="mt-10">
              <p
                className="
                  text-xs
                  font-medium
                  uppercase
                  tracking-[0.15em]
                  text-white/60
                "
              >
                {isSavings ? "Available Balance" : "Outstanding Principal"}
              </p>

              <p
                className="
                  mt-2
                  text-3xl
                  font-bold
                  tracking-tight
                "
              >
                {isSavings
                  ? formatCurrency(account.current_balance)
                  : formatCurrency(profile?.outstanding_principal)}
              </p>
            </div>

            <div
              className="
                mt-8
                flex
                items-end
                justify-between
                gap-4
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    uppercase
                    tracking-[0.15em]
                    text-white/50
                  "
                >
                  Account Number
                </p>

                <p
                  className="
                    mt-1
                    font-mono
                    text-sm
                    tracking-wider
                    text-white/90
                  "
                >
                  {account.account_number}
                </p>
              </div>

              <p className="text-xs text-white/60">
                Opened {formatDate(account.opened_at)}
              </p>
            </div>
          </div>
        </div>

        <Card>
          <h2 className="text-lg font-bold text-slate-950">
            Account Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Product and operational details.
          </p>

          {isSavings && profile && (
            <div
              className="
                mt-7
                grid
                gap-6
                sm:grid-cols-2
                xl:grid-cols-3
              "
            >
              <div>
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  <WalletCards size={14} />
                  Minimum Balance
                </div>

                <p className="mt-2 font-semibold text-slate-900">
                  {formatCurrency(profile.minimum_balance)}
                </p>
              </div>

              <div>
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  <ArrowUpRight size={14} />
                  Daily Withdrawal Limit
                </div>

                <p className="mt-2 font-semibold text-slate-900">
                  {formatCurrency(profile.daily_withdrawal_limit)}
                </p>
              </div>
            </div>
          )}

          {isLoan && profile && (
            <div
              className="
                mt-7
                grid
                gap-6
                sm:grid-cols-2
                xl:grid-cols-3
              "
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Principal Amount
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {formatCurrency(profile.principal_amount)}
                </p>
              </div>

              <div>
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  <Percent size={14} />
                  Interest Rate
                </div>

                <p className="mt-2 font-semibold text-slate-900">
                  {profile.interest_rate}%
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Tenure
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {profile.tenure_months} months
                </p>
              </div>

              <div>
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  <CalendarDays size={14} />
                  Repayment Starts
                </div>

                <p className="mt-2 font-semibold text-slate-900">
                  {formatDate(profile.repayment_start_date)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Outstanding Principal
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {formatCurrency(profile.outstanding_principal)}
                </p>
              </div>
            </div>
          )}
        </Card>
      </section>

      {isLoan && profile && (
        <LoanRepaymentProgress
          installments={installments}
          outstandingPrincipal={profile.outstanding_principal}
        />
      )}

      {isLoan && (
        <Card padding={false}>
          <div
            className="
        border-b
        border-slate-100
        bg-gradient-to-r
        from-white
        via-fuchsia-50/40
        to-rose-50/40
        px-5
        py-5
      "
          >
            <h2 className="text-lg font-bold text-slate-950">
              Repayment Schedule
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View installment amounts, principal, interest, payment progress,
              and due dates.
            </p>
          </div>

          <LoanInstallmentList
            installments={installments}
            accountStatus={account.account_status}
            onPay={(installment) => {
              setSelectedInstallment(installment);
            }}
          />
        </Card>
      )}

      <Card padding={false}>
        <div
          className="
      border-b
      border-slate-100
      px-5
      py-5
    "
        >
          <h2 className="text-lg font-bold text-slate-950">
            Recent Transactions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Latest financial activity for this account.
          </p>
        </div>

        <TransactionList transactions={transactions} />
      </Card>

      <Modal
        open={transactionType !== null}
        title={
          transactionType === "DEPOSIT" ? "Deposit Funds" : "Withdraw Funds"
        }
        description={
          transactionType === "DEPOSIT"
            ? "Add funds to this Savings account."
            : "Withdraw funds subject to the account limits."
        }
        onClose={closeTransactionModal}
        maxWidth="max-w-md"
      >
        {transactionType && (
          <TransactionForm
            transactionType={transactionType}
            loading={transactionLoading}
            onSubmit={handleTransaction}
            onCancel={closeTransactionModal}
          />
        )}
      </Modal>

      <Modal
        open={selectedInstallment !== null}
        title="Pay Loan Installment"
        description={
          selectedInstallment
            ? `Installment #${selectedInstallment.installment_number}`
            : ""
        }
        onClose={() => {
          if (!loanPaymentLoading) {
            setSelectedInstallment(null);
          }
        }}
        maxWidth="max-w-lg"
      >
        {selectedInstallment && (
          <LoanPaymentForm
            installment={selectedInstallment}
            loading={loanPaymentLoading}
            onSubmit={handleLoanPayment}
            onCancel={() => {
              if (!loanPaymentLoading) {
                setSelectedInstallment(null);
              }
            }}
          />
        )}
      </Modal>
    </div>
  );
}
