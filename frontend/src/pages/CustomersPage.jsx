import { Mail, Phone, Plus, Search, UserRound } from "lucide-react";

import { useEffect, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import { createCustomer, searchCustomers } from "../api/customerApi";

import CustomerFilters from "../components/customers/CustomerFilters";
import CustomerCreateWizard from "../components/customers/CustomerCreateWizard";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorMessage from "../components/ui/ErrorMessage";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import SearchInput from "../components/ui/SearchInput";

import { formatDate } from "../utils/formatters";

export default function CustomersPage() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const headerSearch = searchParams.get("search") || "";

  const [customers, setCustomers] = useState([]);

  const [searchValue, setSearchValue] = useState(headerSearch);

  const [loading, setLoading] = useState(false);

  const [creating, setCreating] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  const [hasAdvancedResults, setHasAdvancedResults] = useState(false);

  const [activeFilters, setActiveFilters] = useState({});

  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const pageSize = 10;

  async function runGeneralSearch(
    value,
    requestedPage = 1,
  ) {
    const query = value.trim();

    if (!query) {
      setCustomers([]);
      setTotalPages(0);
      setTotalCustomers(0);
      setPage(1);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await searchCustomers(
        { search: query },
        requestedPage,
        pageSize,
      );

      setCustomers(result.items);
      setPage(result.page);
      setTotalPages(result.total_pages);
      setTotalCustomers(result.total);
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail || "Unable to search customers.";

      setError(message);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdvancedSearch(
    params,
    requestedPage = 1,
  ) {
    try {
      setLoading(true);
      setError("");
      setActiveFilters(params);

      const result = await searchCustomers(
        params,
        requestedPage,
        pageSize,
      );

      setCustomers(result.items);
      setPage(result.page);
      setTotalPages(result.total_pages);
      setTotalCustomers(result.total);
      setHasAdvancedResults(true);
      setSearchValue("");
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail ||
        "Unable to search customers.";

      setError(message);
      setCustomers([]);
      setTotalCustomers(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const query = searchValue.trim();

    setPage(1);

    if (!query) {
      if (!hasAdvancedResults) {
        setCustomers([]);
        setTotalPages(0);
        setTotalCustomers(0);
      }

      return;
    }

    setHasAdvancedResults(false);

    const timer = setTimeout(() => {
      runGeneralSearch(query, 1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    const value = headerSearch.trim();

    if (value) {
      setSearchValue(value);
      setHasAdvancedResults(false);
    }
  }, [headerSearch]);

  function handleClearSearch() {
    setSearchValue("");
    setCustomers([]);
    setHasAdvancedResults(false);
    setError("");

    navigate("/customers", {
      replace: true,
    });
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    const value = searchValue.trim();

    if (!value) {
      return;
    }

    runGeneralSearch(value);
  }

  function handleAdvancedReset() {
    setCustomers([]);
    setSearchValue("");
    setHasAdvancedResults(false);
    setActiveFilters({});
    setError("");

    navigate("/customers", {
      replace: true,
    });
  }

  async function handleCreateCustomer(data) {
    try {
      setCreating(true);
      setError("");

      const newCustomer = await createCustomer(data);

      setShowCreateModal(false);

      navigate(
        `/customers/${newCustomer.customer_id}`
      );
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail ||
        "Unable to create customer.";

      setError(message);

      throw requestError;
    } finally {
      setCreating(false);
    }
  }

  const showResults = searchValue.trim().length > 0 || hasAdvancedResults;

  return (
    <div className="space-y-7">
      <Button
        onClick={() => {
          setShowCreateModal(true);
        }}
      >
        <Plus size={17} />
        Add Customer
      </Button>

      <Card>
        <form
          onSubmit={handleSearchSubmit}
          className="
            flex
            items-center
            gap-3
          "
        >
          <div className="flex-1">
            <SearchInput
              value={searchValue}
              placeholder="Search by ID, name, email or mobile..."
              onChange={setSearchValue}
              onClear={handleClearSearch}
            />
          </div>

          <Button type="submit" disabled={!searchValue.trim()}>
            <Search size={17} />
            Search
          </Button>
        </form>

        <div
          className="
            mt-4
            flex
            justify-end
          "
        >
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setShowAdvancedSearch((current) => !current);
            }}
          >
            {showAdvancedSearch ? "Hide Advanced Search" : "Advanced Search"}
          </Button>
        </div>
      </Card>

      {showAdvancedSearch && (
        <Card>
          <div className="mb-5">
            <h2
              className="
                text-lg
                font-bold
                text-slate-950
              "
            >
              Advanced Customer Search
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
              "
            >
              Search using one or more customer fields.
            </p>
          </div>

          <CustomerFilters
            loading={loading}
            onSearch={handleAdvancedSearch}
            onReset={handleAdvancedReset}
          />
        </Card>
      )}

      <ErrorMessage message={error} />

      {!showResults && !loading && (
        <Card>
          <div
            className="
              flex
              min-h-64
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
                from-violet-100
                to-indigo-100
                text-violet-700
              "
            >
              <Search size={24} />
            </div>

            <h2
              className="
                mt-4
                text-lg
                font-bold
                text-slate-950
              "
            >
              Find a customer
            </h2>

            <p
              className="
                mt-1
                max-w-md
                text-sm
                leading-6
                text-slate-500
              "
            >
              Start typing a customer ID, name, email address, or mobile number.
            </p>
          </div>
        </Card>
      )}

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
            <LoadingSpinner label="Searching customers..." />
          </div>
        </Card>
      )}

      {!loading && showResults && customers.length === 0 && (
        <EmptyState
          icon={UserRound}
          title="No customers found"
          description="No customers matched your search."
        />
      )}

      {!loading && showResults && customers.length > 0 && (
        <Card padding={false}>
          <div
            className="
                border-b
                border-slate-100
                px-5
                py-4
              "
          >
            <h2
              className="
                  text-sm
                  font-semibold
                  text-slate-900
                "
            >
              Search Results
            </h2>

            <p
              className="
                  mt-1
                  text-xs
                  text-slate-500
                "
            >
              {totalCustomers}{" "}
              {totalCustomers === 1 ? "customer found" : "customers found"}
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {customers.map((customer) => {
              const firstInitial =
                customer.first_name?.charAt(0).toUpperCase() || "";

              const lastInitial =
                customer.last_name?.charAt(0).toUpperCase() || "";

              return (
                <button
                  key={customer.customer_id}
                  type="button"
                  onClick={() => {
                    navigate(`/customers/${customer.customer_id}`);
                  }}
                  className="
                      grid
                      w-full
                      grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_180px]
                      items-center
                      gap-6
                      px-5
                      py-4
                      text-left
                      transition
                      hover:bg-violet-50/50
                    "
                >
                  <div
                    className="
                        flex
                        min-w-0
                        items-center
                        gap-4
                      "
                  >
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
                        {customer.first_name} {customer.last_name}
                      </p>

                      <p
                        className="
                            mt-1
                            text-xs
                            text-slate-400
                          "
                      >
                        Customer ID #{customer.customer_id}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <div
                      className="
                          flex
                          items-center
                          gap-2
                          text-sm
                          text-slate-600
                        "
                    >
                      <Mail
                        size={14}
                        className="
                            shrink-0
                            text-slate-400
                          "
                      />

                      <span className="truncate">{customer.email}</span>
                    </div>

                    <div
                      className="
                          flex
                          items-center
                          gap-2
                          text-sm
                          text-slate-600
                        "
                    >
                      <Phone
                        size={14}
                        className="
                            shrink-0
                            text-slate-400
                          "
                      />

                      <span>{customer.mobile}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className="
                          text-xs
                          font-medium
                          uppercase
                          tracking-wide
                          text-slate-400
                        "
                    >
                      Date of Birth
                    </p>

                    <p
                      className="
                          mt-1
                          text-sm
                          font-medium
                          text-slate-700
                        "
                    >
                      {formatDate(customer.date_of_birth)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 border-t border-slate-100 px-5 py-4">
          <Button
            type="button"
            variant="secondary"
            disabled={page === 1 || loading}
            onClick={() => {
              if (hasAdvancedResults) {
                handleAdvancedSearch(activeFilters, page - 1);
              } else {
                runGeneralSearch(searchValue, page - 1);
              }
            }}
          >
            Previous
          </Button>

          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>

          <Button
            type="button"
            variant="secondary"
            disabled={page === totalPages || loading}
            onClick={() => {
              if (hasAdvancedResults) {
                handleAdvancedSearch(activeFilters, page + 1);
              } else {
                runGeneralSearch(searchValue, page + 1);
              }
            }}
          >
            Next
          </Button>
        </div>
      )}

      <Modal
        open={showCreateModal}
        title="Create Customer"
        description="Complete customer, address, and initial account information."
        onClose={() => {
          if (!creating) {
            setShowCreateModal(false);
          }
        }}
        maxWidth="max-w-3xl"
      >
        <CustomerCreateWizard
          loading={creating}
          onSubmit={handleCreateCustomer}
          onCancel={() => {
            if (!creating) {
              setShowCreateModal(false);
            }
          }}
        />
      </Modal>
    </div>
  );
}
