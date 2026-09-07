import { useState } from "react";

import { getLocationByPostalCode } from "../../api/locationApi";

import Button from "../ui/Button";
import ErrorMessage from "../ui/ErrorMessage";
import Input from "../ui/Input";
import Select from "../ui/Select";


const addressTypeOptions = [
  {
    value: "CURRENT",
    label: "Current",
  },
  {
    value: "PERMANENT",
    label: "Permanent",
  },
];


const initialFormData = {
  postal_code: "",
  city_id: "",
  city_name: "",
  state_name: "",
  country_name: "",
  address_type: "",
  address_line_1: "",
  address_line_2: "",
  is_primary: false,
};


export default function AddressForm({
  initialData = null,
  submitLabel = "Save Address",
  loading = false,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState(() => ({
    ...initialFormData,
    ...(initialData || {}),
  }));

  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState("");


  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (error) {
      setError("");
    }
  }


  async function handlePostalLookup() {
    const postalCode = formData.postal_code.trim();

    if (!postalCode) {
      setError("Enter a postal code.");
      return;
    }

    try {
      setLookupLoading(true);
      setError("");

      const location =
        await getLocationByPostalCode(postalCode);

      setFormData((current) => ({
        ...current,
        postal_code: location.postal_code,
        city_id: location.city_id,
        city_name: location.city_name,
        state_name: location.state_name,
        country_name: location.country_name,
      }));
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail ||
        "Unable to find this postal code.";

      setError(message);

      setFormData((current) => ({
        ...current,
        city_id: "",
        city_name: "",
        state_name: "",
        country_name: "",
      }));
    } finally {
      setLookupLoading(false);
    }
  }


  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !formData.city_id ||
      !formData.address_type ||
      !formData.address_line_1.trim()
    ) {
      setError(
        "Complete the required address fields."
      );
      return;
    }

    const payload = {
      city_id: Number(formData.city_id),
      address_type: formData.address_type,
      address_line_1:
        formData.address_line_1.trim(),
      address_line_2:
        formData.address_line_2.trim() || null,
      is_primary: formData.is_primary,
    };

    try {
      setError("");
      await onSubmit(payload);
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail ||
        "Unable to save address.";

      setError(message);
    }
  }


  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <ErrorMessage message={error} />

      <div className="space-y-5">
        <div>
          <label
            htmlFor="postal_code"
            className="
              mb-2
              block
              text-sm
              font-medium
              text-slate-700
            "
          >
            Postal Code
            <span className="ml-1 text-rose-500">
              *
            </span>
          </label>

          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
            "
          >
            <input
              id="postal_code"
              name="postal_code"
              type="text"
              value={formData.postal_code}
              placeholder="Enter postal code"
              onChange={handleChange}
              className="
                h-11
                min-w-0
                flex-1
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                text-sm
                text-slate-900
                shadow-sm
                transition
                placeholder:text-slate-400
                focus:border-violet-500
                focus:ring-4
                focus:ring-violet-500/10
              "
            />

            <Button
              type="button"
              variant="secondary"
              disabled={lookupLoading}
              onClick={handlePostalLookup}
            >
              {lookupLoading
                ? "Looking up..."
                : "Find Location"}
            </Button>
          </div>
        </div>

        <div
          className="
            grid
            gap-4
            sm:grid-cols-3
          "
        >
          <Input
            id="city_name"
            name="city_name"
            label="City"
            value={formData.city_name}
            placeholder="City"
            disabled
          />

          <Input
            id="state_name"
            name="state_name"
            label="State"
            value={formData.state_name}
            placeholder="State"
            disabled
          />

          <Input
            id="country_name"
            name="country_name"
            label="Country"
            value={formData.country_name}
            placeholder="Country"
            disabled
          />
        </div>

        <Select
          id="address_type"
          name="address_type"
          label="Address Type"
          value={formData.address_type}
          placeholder="Select address type"
          options={addressTypeOptions}
          required
          onChange={handleChange}
        />

        <Input
          id="address_line_1"
          name="address_line_1"
          label="Address Line 1"
          value={formData.address_line_1}
          placeholder="House number, street, area"
          required
          onChange={handleChange}
        />

        <Input
          id="address_line_2"
          name="address_line_2"
          label="Address Line 2"
          value={formData.address_line_2}
          placeholder="Apartment, landmark, building"
          onChange={handleChange}
        />

        <label
          className="
            flex
            cursor-pointer
            items-center
            gap-3
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            px-4
            py-3
          "
        >
          <input
            type="checkbox"
            name="is_primary"
            checked={formData.is_primary}
            onChange={handleChange}
            className="
              h-4
              w-4
              rounded
              border-slate-300
              text-violet-600
              accent-violet-600
            "
          />

          <div>
            <p
              className="
                text-sm
                font-medium
                text-slate-800
              "
            >
              Primary Address
            </p>

            <p
              className="
                mt-0.5
                text-xs
                text-slate-500
              "
            >
              Use this as the customer's preferred address.
            </p>
          </div>
        </label>
      </div>

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
          disabled={loading || lookupLoading}
        >
          {loading
            ? "Saving..."
            : submitLabel}
        </Button>
      </div>
    </form>
  );
}