import {
  AlertTriangle,
  CircleAlert,
  Snowflake,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  PiggyBank,
  ReceiptText,
  TrendingDown,
  Users,
  WalletCards,
} from "lucide-react";
import { useEffect, useState } from "react";

import { getDashboardSummary } from "../api/dashboardApi";

import Card from "../components/ui/Card";
import ErrorMessage from "../components/ui/ErrorMessage";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import PageHeader from "../components/ui/PageHeader";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const result = await getDashboardSummary();

      setSummary(result);
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail || "Unable to load dashboard data.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-[60vh]
          items-center
          justify-center
        "
      >
        <LoadingSpinner size="lg" label="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Banking operations overview."
        />

        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en-IN").format(value || 0);
  }
  function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }

  function formatCompactCurrency(value) {
    const amount = Number(value || 0);
    const absoluteAmount = Math.abs(amount);

    if (absoluteAmount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }

    if (absoluteAmount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }

    if (absoluteAmount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)} K`;
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  const summaryCards = [
    {
      id: "customers",
      label: "Total Customers",
      value: summary.total_customers,
      subtitle: "Registered customers",
      icon: Users,
      accentClass: "from-fuchsia-500 to-rose-500",
      iconClass:
        "bg-gradient-to-br from-fuchsia-100 to-rose-100 text-fuchsia-700",
    },
    {
      id: "active",
      label: "Active Accounts",
      value: summary.active_accounts,
      subtitle: "Currently operational",
      icon: WalletCards,
      accentClass: "from-purple-500 to-fuchsia-500",
      iconClass:
        "bg-gradient-to-br from-purple-100 to-fuchsia-100 text-purple-700",
    },
    {
      id: "savings",
      label: "Savings Accounts",
      value: summary.savings_accounts,
      subtitle: "Savings portfolio",
      icon: PiggyBank,
      accentClass: "from-emerald-500 to-teal-500",
      iconClass:
        "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700",
    },
    {
      id: "loans",
      label: "Loan Accounts",
      value: summary.loan_accounts,
      subtitle: "Loan portfolio",
      icon: Landmark,
      accentClass: "from-amber-500 to-orange-500",
      iconClass:
        "bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700",
    },
  ];

  const todayActivity = summary.today_activity || {};

  const todayActivityCards = [
    {
      id: "deposits",
      label: "Deposits",
      value: formatCompactCurrency(todayActivity.total_deposits),
      detail: `${formatNumber(todayActivity.deposit_count)} transactions`,
      icon: ArrowDownLeft,
      cardClass: "from-emerald-50 via-white to-teal-50",
      iconClass: "bg-emerald-100 text-emerald-700",
      valueClass: "text-emerald-700",
    },
    {
      id: "withdrawals",
      label: "Withdrawals",
      value: formatCompactCurrency(todayActivity.total_withdrawals),
      detail: `${formatNumber(todayActivity.withdrawal_count)} transactions`,
      icon: ArrowUpRight,
      cardClass: "from-rose-50 via-white to-orange-50",
      iconClass: "bg-rose-100 text-rose-700",
      valueClass: "text-rose-700",
    },
    {
      id: "loan-repayments",
      label: "Loan Repayments",
      value: formatCompactCurrency(todayActivity.total_loan_repayments),
      detail: `${formatNumber(todayActivity.loan_repayment_count)} repayments`,
      icon: Landmark,
      cardClass: "from-purple-50 via-white to-fuchsia-50",
      iconClass: "bg-purple-100 text-purple-700",
      valueClass: "text-purple-700",
    },
    {
      id: "transactions",
      label: "Total Transactions",
      value: formatNumber(todayActivity.total_transactions),
      detail: "Processed today",
      icon: ReceiptText,
      cardClass: "from-fuchsia-50 via-white to-rose-50",
      iconClass: "bg-fuchsia-100 text-fuchsia-700",
      valueClass: "text-slate-950",
    },
  ];

  const totalAccounts =
    summary.active_accounts + summary.frozen_accounts + summary.closed_accounts;

  function getStatusPercentage(value) {
    if (totalAccounts === 0) {
      return 0;
    }

    return Math.round((value / totalAccounts) * 100);
  }

  const accountStatusData = [
    {
      id: "active",
      label: "Active",
      value: summary.active_accounts,
      percentage: getStatusPercentage(summary.active_accounts),
      barClass: "from-emerald-400 to-emerald-500",
    },
    {
      id: "frozen",
      label: "Frozen",
      value: summary.frozen_accounts,
      percentage: getStatusPercentage(summary.frozen_accounts),
      barClass: "from-amber-400 to-orange-500",
    },
    {
      id: "closed",
      label: "Closed",
      value: summary.closed_accounts,
      percentage: getStatusPercentage(summary.closed_accounts),
      barClass: "from-slate-400 to-slate-600",
    },
  ];

  const sevenDayActivity = summary.seven_day_activity || [];

  const operationalAttention = summary.operational_attention || {};

  const attentionCards = [
    {
      id: "frozen",
      label: "Frozen Accounts",
      value: formatNumber(operationalAttention.frozen_accounts),
      description: "Accounts currently restricted from transactions.",
      icon: Snowflake,
      cardClass:
        "border-amber-200 bg-gradient-to-br from-blue-50 via-white to-blue-50",
      iconClass: "bg-blue-100 text-blue-700",
      valueClass: "text-blue-700",
    },
    {
      id: "overdue-loans",
      label: "Overdue Loan Accounts",
      value: formatNumber(operationalAttention.overdue_loan_accounts),
      description: "Loan accounts with at least one overdue installment.",
      icon: AlertTriangle,
      cardClass:
        "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-red-50",
      iconClass: "bg-rose-100 text-rose-700",
      valueClass: "text-rose-700",
    },
    {
      id: "overdue-installments",
      label: "Overdue Installments",
      value: formatNumber(operationalAttention.overdue_installments),
      description: "Installments currently past their repayment due date.",
      icon: CircleAlert,
      cardClass:
        "border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50",
      iconClass: "bg-orange-100 text-orange-700",
      valueClass: "text-orange-700",
    },
    {
      id: "overdue-amount",
      label: "Overdue Amount",
      value: formatCompactCurrency(operationalAttention.total_overdue_amount),
      description: "Total unpaid amount across overdue installments.",
      icon: Landmark,
      cardClass:
        "border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 via-white to-fuchsia-50",
      iconClass: "bg-fuchsia-100 text-fuchsia-700",
      valueClass: "text-fuchsia-700",
    },
  ];

  const loanPortfolio = summary.loan_portfolio || {};

  const repaymentPercentage = Math.min(
    Math.max(Number(loanPortfolio.repayment_percentage || 0), 0),
    100,
  );

  const maximumDailyTransactions = Math.max(
    ...sevenDayActivity.map((item) => Number(item.transaction_count || 0)),
    1,
  );

  function getDayLabel(dateValue) {
    if (!dateValue) {
      return "";
    }

    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
    }).format(new Date(`${dateValue}T00:00:00`));
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="A live overview of customers, accounts, and banking activity."
      />

      <section
        className="
          relative
          overflow-hidden
          rounded-3xl
          bg-gradient-to-br
          from-zinc-950
          via-purple-950
          to-fuchsia-800

          px-7
          py-8
          text-white
          shadow-xl
          shadow-violet-950/10
          sm:px-9
          sm:py-10
        "
      >
        <div
          className="
            absolute
            -right-16
            -top-24
            h-72
            w-72
            rounded-full
           bg-fuchsia-500/25
            blur-3xl
          "
        />

        <div
          className="
            absolute
            -bottom-24
            left-1/3
            h-64
            w-64
            rounded-full
            bg-rose-400/15
            blur-3xl
          "
        />

        <div
          className="
            relative
            z-10
            max-w-2xl
          "
        >
          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-[0.2em]
              text-fuchsia-300
            "
          >
            Banking Operations
          </p>

          <h2
            className="
              mt-3
              text-3xl
              font-bold
              tracking-tight
              sm:text-4xl
            "
          >
            Your banking workspace at a glance.
          </h2>

          <p
            className="
    mt-4
    max-w-2xl
    text-sm
    leading-6
    text-slate-300
    sm:text-base
  "
          >
            Monitor customer and account portfolios, daily banking activity,
            operational attention areas, and Loan repayment health from one
            workspace.
          </p>
        </div>
      </section>

      <section
        className="
        grid
        gap-5
        sm:grid-cols-2
        xl:grid-cols-4
      "
      >
        {summaryCards.map((item) => {
          const Icon = item.icon;

          return (
            <Card
              key={item.id}
              className="
          group
          relative
          overflow-hidden
          bg-gradient-to-br
          from-white
          via-white
          to-fuchsia-50/30
          transition
          duration-300
          hover:-translate-y-1
          hover:shadow-xl
          hover:shadow-fuchsia-500/10
        "
            >
              <div
                className={`
            absolute
            inset-x-0
            top-0
            h-1
            bg-gradient-to-r
            ${item.accentClass}
          `}
              />

              <div
                className="
            flex
            items-start
            justify-between
            gap-4
          "
              >
                <div>
                  <p
                    className="
                text-sm
                font-medium
                text-slate-500
              "
                  >
                    {item.label}
                  </p>

                  <p
                    className="
                mt-3
                text-3xl
                font-bold
                tracking-tight
                text-slate-950
              "
                  >
                    {formatNumber(item.value)}
                  </p>

                  <p
                    className="
                mt-2
                text-xs
                text-slate-400
              "
                  >
                    {item.subtitle}
                  </p>
                </div>

                <div
                  className={`
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-2xl
              transition
              duration-300
              group-hover:scale-105
              ${item.iconClass}
            `}
                >
                  <Icon size={22} />
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="space-y-4">
        <div
          className="
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
          font-semibold
          uppercase
          tracking-[0.16em]
          text-fuchsia-600
        "
            >
              Daily Operations
            </p>

            <h2
              className="
          mt-1
          text-xl
          font-bold
          text-slate-950
        "
            >
              Today's Activity
            </h2>

            <p
              className="
          mt-1
          text-sm
          text-slate-500
        "
            >
              Transaction activity processed today.
            </p>
          </div>

          <div
            className="
        rounded-xl
        bg-fuchsia-50
        px-3
        py-2
        text-xs
        font-semibold
        text-fuchsia-700
      "
          >
            Live Overview
          </div>
        </div>

        <div
          className="
      grid
      gap-4
      sm:grid-cols-2
      xl:grid-cols-4
    "
        >
          {todayActivityCards.map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.id}
                className={`
            bg-gradient-to-br
            ${item.cardClass}
            transition
            duration-300
            hover:-translate-y-1
            hover:shadow-lg
          `}
              >
                <div
                  className="
              flex
              items-start
              justify-between
              gap-4
            "
                >
                  <div className="min-w-0">
                    <p
                      className="
                  text-sm
                  font-medium
                  text-slate-500
                "
                    >
                      {item.label}
                    </p>

                    <p
                      className={`
                  mt-3
                  text-2xl
                  font-bold
                  tracking-tight
                  ${item.valueClass}
                `}
                    >
                      {item.value}
                    </p>

                    <p
                      className="
                  mt-2
                  text-xs
                  text-slate-400
                "
                    >
                      {item.detail}
                    </p>
                  </div>

                  <div
                    className={`
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-2xl
                ${item.iconClass}
              `}
                  >
                    <Icon size={19} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section
        className="
    grid
    gap-5
    xl:grid-cols-[1.5fr_1fr]
  "
      >
        <Card
          className="
      bg-gradient-to-br
      from-white
      via-white
      to-fuchsia-50/40
    "
        >
          <div
            className="
        flex
        items-start
        justify-between
        gap-4
      "
          >
            <div>
              <p
                className="
            text-xs
            font-semibold
            uppercase
            tracking-[0.16em]
            text-fuchsia-600
          "
              >
                Activity Trend
              </p>

              <h2
                className="
            mt-1
            text-lg
            font-bold
            text-slate-950
          "
              >
                Transaction Activity
              </h2>

              <p
                className="
            mt-1
            text-sm
            text-slate-500
          "
              >
                Daily transaction volume over the last 7 days.
              </p>
            </div>

            <div
              className="
          rounded-xl
          bg-fuchsia-50
          px-3
          py-2
          text-xs
          font-semibold
          text-fuchsia-700
        "
            >
              Last 7 Days
            </div>
          </div>

          <div
            className="
        mt-8
        flex
        h-64
        items-end
        gap-3
      "
          >
            {sevenDayActivity.map((item) => {
              const transactionCount = Number(item.transaction_count || 0);

              const heightPercentage = Math.max(
                (transactionCount / maximumDailyTransactions) * 100,
                transactionCount > 0 ? 4 : 0,
              );

              return (
                <div
                  key={item.date}
                  className="
              flex
              h-full
              min-w-0
              flex-1
              flex-col
              justify-end
            "
                >
                  <div
                    className="
                mb-2
                text-center
                text-xs
                font-semibold
                text-slate-600
              "
                  >
                    {formatNumber(transactionCount)}
                  </div>

                  <div
                    className="
                flex
                h-[190px]
                items-end
                rounded-2xl
                bg-slate-100
                p-1
              "
                  >
                    <div
                      className="
                  w-full
                  rounded-xl
                  bg-gradient-to-t
                  from-fuchsia-600
                  via-purple-600
                  to-rose-400
                  shadow-sm
                  shadow-fuchsia-500/20
                  transition-all
                  duration-500
                "
                      style={{
                        height: `${heightPercentage}%`,
                      }}
                      title={
                        `${item.date}: ` +
                        `${formatNumber(transactionCount)} transactions`
                      }
                    />
                  </div>

                  <div
                    className="
                mt-3
                text-center
              "
                  >
                    <p
                      className="
                  text-xs
                  font-semibold
                  text-slate-700
                "
                    >
                      {getDayLabel(item.date)}
                    </p>

                    <p
                      className="
                  mt-0.5
                  text-[11px]
                  text-slate-400
                "
                    >
                      {item.date?.slice(5)?.split("-")?.reverse()?.join("/")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="
        mt-6
        grid
        grid-cols-3
        gap-3
        border-t
        border-slate-100
        pt-5
      "
          >
            <div
              className="
          rounded-xl
          bg-emerald-50
          px-4
          py-3
        "
            >
              <p
                className="
            text-xs
            font-medium
            text-emerald-600
          "
              >
                7-Day Deposits
              </p>

              <p
                className="
            mt-1
            text-lg
            font-bold
            text-emerald-700
          "
              >
                {formatNumber(
                  sevenDayActivity.reduce(
                    (total, item) => total + Number(item.deposit_count || 0),
                    0,
                  ),
                )}
              </p>
            </div>

            <div
              className="
          rounded-xl
          bg-rose-50
          px-4
          py-3
        "
            >
              <p
                className="
            text-xs
            font-medium
            text-rose-600
          "
              >
                7-Day Withdrawals
              </p>

              <p
                className="
            mt-1
            text-lg
            font-bold
            text-rose-700
          "
              >
                {formatNumber(
                  sevenDayActivity.reduce(
                    (total, item) => total + Number(item.withdrawal_count || 0),
                    0,
                  ),
                )}
              </p>
            </div>

            <div
              className="
          rounded-xl
          bg-purple-50
          px-4
          py-3
        "
            >
              <p
                className="
            text-xs
            font-medium
            text-purple-600
          "
              >
                Loan Repayments
              </p>

              <p
                className="
            mt-1
            text-lg
            font-bold
            text-purple-700
          "
              >
                {formatNumber(
                  sevenDayActivity.reduce(
                    (total, item) =>
                      total + Number(item.loan_repayment_count || 0),
                    0,
                  ),
                )}
              </p>
            </div>
          </div>
        </Card>

        <Card
          className="
      bg-gradient-to-br
      from-white
      via-white
      to-purple-50/60
    "
        >
          <p
            className="
        text-xs
        font-semibold
        uppercase
        tracking-[0.16em]
        text-purple-600
      "
          >
            Portfolio Health
          </p>

          <h2
            className="
        mt-1
        text-lg
        font-bold
        text-slate-950
      "
          >
            Account Status
          </h2>

          <p
            className="
        mt-1
        text-sm
        text-slate-500
      "
          >
            Live operational status of all accounts.
          </p>

          <div className="mt-7 space-y-6">
            {accountStatusData.map((item) => (
              <div key={item.id}>
                <div
                  className="
                flex
                items-center
                justify-between
                gap-4
                text-sm
              "
                >
                  <span
                    className="
                  font-medium
                  text-slate-600
                "
                  >
                    {item.label}
                  </span>

                  <div
                    className="
                  flex
                  items-center
                  gap-2
                "
                  >
                    <span
                      className="
                    text-xs
                    text-slate-400
                  "
                    >
                      {item.percentage}%
                    </span>

                    <span
                      className="
                    font-semibold
                    text-slate-900
                  "
                    >
                      {formatNumber(item.value)}
                    </span>
                  </div>
                </div>

                <div
                  className="
                mt-2
                h-2
                overflow-hidden
                rounded-full
                bg-slate-200
              "
                >
                  <div
                    style={{
                      width: `${item.percentage}%`,
                    }}
                    className={`
                  h-full
                  rounded-full
                  bg-gradient-to-r
                  transition-all
                  duration-500
                  ${item.barClass}
                `}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            className="
        mt-8
        rounded-2xl
        border
        border-purple-100
        bg-gradient-to-br
        from-purple-50
        to-fuchsia-50
        p-5
      "
          >
            <p
              className="
          text-xs
          font-medium
          uppercase
          tracking-wide
          text-purple-500
        "
            >
              Total Accounts
            </p>

            <p
              className="
          mt-2
          text-3xl
          font-bold
          tracking-tight
          text-slate-950
        "
            >
              {formatNumber(totalAccounts)}
            </p>

            <p
              className="
          mt-1
          text-xs
          text-slate-500
        "
            >
              Across Savings and Loan products
            </p>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div
          className="
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
          font-semibold
          uppercase
          tracking-[0.16em]
          text-rose-600
        "
            >
              Operational Monitoring
            </p>

            <h2
              className="
          mt-1
          text-xl
          font-bold
          text-slate-950
        "
            >
              Requires Attention
            </h2>

            <p
              className="
          mt-1
          text-sm
          text-slate-500
        "
            >
              Accounts and repayments that may require operational review.
            </p>
          </div>

          <div
            className="
        flex
        items-center
        gap-2
        rounded-xl
        bg-rose-50
        px-3
        py-2
        text-xs
        font-semibold
        text-rose-700
      "
          >
            <AlertTriangle size={14} />
            Attention Required
          </div>
        </div>

        <div
          className="
      grid
      gap-4
      sm:grid-cols-2
      xl:grid-cols-4
    "
        >
          {attentionCards.map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.id}
                className={`
            border
            ${item.cardClass}
            transition
            duration-300
            hover:-translate-y-1
            hover:shadow-lg
            hover:shadow-rose-500/10
          `}
              >
                <div
                  className="
              flex
              items-start
              justify-between
              gap-4
            "
                >
                  <div className="min-w-0">
                    <p
                      className="
                  text-sm
                  font-medium
                  text-slate-600
                "
                    >
                      {item.label}
                    </p>

                    <p
                      className={`
                  mt-3
                  text-2xl
                  font-bold
                  tracking-tight
                  ${item.valueClass}
                `}
                    >
                      {item.value}
                    </p>
                  </div>

                  <div
                    className={`
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-2xl
                ${item.iconClass}
              `}
                  >
                    <Icon size={19} />
                  </div>
                </div>

                <div
                  className="
              mt-4
              border-t
              border-slate-200/70
              pt-3
            "
                >
                  <p
                    className="
                text-xs
                leading-5
                text-slate-500
              "
                  >
                    {item.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <Card
          className="
      overflow-hidden
      bg-gradient-to-br
      from-white
      via-purple-50/30
      to-fuchsia-50/50
    "
        >
          <div
            className="
        flex
        flex-col
        gap-6
        xl:flex-row
        xl:items-start
        xl:justify-between
      "
          >
            <div>
              <p
                className="
            text-xs
            font-semibold
            uppercase
            tracking-[0.16em]
            text-purple-600
          "
              >
                Lending Portfolio
              </p>

              <h2
                className="
            mt-1
            text-xl
            font-bold
            text-slate-950
          "
              >
                Loan Portfolio
              </h2>

              <p
                className="
            mt-1
            text-sm
            text-slate-500
          "
              >
                Overall principal exposure and repayment progress across all
                Loan accounts.
              </p>
            </div>

            <div
              className="
          flex
          items-center
          gap-3
          rounded-2xl
          bg-white
          px-4
          py-3
          shadow-sm
          ring-1
          ring-purple-100
        "
            >
              <div
                className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-purple-100
            text-purple-700
          "
              >
                <Landmark size={18} />
              </div>

              <div>
                <p
                  className="
              text-xs
              font-medium
              text-slate-400
            "
                >
                  Total Loan Accounts
                </p>

                <p
                  className="
              mt-0.5
              text-lg
              font-bold
              text-slate-950
            "
                >
                  {formatNumber(loanPortfolio.total_loans)}
                </p>
              </div>
            </div>
          </div>

          <div
            className="
        mt-7
        grid
        gap-4
        md:grid-cols-3
      "
          >
            <div
              className="
          rounded-2xl
          border
          border-purple-200
          bg-gradient-to-br
          from-purple
          to-purple-100
          p-5
          shadow-sm
        "
            >
              <p
                className="
            text-xs
            font-semibold
            uppercase
            tracking-wide
            text-purple-500
          "
              >
                Total Principal
              </p>

              <p
                className="
            mt-3
            text-2xl
            font-bold
            tracking-tight
            text-slate-950
          "
              >
                {formatCompactCurrency(loanPortfolio.total_principal)}
              </p>

              <p
                className="
            mt-2
            text-xs
            text-slate-400
          "
              >
                Original principal across all Loans
              </p>
            </div>

            <div
              className="
          rounded-2xl
          border
          border-amber-100
          bg-gradient-to-br
          from-white
          to-amber-50
          p-5
          shadow-sm
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
                Outstanding Principal
              </p>

              <p
                className="
            mt-3
            text-2xl
            font-bold
            tracking-tight
            text-amber-700
          "
              >
                {formatCompactCurrency(loanPortfolio.outstanding_principal)}
              </p>

              <p
                className="
            mt-2
            text-xs
            text-slate-400
          "
              >
                Principal still awaiting repayment
              </p>
            </div>

            <div
              className="
          rounded-2xl
          border
          border-emerald-100
          bg-gradient-to-br
          from-white
          to-emerald-50
          p-5
          shadow-sm
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
                Principal Repaid
              </p>

              <p
                className="
            mt-3
            text-2xl
            font-bold
            tracking-tight
            text-emerald-700
          "
              >
                {formatCompactCurrency(loanPortfolio.repaid_principal)}
              </p>

              <p
                className="
            mt-2
            text-xs
            text-slate-400
          "
              >
                Principal recovered so far
              </p>
            </div>
          </div>

          <div
            className="
        mt-6
        rounded-2xl
        border
        border-fuchsia-100
        bg-white
        p-5
        shadow-sm
      "
          >
            <div
              className="
          flex
          items-center
          justify-between
          gap-4
        "
            >
              <div
                className="
            flex
            items-center
            gap-3
          "
              >
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
              to-purple-100
              text-fuchsia-700
            "
                >
                  <TrendingDown size={18} />
                </div>

                <div>
                  <p
                    className="
                text-sm
                font-semibold
                text-slate-900
              "
                  >
                    Overall Principal Repayment
                  </p>

                  <p
                    className="
                mt-0.5
                text-xs
                text-slate-400
              "
                  >
                    Repaid principal compared with total principal
                  </p>
                </div>
              </div>

              <p
                className="
            text-2xl
            font-bold
            text-fuchsia-700
          "
              >
                {repaymentPercentage.toFixed(2)}%
              </p>
            </div>

            <div
              className="
          mt-5
          h-3
          overflow-hidden
          rounded-full
          bg-slate-100
        "
            >
              <div
                className="
            h-full
            rounded-full
            bg-gradient-to-r
            from-fuchsia-600
            via-purple-600
            to-emerald-500
            transition-all
            duration-700
          "
                style={{
                  width: `${repaymentPercentage}%`,
                }}
              />
            </div>

            <div
              className="
          mt-3
          flex
          items-center
          justify-between
          text-xs
          text-slate-400
        "
            >
              <span>
                {formatCurrency(loanPortfolio.repaid_principal)} repaid
              </span>

              <span>
                {formatCurrency(loanPortfolio.outstanding_principal)}{" "}
                outstanding
              </span>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
