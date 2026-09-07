import {
  ArrowLeft,
  CalendarDays,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  createCustomerAddress,
  deleteCustomerAddress,
  getCustomer,
  getCustomerAddresses,
  updateCustomer,
  updateCustomerAddress,
  getCustomerTransactions,
} from "../api/customerApi";

import { createAccount, getCustomerAccounts } from "../api/accountApi";

import AccountForm from "../components/accounts/AccountForm";
import AddressForm from "../components/customers/AddressForm";
import AddressCard from "../components/customers/AddressCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import CustomerForm from "../components/customers/CustomerForm";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorMessage from "../components/ui/ErrorMessage";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import StatusBadge from "../components/ui/StatusBadge";

import {
  formatCurrency,
  formatDate,
  maskAccountNumber,
} from "../utils/formatters";

export default function CustomerDetailsPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [selectedAddress, setSelectedAddress] = useState(null);

  const [addressToDelete, setAddressToDelete] = useState(null);
  const [addressDeleting, setAddressDeleting] = useState(false);

  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);

  const [showAddressModal, setShowAddressModal] = useState(false);

  const [showAccountModal, setShowAccountModal] = useState(false);

  const [customerSaving, setCustomerSaving] = useState(false);

  const [addressSaving, setAddressSaving] = useState(false);

  const [accountSaving, setAccountSaving] = useState(false);

  const [error, setError] = useState("");

  async function loadCustomerDetails() {
    try {
      setLoading(true);
      setError("");

      const [customerResult, addressResult, accountResult] = await Promise.all([
        getCustomer(customerId),
        getCustomerAddresses(customerId),
        getCustomerAccounts(customerId),
      ]);

      setCustomer(customerResult);
      setAddresses(addressResult);
      setAccounts(accountResult);
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail ||
        "Unable to load customer details.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomerDetails();
  }, [customerId]);

  async function handleUpdateCustomer(data) {
    try {
      setCustomerSaving(true);

      const updatedCustomer = await updateCustomer(customerId, data);

      setCustomer(updatedCustomer);
      setShowEditModal(false);
    } finally {
      setCustomerSaving(false);
    }
  }

  async function handleCreateAddress(data) {
    try {
      setAddressSaving(true);

      await createCustomerAddress(customerId, data);

      const updatedAddresses = await getCustomerAddresses(customerId);

      setAddresses(updatedAddresses);
      setShowAddressModal(false);
    } finally {
      setAddressSaving(false);
    }
  }

  async function handleCreateAccount(data) {
    try {
      setAccountSaving(true);

      await createAccount(customerId, data);

      const updatedAccounts = await getCustomerAccounts(customerId);

      setAccounts(updatedAccounts);
      setShowAccountModal(false);
    } finally {
      setAccountSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading customer details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <Button variant="ghost" onClick={() => navigate("/customers")}>
          <ArrowLeft size={17} />
          Back to Customers
        </Button>

        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!customer) {
    return (
      <EmptyState
        icon={UserRound}
        title="Customer not found"
        description="The requested customer could not be found."
        actionLabel="Back to Customers"
        onAction={() => navigate("/customers")}
      />
    );
  }

  const firstInitial = customer.first_name?.charAt(0).toUpperCase() || "";

  const lastInitial = customer.last_name?.charAt(0).toUpperCase() || "";

  async function handleUpdateAddress(data) {
    if (!selectedAddress) {
      return;
    }

    try {
      setAddressSaving(true);

      await updateCustomerAddress(customerId, selectedAddress.address_id, data);

      const updatedAddresses = await getCustomerAddresses(customerId);

      setAddresses(updatedAddresses);
      setSelectedAddress(null);
    } finally {
      setAddressSaving(false);
    }
  }

  async function handleDeleteAddress() {
    if (!addressToDelete) {
      return;
    }

    try {
      setAddressDeleting(true);

      await deleteCustomerAddress(customerId, addressToDelete.address_id);

      const updatedAddresses = await getCustomerAddresses(customerId);

      setAddresses(updatedAddresses);
      setAddressToDelete(null);
    } finally {
      setAddressDeleting(false);
    }
  }

  return (
    <div className="space-y-7">
      <button
        type="button"
        onClick={() => navigate("/customers")}
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
        Customers
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
          <h1
            className="
              text-2xl
              font-bold
              tracking-tight
              text-slate-950
              sm:text-3xl
            "
          >
            Customer Details
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View and manage customer information, addresses, and accounts.
          </p>
        </div>

        <Button variant="secondary" onClick={() => setShowEditModal(true)}>
          <Pencil size={16} />
          Edit Customer
        </Button>
      </div>

      <Card>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div
            className="
              flex
              h-20
              w-20
              shrink-0
              items-center
              justify-center
              rounded-3xl
              bg-gradient-to-br
              from-fuchsia-600
              via-purple-600
              to-rose-500
              text-2xl
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
            <h2 className="text-2xl font-bold text-slate-950">
              {customer.first_name} {customer.last_name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Customer ID #{customer.customer_id}
            </p>
          </div>
        </div>

        <div
          className="
            mt-7
            grid
            gap-6
            border-t
            border-slate-100
            pt-6
            sm:grid-cols-2
            grid-cols-5
          "
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Mail size={14} />
              Email
            </div>

            <p className="mt-2 break-all text-sm font-medium text-slate-800">
              {customer.email}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Phone size={14} />
              Mobile
            </div>

            <p className="mt-2 text-sm font-medium text-slate-800">
              {customer.mobile}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <CalendarDays size={14} />
              Date of Birth
            </div>

            <p className="mt-2 text-sm font-medium text-slate-800">
              {formatDate(customer.date_of_birth)}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <UserRound size={14} />
              Gender
            </div>

            <p className="mt-2 text-sm font-medium capitalize text-slate-800">
              {customer.gender ? customer.gender.toLowerCase() : "Not provided"}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <UserRound size={14} />
              Marital Status
            </div>

            <p className="mt-2 text-sm font-medium capitalize text-slate-800">
              {customer.marital_status
                ? customer.marital_status.toLowerCase()
                : "Not provided"}
            </p>
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Addresses</h2>

            <p className="mt-1 text-sm text-slate-500">
              Current and permanent customer addresses.
            </p>
          </div>

          <Button size="sm" onClick={() => setShowAddressModal(true)}>
            <Plus size={16} />
            Add Address
          </Button>
        </div>

        {addresses.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No addresses added"
            description="Add a current or permanent address for this customer."
            actionLabel="Add Address"
            onAction={() => setShowAddressModal(true)}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {addresses.map((address) => (
              <AddressCard
                key={address.address_id}
                address={address}
                onEdit={(selectedAddress) => {
                  setSelectedAddress(selectedAddress);
                }}
                onDelete={(selectedAddress) => {
                  setAddressToDelete(selectedAddress);
                }}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Accounts</h2>

            <p className="mt-1 text-sm text-slate-500">
              Savings and Loan accounts owned by this customer.
            </p>
          </div>

          <Button size="sm" onClick={() => setShowAccountModal(true)}>
            <Plus size={16} />
            Add Account
          </Button>
        </div>

        {accounts.length === 0 ? (
          <EmptyState
            icon={WalletCards}
            title="No accounts found"
            description="Create a Savings or Loan account for this customer."
            actionLabel="Add Account"
            onAction={() => setShowAccountModal(true)}
          />
        ) : (
          <Card padding={false}>
            <div className="divide-y divide-slate-100">
              {accounts.map((account) => (
                <button
                  key={account.account_id}
                  type="button"
                  onClick={() => navigate(`/accounts/${account.account_id}`)}
                  className="
                    flex
                    w-full
                    flex-col
                    gap-4
                    px-5
                    py-5
                    text-left
                    transition
                    hover:bg-violet-50/40
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-2xl
                        bg-gradient-to-br
                        from-indigo-100
                        to-violet-100
                        text-indigo-700
                      "
                    >
                      <WalletCards size={19} />
                    </div>

                    <div>
                      <p className="font-semibold text-slate-950">
                        {account.account_number}
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-400">
                        {account.account_type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-6 sm:justify-end">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Balance
                      </p>

                      <p className="mt-1 font-bold text-slate-900">
                        {formatCurrency(account.current_balance)}
                      </p>
                    </div>

                    <StatusBadge value={account.account_status} />
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}
      </section>

      <Modal
        open={showEditModal}
        title="Edit Customer"
        description="Update the customer's personal and contact information."
        onClose={() => {
          if (!customerSaving) {
            setShowEditModal(false);
          }
        }}
        maxWidth="max-w-2xl"
      >
        <CustomerForm
          initialData={customer}
          submitLabel="Save Changes"
          loading={customerSaving}
          onSubmit={handleUpdateCustomer}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      <Modal
        open={showAddressModal}
        title="Add Address"
        description="Enter the postal code and customer address details."
        onClose={() => {
          if (!addressSaving) {
            setShowAddressModal(false);
          }
        }}
        maxWidth="max-w-2xl"
      >
        <AddressForm
          submitLabel="Add Address"
          loading={addressSaving}
          onSubmit={handleCreateAddress}
          onCancel={() => setShowAddressModal(false)}
        />
      </Modal>

      <Modal
        open={showAccountModal}
        title="Create Account"
        description="Create a Savings or Loan account for this customer."
        onClose={() => {
          if (!accountSaving) {
            setShowAccountModal(false);
          }
        }}
        maxWidth="max-w-2xl"
      >
        <AccountForm
          loading={accountSaving}
          onSubmit={handleCreateAccount}
          onCancel={() => setShowAccountModal(false)}
        />
      </Modal>

      <Modal
        open={selectedAddress !== null}
        title="Edit Address"
        description="Update this customer's address information."
        onClose={() => {
          if (!addressSaving) {
            setSelectedAddress(null);
          }
        }}
        maxWidth="max-w-2xl"
      >
        {selectedAddress && (
          <AddressForm
            initialData={selectedAddress}
            submitLabel="Save Changes"
            loading={addressSaving}
            onSubmit={handleUpdateAddress}
            onCancel={() => setSelectedAddress(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={addressToDelete !== null}
        title="Delete Address"
        message="Are you sure you want to delete this customer address?"
        confirmLabel="Delete Address"
        loading={addressDeleting}
        onConfirm={handleDeleteAddress}
        onCancel={() => {
          if (!addressDeleting) {
            setAddressToDelete(null);
          }
        }}
      />
    </div>
  );
}
