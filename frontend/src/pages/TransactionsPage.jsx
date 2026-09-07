import {
  ArrowDownLeft,
  ArrowUpRight,
  Mail,
  Phone,
  Search,
  WalletCards,
} from "lucide-react";

import { useEffect, useState } from "react";

import {
  depositFunds,
  searchTransactionAccounts,
  withdrawFunds,
} from "../api/transactionApi";

import client from "../api/client";
import TransactionForm from "../components/transactions/TransactionForm";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorMessage from "../components/ui/ErrorMessage";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import SearchInput from "../components/ui/SearchInput";
import StatusBadge from "../components/ui/StatusBadge";
import LoanPaymentForm from "../components/accounts/LoanPaymentForm";
import LoanInstallmentList from "../components/accounts/LoanInstallmentList";

import { formatCurrency, maskAccountNumber } from "../utils/formatters";

export default function TransactionsPage() {
  const [searchValue, setSearchValue] = useState("");

  const [results, setResults] = useState([]);

  const [searching, setSearching] = useState(false);

  const [selectedAccount, setSelectedAccount] = useState(null);

  const [transactionType, setTransactionType] = useState(null);

  const [transactionLoading, setTransactionLoading] = useState(false);

  const [installments, setInstallments] = useState([]);
  const [emiLoading, setEmiLoading] = useState(false);

  const [error, setError] = useState("");

  const [selectedInstallment, setSelectedInstallment] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalAccounts, setTotalAccounts] = useState(0);

  const pageSize = 10;

  async function runSearch(value, requestedPage = 1) {
    const query = value.trim();

    if (!query) {
      setResults([]);
      setPage(1);
      setTotalPages(0);
      setTotalAccounts(0);
      return;
    }

    try {
      setSearching(true);
      setError("");

      const response = await searchTransactionAccounts(
        query,
        requestedPage,
        pageSize,
      );

      setResults(response.items);
      setPage(response.page);
      setTotalPages(response.total_pages);
      setTotalAccounts(response.total);
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to search accounts.",
      );
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      runSearch(searchValue, 1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  function handleClearSearch() {
    setSearchValue("");
    setResults([]);
    setError("");
  }

  // function openTransaction(
  //   account,
  //   type
  // ) {
  //   setSelectedAccount(account);
  //   setTransactionType(type);
  // }

  async function openTransaction(account, type) {
    if (account.account_type === "LOAN") {
      try {
        setEmiLoading(true);

        const res = await client.get(
          `/accounts/${account.account_id}/installments`,
        );

        console.log(res.data);

        // const data = res.data;

        const unpaid = res.data.filter(
          (inst) => inst.installment_status !== "PAID",
        );

        if (unpaid.length === 0) {
          return; // no modal opens
        }

        const latest = unpaid.sort(
          (a, b) => new Date(a.due_date) - new Date(b.due_date),
        )[0];

        // IMPORTANT: reuse your component
        setInstallments([latest]);
        setSelectedAccount(account);
        setTransactionType("EMI");
      } catch (err) {
        console.error("Error fetching installments", err);
      } finally {
        setEmiLoading(false);
      }

      return;
    }

    // 👉 existing logic
    setSelectedAccount(account);
    setTransactionType(type);
  }

  function closeTransactionModal() {
    if (transactionLoading) return;

    setSelectedAccount(null);
    setTransactionType(null);
    setSelectedInstallment(null);
    setInstallments([]);
  }

  async function handleTransaction(data) {
    if (!selectedAccount || !transactionType) {
      return;
    }

    try {
      setTransactionLoading(true);

      if (transactionType === "DEPOSIT") {
        await depositFunds(selectedAccount.account_id, data);
      }

      if (transactionType === "WITHDRAWAL") {
        await withdrawFunds(selectedAccount.account_id, data);
      }

      closeTransactionModal();

      await runSearch(searchValue);
    } finally {
      setTransactionLoading(false);
    }

    console.log("TRANSACTION TYPE:", transactionType);
    console.log("ACCOUNT:", selectedAccount);
  }

  function handlePayInstallment(installment) {
    setSelectedInstallment(installment);
  }

  async function handleLoanPayment(amount) {
    try {
      setTransactionLoading(true);

      await client.post(
        `/accounts/${selectedAccount.account_id}/installments/${selectedInstallment.installment_id}/pay`,
        { amount },
      );

      setSelectedInstallment(null);
      closeTransactionModal();

      await runSearch(searchValue);
    } finally {
      setTransactionLoading(false);
    }
  }

  async function handleEmiPayment(amount) {
    if (!selectedInstallment) return;

    try {
      setTransactionLoading(true);

      await client.post(
        `/loans/accounts/${selectedAccount.account_id}/installments/${selectedInstallment.installment_id}/pay`,
        { amount },
      );

      closeTransactionModal();
      await runSearch(searchValue);
    } catch (err) {
      console.error("EMI payment failed", err);
    } finally {
      setTransactionLoading(false);
    }
  }

  const hasSearch = searchValue.trim().length > 0;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Transactions"
        description="Quickly find a customer's account and perform any transaction."
      />

      <Card
        className="
          bg-gradient-to-br
          from-white
          via-fuchsia-50/30
          to-rose-50/40
        "
      >
        <div className="max-w-4xl">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-950">
              Find Customer Account
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Search by customer name, email address, or account number.
            </p>
          </div>

          <SearchInput
            value={searchValue}
            placeholder="Search by customer name, email, or account number..."
            onChange={setSearchValue}
            onClear={handleClearSearch}
          />
        </div>
      </Card>

      <ErrorMessage message={error} />

      {!hasSearch && !searching && (
        <Card>
          <div
            className="
              flex
              min-h-56
              flex-col
              items-center
              justify-center
              text-center
            "
          >
            <div
              className="
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-gradient-to-br
                from-fuchsia-100
                via-purple-100
                to-rose-100
                text-fuchsia-700
              "
            >
              <Search size={24} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-950">
              Search for a customer
            </h3>

            <p
              className="
                mt-1
                max-w-md
                text-sm
                leading-6
                text-slate-500
              "
            >
              Matching accounts will appear here with quick Deposit,
              Withdraw, and Pay Installment actions.
            </p>
          </div>
        </Card>
      )}

      {searching && (
        <Card>
          <div
            className="
              flex
              min-h-48
              items-center
              justify-center
            "
          >
            <LoadingSpinner label="Searching accounts..." />
          </div>
        </Card>
      )}

      {!searching && hasSearch && results.length === 0 && (
        <EmptyState
          icon={WalletCards}
          title="No accounts found"
          description="No matching customer with an account was found."
        />
      )}

      {!searching && results.length > 0 && (
        <div className="space-y-3">
          <div
            className="
                flex
                items-center
                justify-between
              "
          >
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Matching Accounts
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {results.length}{" "}
                {results.length === 1
                  ? "Account found"
                  : "Accounts found"}
              </p>
            </div>
          </div>

          {results.map((account) => {
            const isActive = account.account_status === "ACTIVE";

            const isLoan = account.account_type === "LOAN";

            const firstInitial =
              account.first_name?.charAt(0).toUpperCase() || "";

            const lastInitial =
              account.last_name?.charAt(0).toUpperCase() || "";

            return (
              <Card
                key={account.account_id}
                className="
                    overflow-hidden
                    bg-gradient-to-r
                    from-white
                    via-white
                    to-fuchsia-50/40
                    transition
                    duration-200
                    hover:border-fuchsia-200
                    hover:shadow-lg
                    hover:shadow-fuchsia-500/10
                  "
              >
                <div
                  className="
                      grid
                      grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)_auto]
                      items-center
                      gap-8
                    "
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className="
                          flex
                          h-12
                          w-12
                          shrink-0
                          items-center
                          justify-center
                          rounded-2xl
                          bg-gradient-to-br
                          from-fuchsia-600
                          via-purple-600
                          to-rose-500
                          font-bold
                          text-white
                          shadow-md
                          shadow-fuchsia-500/20
                        "
                    >
                      {firstInitial}
                      {lastInitial}
                    </div>

                    <div className="min-w-0">
                      <p
                        className="
                            truncate
                            font-semibold
                            text-slate-950
                          "
                      >
                        {account.first_name} {account.last_name}
                      </p>

                      <div
                        className="
                            mt-2
                            flex
                            items-center
                            gap-2
                            text-sm
                            text-slate-500
                          "
                      >
                        <Mail size={14} className="shrink-0" />

                        <span className="truncate">{account.email}</span>
                      </div>

                      <div
                        className="
                            mt-1
                            flex
                            items-center
                            gap-2
                            text-sm
                            text-slate-500
                          "
                      >
                        <Phone size={14} className="shrink-0" />

                        <span>{account.mobile}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <div
                        className="
                            flex
                            h-10
                            w-10
                            items-center
                            justify-center
                            rounded-xl
                            bg-gradient-to-br
                            from-fuchsia-100
                            to-rose-100
                            text-fuchsia-700
                          "
                      >
                        <WalletCards size={18} />
                      </div>

                      <div>
                        <div
                          className="
                              flex
                              items-center
                              gap-2
                            "
                        >
                          {/* <p className="font-semibold text-slate-900">
                              Savings{" "}
                              {maskAccountNumber(
                                account.account_number
                              )}
                            </p> */}

                          <p className="font-semibold text-slate-900">
                            {isLoan
                              ? `Loan ${maskAccountNumber(account.account_number)}`
                              : `Savings ${maskAccountNumber(account.account_number)}`}
                          </p>

                          <StatusBadge value={account.account_status} />
                        </div>

                        {/* <p className="mt-1 text-sm text-slate-500">
                            Balance{" "}
                            <span className="font-semibold text-slate-800">
                              {formatCurrency(
                                account.current_balance
                              )}
                            </span>
                          </p> */}

                        {isLoan ? (
                          <p className="mt-1 text-sm text-slate-500">
                            <span className="font-semibold text-slate-800">
                              Outstanding{" "}
                              {formatCurrency(
                                account.outstanding_principal || 0,
                              )}
                            </span>
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-slate-500">
                            Balance{" "}
                            <span className="font-semibold text-slate-800">
                              {formatCurrency(account.current_balance)}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* <div className="flex items-center gap-3">
                      <Button
                        variant="secondary"
                        disabled={!isActive}
                        onClick={() => {
                          openTransaction(
                            account,
                            "WITHDRAWAL"
                          );
                        }}
                      >
                        <ArrowUpRight size={17} />
                        Withdraw
                      </Button>

                      <Button
                        disabled={!isActive}
                        onClick={() => {
                          openTransaction(
                            account,
                            "DEPOSIT"
                          );
                        }}
                      >
                        <ArrowDownLeft size={17} />
                        Deposit
                      </Button>
                    </div> */}

                  <div className="flex items-center gap-3">
                    {isLoan ? (
                      <Button
                        disabled={
                          !isActive ||
                          Number(account.outstanding_principal || 0) <= 0
                        }
                        onClick={() => openTransaction(account, "EMI")}
                      >
                        Pay Installment
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          disabled={!isActive}
                          onClick={() => {
                            openTransaction(account, "WITHDRAWAL");
                          }}
                        >
                          <ArrowUpRight size={17} />
                          Withdraw
                        </Button>

                        <Button
                          disabled={!isActive}
                          onClick={() => {
                            openTransaction(account, "DEPOSIT");
                          }}
                        >
                          <ArrowDownLeft size={17} />
                          Deposit
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {!isActive && (
                  <p
                    className="
                        mt-4
                        rounded-xl
                        bg-amber-50
                        px-4
                        py-2.5
                        text-sm
                        text-amber-700
                      "
                  >
                    Transactions are unavailable because this Savings account is
                    not active.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            type="button"
            variant="secondary"
            disabled={page <= 1 || searching}
            onClick={() => runSearch(searchValue, page - 1)}
          >
            Previous
          </Button>

          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>

          <Button
            type="button"
            variant="secondary"
            disabled={page >= totalPages || searching}
            onClick={() => runSearch(searchValue, page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <Modal
        open={
          selectedAccount !== null &&
          (transactionType !== null || selectedInstallment !== null)
        }
        // title={
        //   transactionType === "DEPOSIT"
        //     ? "Deposit Funds"
        //     : "Withdraw Funds"
        // }
        title={
          selectedInstallment
            ? "Pay Installment"
            : transactionType === "DEPOSIT"
              ? "Deposit Funds"
              : transactionType === "WITHDRAWAL"
                ? "Withdraw Funds"
                : "Pay Installment"
        }
        description={
          selectedAccount
            ? `${selectedAccount.first_name} ${selectedAccount.last_name} • ${maskAccountNumber(
                selectedAccount.account_number,
              )}`
            : ""
        }
        onClose={closeTransactionModal}
        // maxWidth="max-w-md"
        maxWidth="max-w-3xl"
      >
        {selectedAccount &&
          transactionType === "EMI" &&
          !selectedInstallment && (
            <LoanInstallmentList
              installments={installments}
              accountStatus={selectedAccount.account_status}
              onPay={handlePayInstallment}
            />
          )}

        {selectedInstallment && (
          <LoanPaymentForm
            installment={selectedInstallment}
            loading={transactionLoading}
            onSubmit={handleLoanPayment}
            onCancel={() => setSelectedInstallment(null)}
          />
        )}

        {selectedAccount &&
  (transactionType === "DEPOSIT" ||
    transactionType === "WITHDRAWAL") && (
    <TransactionForm
      type={transactionType}
      loading={transactionLoading}
      onSubmit={handleTransaction}   // 🔥 THIS WAS MISSING LINK
      onCancel={closeTransactionModal}
    />
)}
      </Modal>
    </div>
  );
}
