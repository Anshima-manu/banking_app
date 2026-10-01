import { Download, FileBarChart } from "lucide-react";

import { useEffect, useState } from "react";

import {
  downloadAccountReportPdf,
  downloadCustomerReportPdf,
  getAccountReport,
  getCustomerCombinedReport,
} from "../api/reportApi";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorMessage from "../components/ui/ErrorMessage";
import Input from "../components/ui/Input";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import PageHeader from "../components/ui/PageHeader";
import SearchInput from "../components/ui/SearchInput";
import Select from "../components/ui/Select";
import ReportTransactionTable from "../components/reports/ReportTransactionTable";
import { getCustomerAccounts } from "../api/accountApi";
import { searchCustomers } from "../api/customerApi";
import {
  getReportPeriodDates,
  reportPeriodOptions,
} from "../utils/reportPeriods";

import { formatCurrency } from "../utils/formatters";
import CustomerReportTransactionTable from "../components/reports/CustomerReportTransactionTable";

const transactionTypeOptions = [
  {
    value: "ALL",
    label: "All transaction types",
  },
  {
    value: "DEPOSIT",
    label: "Deposit",
  },
  {
    value: "WITHDRAWAL",
    label: "Withdrawal",
  },
  {
    value: "LOAN_REPAYMENT",
    label: "Loan Repayment",
  },
];

