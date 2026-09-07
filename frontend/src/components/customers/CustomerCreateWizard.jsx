import {
  Check,
  CreditCard,
  MapPin,
  UserRound,
} from "lucide-react";

import { useState } from "react";

import AccountForm from "../accounts/AccountForm";
import AddressForm from "./AddressForm";
import CustomerForm from "./CustomerForm";


const steps = [
  {
    number: 1,
    label: "Customer",
    icon: UserRound,
  },
  {
    number: 2,
    label: "Address",
    icon: MapPin,
  },
  {
    number: 3,
    label: "Account",
    icon: CreditCard,
  },
];


export default function CustomerCreateWizard({
  loading = false,
  onSubmit,
  onCancel,
}) {
  const [currentStep, setCurrentStep] = useState(1);

  const [customerData, setCustomerData] =
    useState(null);

  const [addressData, setAddressData] =
    useState(null);


  function handleCustomerDetails(data) {
    setCustomerData(data);
    setCurrentStep(2);
  }


  function handleAddress(data) {
    setAddressData(data);
    setCurrentStep(3);
  }


  async function handleAccount(accountData) {
    if (!customerData || !addressData) {
      return;
    }

    const payload = {
      ...customerData,
      addresses: [
        addressData,
      ],
      account: accountData,
    };

    await onSubmit(payload);
  }


  function handleBack() {
    if (currentStep === 2) {
      setCurrentStep(1);
      return;
    }

    if (currentStep === 3) {
      setCurrentStep(2);
    }
  }


  return (
    <div>
      <div
        className="
          mb-8
          grid
          grid-cols-3
          gap-3
        "
      >
        {steps.map((step) => {
          const Icon = step.icon;

          const isCompleted =
            currentStep > step.number;

          const isActive =
            currentStep === step.number;

          return (
            <div
              key={step.number}
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className={`
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  transition
                  ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isActive
                        ? "bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-md shadow-violet-500/20"
                        : "bg-slate-100 text-slate-400"
                  }
                `}
              >
                {isCompleted ? (
                  <Check size={18} />
                ) : (
                  <Icon size={18} />
                )}
              </div>

              <div>
                <p
                  className="
                    text-xs
                    font-medium
                    text-slate-400
                  "
                >
                  Step {step.number}
                </p>

                <p
                  className={`
                    text-sm
                    font-semibold
                    ${
                      isActive
                        ? "text-violet-700"
                        : isCompleted
                          ? "text-emerald-700"
                          : "text-slate-500"
                    }
                  `}
                >
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="
          mb-6
          h-1.5
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
            from-violet-600
            to-indigo-600
            transition-all
            duration-300
          "
          style={{
            width: `${(currentStep / steps.length) * 100}%`,
          }}
        />
      </div>

      {currentStep === 1 && (
        <CustomerForm
          initialData={customerData}
          submitLabel="Continue to Address"
          loading={false}
          onSubmit={handleCustomerDetails}
          onCancel={onCancel}
        />
      )}

      {currentStep === 2 && (
        <AddressForm
          initialData={addressData}
          submitLabel="Continue to Account"
          loading={false}
          onSubmit={handleAddress}
          onCancel={handleBack}
        />
      )}

      {currentStep === 3 && (
        <AccountForm
          loading={loading}
          onSubmit={handleAccount}
          onCancel={handleBack}
        />
      )}
    </div>
  );
}