export default function ReportsPage() {
  const [customerSearch, setCustomerSearch] = useState("");

  const [customerResults, setCustomerResults] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [customerAccounts, setCustomerAccounts] = useState([]);

  const [selectedAccountId, setSelectedAccountId] = useState("");

  const [reportPeriod, setReportPeriod] = useState("LAST_MONTH");

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");

  const [transactionType, setTransactionType] = useState("ALL");

  const [report, setReport] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const [searching, setSearching] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(0);

  const searchPageSize = 10;

  async function runCustomerSearch(value, requestedPage = 1) {
    const query = value.trim();

    if (!query) {
      setCustomerResults([]);
      setSearchPage(1);
      setSearchTotalPages(0);
      setError("");
      return;
    }

    try {
      setSearching(true);
      setError("");

      const response = await searchCustomers(
        { search: query },
        requestedPage,
        searchPageSize,
      );

      setCustomerResults(response.items || []);
      setSearchPage(response.page || requestedPage);
      setSearchTotalPages(response.total_pages || 0);
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail || "Unable to search customers.";

      setError(message);
      setCustomerResults([]);
      setSearchTotalPages(0);
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    if (selectedCustomer) {
      return;
    }

    const value = customerSearch.trim();

    if (!value) {
      setCustomerResults([]);
      setError("");
      return;
    }

    const timer = setTimeout(() => {
      runCustomerSearch(value);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [customerSearch, selectedCustomer]);

  async function handleSelectCustomer(customer) {
    try {
      setSearching(true);
      setError("");

      const accounts = await getCustomerAccounts(customer.customer_id);

      setSelectedCustomer(customer);
      setCustomerAccounts(accounts);

      setCustomerSearch("");
      setCustomerResults([]);

      setSelectedAccountId("ALL");

      setReportPeriod("LAST_MONTH");
      setStartDate("");
      setEndDate("");

      setTransactionType("ALL");
      setReport(null);
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail ||
        "Unable to load customer accounts.";

      setError(message);
    } finally {
      setSearching(false);
    }
  }

  function handleChangeCustomer() {
    setSelectedCustomer(null);
    setCustomerAccounts([]);

    setCustomerSearch("");
    setCustomerResults([]);

    setSelectedAccountId("ALL");

    setReportPeriod("LAST_MONTH");

    setStartDate("");
    setEndDate("");

    setTransactionType("ALL");

    setReport(null);
    setError("");
  }

  function handleReportPeriodChange(event) {
    const value = event.target.value;

    setReportPeriod(value);
    setReport(null);
    setError("");

    if (value !== "CUSTOM") {
      setStartDate("");
      setEndDate("");
    }
  }

  async function handleGenerateReport(event) {
    event.preventDefault();

    if (!selectedCustomer) {
      setError("Select a customer first.");
      return;
    }

    if (!selectedAccountId) {
      setError("Select an account option.");
      return;
    }

    let reportStartDate;
    let reportEndDate;

    if (reportPeriod === "CUSTOM") {
      reportStartDate = startDate;
      reportEndDate = endDate;

      if (!reportStartDate || !reportEndDate) {
        setError("Select a start date and end date.");

        return;
      }

      if (reportStartDate > reportEndDate) {
        setError("Start date cannot be after end date.");

        return;
      }
    } else {
      const periodDates = getReportPeriodDates(reportPeriod);

      reportStartDate = periodDates.startDate;

      reportEndDate = periodDates.endDate;
    }
    if (!reportStartDate || !reportEndDate) {
      setError("Select a reporting period.");

      return;
    }

    try {
      setLoading(true);
      setError("");
      setReport(null);

      let result;

      if (selectedAccountId === "ALL") {
        result = await getCustomerCombinedReport(selectedCustomer.customer_id, {
          startDate: reportStartDate,
          endDate: reportEndDate,
          transactionType,
        });
      } else {
        result = await getAccountReport(selectedAccountId, {
          startDate: reportStartDate,
          endDate: reportEndDate,
          transactionType,
        });
      }

      setReport(result);
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail || "Unable to generate report.";

      setError(message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPdf() {
    if (!selectedCustomer || !report) {
      setError("Generate a report before downloading the PDF.");
      return;
    }

    let reportStartDate;
    let reportEndDate;

    if (reportPeriod === "CUSTOM") {
      reportStartDate = startDate;
      reportEndDate = endDate;

      if (!reportStartDate || !reportEndDate) {
        setError("Select a start date and end date.");
        return;
      }
    } else {
      const periodDates = getReportPeriodDates(reportPeriod);

      reportStartDate = periodDates.startDate;

      reportEndDate = periodDates.endDate;
    }

    if (!reportStartDate || !reportEndDate) {
      setError("Unable to determine the report period.");
      return;
    }

    try {
      setPdfDownloading(true);
      setError("");

      if (selectedAccountId === "ALL") {
        await downloadCustomerReportPdf(selectedCustomer.customer_id, {
          startDate: reportStartDate,
          endDate: reportEndDate,
          transactionType,
        });
      } else {
        await downloadAccountReportPdf(selectedAccountId, {
          startDate: reportStartDate,
          endDate: reportEndDate,
          transactionType,
        });
      }
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail ||
        "Unable to download the PDF report.";

      setError(message);
    } finally {
      setPdfDownloading(false);
    }
  }

  const accountOptions = [
    {
      value: "ALL",
      label: "All Accounts",
    },
    ...customerAccounts.map((account) => ({
      value: String(account.account_id),
      label: `${account.account_type} ${
        account.account_number}`,
    })),
  ];

  const selectedCustomerInitials = selectedCustomer
    ? `${selectedCustomer.first_name?.charAt(0).toUpperCase() || ""}${
        selectedCustomer.last_name?.charAt(0).toUpperCase() || ""
      }`
    : "";

  const selectedReportAccount =
    customerAccounts.find(
      (account) => String(account.account_id) === String(selectedAccountId),
    ) || null;

  const isCombinedReport = selectedAccountId === "ALL";

  const reportPeriodLabel =
    reportPeriodOptions.find((option) => option.value === reportPeriod)
      ?.label || "Report Period";

  return (
    <div className="space-y-7">
      {!selectedCustomer && (
        <PageHeader
          title="Reports"
          description="Generate account transaction reports for a selected period."
        />
      )}

      <Card
        className="
          bg-gradient-to-br
          from-white
          via-fuchsia-50/30
          to-rose-50/40
        "
      >
        <div>
          <h2 className="text-lg font-bold text-slate-950">Select Customer</h2>

          <p className="mt-1 text-sm text-slate-500">
            Search for the customer whose transaction report you want to
            generate.
          </p>
        </div>

        {!selectedCustomer && (
          <div className="mt-5">
            <SearchInput
              value={customerSearch}
              placeholder="Search by name, email, mobile, or customer ID..."
              onChange={(value) => {
                setCustomerSearch(value);
                setSearchPage(1);
                setSearchTotalPages(0);
                setReport(null);
              }}
              onClear={() => {
                setCustomerSearch("");
                setCustomerResults([]);
                setSearchPage(1);
                setSearchTotalPages(0);
                setError("");
              }}
            />
          </div>
        )}

        {searching && !selectedCustomer && (
          <div className="flex justify-center py-8">
            <LoadingSpinner label="Searching customers..." />
          </div>
        )}

        {!searching && !selectedCustomer && customerResults.length > 0 && (
          <div
            className="
          mt-4
          divide-y
          divide-slate-100
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
        "
          >
            {customerResults.map((customer) => {
              const firstInitial =
                customer.first_name?.charAt(0).toUpperCase() || "";

              const lastInitial =
                customer.last_name?.charAt(0).toUpperCase() || "";

              return (
                <button
                  key={customer.customer_id}
                  type="button"
                  onClick={() => {
                    handleSelectCustomer(customer);
                  }}
                  className="
                  grid
                  grid-cols-2
                  items-center
                  gap-30
                  px-5
                  py-3
                transition
                hover:bg-fuchsia-50/50
                sm:grid-cols-[minmax(180px,1fr)_minmax(0,2fr)]
              "
                >
                  <div className="flex items-center gap-5">
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

                    <p className="font-semibold tracking-wide text-slate-950">
                      {customer.first_name} {customer.last_name}
                    </p>
                  </div>

                  <div className="min-w-0 text-left">
                    <p className="mt-1 text-sm text-slate-500">
                      {customer.email}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {customer.mobile}
                      {" • "}
                      Customer ID #{customer.customer_id}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {searchTotalPages > 1 && !selectedCustomer && (
          <div className="mt-4 flex items-center justify-center gap-4">
            <Button
              type="button"
              variant="secondary"
              disabled={searchPage <= 1 || searching}
              onClick={() => runCustomerSearch(customerSearch, searchPage - 1)}
            >
              Previous
            </Button>

            <span className="text-sm text-slate-500">
              Page {searchPage} of {searchTotalPages}
            </span>

            <Button
              type="button"
              variant="secondary"
              disabled={searchPage >= searchTotalPages || searching}
              onClick={() => runCustomerSearch(customerSearch, searchPage + 1)}
            >
              Next
            </Button>
          </div>
        )}

        {selectedCustomer && (
          <div
            className="
        mt-5
        flex
        items-center
        justify-between
        rounded-2xl
        border
        border-fuchsia-100
        bg-gradient-to-r
        from-white
        via-fuchsia-50/40
        to-rose-50/40
        px-5
        py-4
        shadow-sm
      "
          >
            <div className="flex items-center gap-4">
              <div
                className="
            flex
            h-12
            w-12
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
                {selectedCustomerInitials}
              </div>

              <div>
                <p className="font-semibold text-slate-950">
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedCustomer.email}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {customerAccounts.length} linked{" "}
                  {customerAccounts.length === 1 ? "account" : "accounts"}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleChangeCustomer}
            >
              Change Customer
            </Button>
          </div>
        )}
      </Card>

      {selectedCustomer && (
        <Card>
          <div>
            <h2 className="text-lg font-bold text-slate-950">Report Options</h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose the account scope, reporting period, and optional
              transaction type.
            </p>
          </div>

          <form onSubmit={handleGenerateReport} className="mt-6 space-y-6">
            <div>
              <Select
                id="report_account"
                name="report_account"
                label="Account"
                value={selectedAccountId}
                placeholder="Select report account"
                options={accountOptions}
                required
                onChange={(event) => {
                  setSelectedAccountId(event.target.value);

                  setReport(null);
                  setError("");
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <Select
                id="report_period"
                name="report_period"
                label="Reporting Period"
                value={reportPeriod}
                options={reportPeriodOptions}
                onChange={handleReportPeriodChange}
              />

              <Select
                id="transaction_type"
                name="transaction_type"
                label="Transaction Type"
                value={transactionType}
                placeholder="Select transaction type"
                options={transactionTypeOptions}
                onChange={(event) => {
                  setTransactionType(event.target.value);

                  setReport(null);
                }}
              />
            </div>

            {reportPeriod === "CUSTOM" && (
              <div
                className="
            grid
            grid-cols-2
            gap-5
            rounded-2xl
            border
            border-fuchsia-100
            bg-gradient-to-r
            from-fuchsia-50/40
            to-rose-50/40
            p-5
          "
              >
                <Input
                  id="report_start_date"
                  name="report_start_date"
                  label="Start Date"
                  type="date"
                  value={startDate}
                  required
                  onChange={(event) => {
                    setStartDate(event.target.value);

                    setReport(null);
                  }}
                />

                <Input
                  id="report_end_date"
                  name="report_end_date"
                  label="End Date"
                  type="date"
                  value={endDate}
                  required
                  onChange={(event) => {
                    setEndDate(event.target.value);

                    setReport(null);
                  }}
                />
              </div>
            )}

            <div
              className="
          flex
          items-center
          justify-between
          border-t
          border-slate-100
          pt-5
        "
            >
              <p className="text-sm text-slate-500">
                {selectedAccountId === "ALL"
                  ? `Report will include all ${customerAccounts.length} linked accounts.`
                  : selectedReportAccount
                    ? `Report will include only ${selectedReportAccount.account_type} ${
                        selectedReportAccount.account_number
                      }.`
                    : "Select an account."}{" "}
              </p>

              <Button type="submit" disabled={loading}>
                <FileBarChart size={17} />

                {loading ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <ErrorMessage message={error} />

      {loading && (
        <Card>
          <div
            className="
              flex
              min-h-48
              items-center
              justify-center
            "
          >
            <LoadingSpinner label="Generating report..." />
          </div>
        </Card>
      )}

      {!loading && selectedCustomer && !report && (
        <EmptyState
          icon={FileBarChart}
          title="No report generated"
          description="Choose the report options and generate a transaction report."
        />
      )}

      {!loading && report && (
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
                {isCombinedReport
                  ? "Combined Customer Report"
                  : "Account Report"}
              </p>

              <h2
                className="
            mt-2
            text-xl
            font-bold
            text-slate-950
          "
              >
                {selectedCustomer.first_name} {selectedCustomer.last_name}
              </h2>

              <p
                className="
            mt-1
            text-sm
            text-slate-500
          "
              >
                {isCombinedReport
                  ? `All ${customerAccounts.length} linked accounts`
                  : selectedReportAccount
                    ? `${selectedReportAccount.account_type} ${
                        selectedReportAccount.account_number
                      }.`
                    : "Selected account"}
              </p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div
                className="
      inline-flex
      rounded-xl
      bg-white
      px-4
      py-2
      text-sm
      font-semibold
      text-fuchsia-700
      shadow-sm
      ring-1
      ring-fuchsia-100
    "
              >
                {reportPeriodLabel}
              </div>

              <p
                className="
      text-xs
      text-slate-400
    "
              >
                {report.start_date}
                {" to "}
                {report.end_date}
              </p>

              <Button
                type="button"
                disabled={pdfDownloading}
                onClick={handleDownloadPdf}
              >
                <Download size={17} />

                {pdfDownloading ? "Preparing PDF..." : "Download PDF"}
              </Button>
            </div>
          </div>

          <div
            className="
        mt-7
        grid
        grid-cols-3
        gap-4
      "
          >
            {!isCombinedReport && (
              <>
                <div
                  className="
              rounded-2xl
              bg-white
              p-4
              shadow-sm
              ring-1
              ring-slate-100
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
                    Opening Balance
                  </p>

                  <p
                    className="
                mt-2
                text-lg
                font-bold
                text-slate-950
              "
                  >
                    {formatCurrency(report.opening_balance)}
                  </p>
                </div>

                <div
                  className="
              rounded-2xl
              bg-white
              p-4
              shadow-sm
              ring-1
              ring-slate-100
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
                    Closing Balance
                  </p>

                  <p
                    className="
                mt-2
                text-lg
                font-bold
                text-slate-950
              "
                  >
                    {formatCurrency(report.closing_balance)}
                  </p>
                </div>
              </>
            )}

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
            text-emerald-600
          "
              >
                Total Deposits
              </p>

              <p
                className="
            mt-2
            text-lg
            font-bold
            text-emerald-700
          "
              >
                {formatCurrency(report.total_deposits)}
              </p>
            </div>

            <div
              className="
          rounded-2xl
          bg-gradient-to-br
          from-rose-50
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
            text-rose-600
          "
              >
                Total Withdrawals
              </p>

              <p
                className="
            mt-2
            text-lg
            font-bold
            text-rose-700
          "
              >
                {formatCurrency(report.total_withdrawals)}
              </p>
            </div>

            <div
              className="
          rounded-2xl
          bg-gradient-to-br
          from-fuchsia-50
          via-purple-50
          to-rose-50
          p-4
        "
            >
              <p
                className="
            text-xs
            font-semibold
            uppercase
            tracking-wide
            text-fuchsia-600
          "
              >
                Loan Repayments
              </p>

              <p
                className="
            mt-2
            text-lg
            font-bold
            text-fuchsia-800
          "
              >
                {formatCurrency(report.total_loan_repayments)}
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
            text-amber-600
          "
              >
                Transactions
              </p>

              <p
                className="
            mt-2
            text-lg
            font-bold
            text-amber-800
          "
              >
                {report.transaction_count}
              </p>
            </div>
          </div>
        </Card>
      )}

      {!loading && report && (
        <Card padding={false}>
          <div
            className="
        flex
        items-center
        justify-between
        border-b
        border-slate-100
        bg-gradient-to-r
        from-white
        via-fuchsia-50/30
        to-rose-50/30
        px-5
        py-5
      "
          >
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Transaction Statement
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Transactions included in the selected reporting period.
              </p>
            </div>

            <div
              className="
          rounded-xl
          bg-fuchsia-50
          px-3
          py-2
          text-sm
          font-semibold
          text-fuchsia-700
        "
            >
              {report.transaction_count}{" "}
              {report.transaction_count === 1 ? "transaction" : "transactions"}
            </div>
          </div>
          {isCombinedReport ? (
            <CustomerReportTransactionTable
              transactions={report.transactions}
            />
          ) : (
            <ReportTransactionTable transactions={report.transactions} />
          )}{" "}
        </Card>
      )}
    </div>
  );
}
