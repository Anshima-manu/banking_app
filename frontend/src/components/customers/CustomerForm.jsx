import { useState } from "react";

import Button from "../ui/Button";
import ErrorMessage from "../ui/ErrorMessage";
import Input from "../ui/Input";
import Select from "../ui/Select";


const maritalStatusOptions = [
  {
    value: "SINGLE",
    label: "Single",
  },
  {
    value: "MARRIED",
    label: "Married",
  },
  {
    value: "DIVORCED",
    label: "Divorced",
  },
  {
    value: "WIDOWED",
    label: "Widowed",
  },
];

const genderOptions = [
  {
    value: "MALE",
    label: "Male",
  },
  {
    value: "FEMALE",
    label: "Female",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];


const initialFormData = {
  first_name: "",
  last_name: "",
  date_of_birth: "",
  gender: "",
  email: "",
  mobile: "",
  marital_status: "",
};


export default function CustomerForm({
  initialData = null,
  submitLabel = "Create Customer",
  loading = false,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState(() => ({
    ...initialFormData,
    ...(initialData || {}),
  }));

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
    setError("");

    if (
      !formData.first_name.trim() ||
      !formData.last_name.trim() ||
      !formData.date_of_birth ||
      !formData.gender ||
      !formData.email.trim() ||
      !formData.mobile.trim()
    ) {
      setError("Complete all required customer fields.");
      return;
    }

    if (!/^\d{10}$/.test(formData.mobile)) {
      setError("Mobile number must contain exactly 10 digits.");
      return;
    }

    onSubmit(formData);
  }


  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <ErrorMessage message={error} />

      <div
        className="
          grid
          gap-5
          sm:grid-cols-2
        "
      >
        <Input
          id="first_name"
          name="first_name"
          label="First Name"
          value={formData.first_name}
          placeholder="Enter first name"
          required
          onChange={handleChange}
        />

        <Input
          id="last_name"
          name="last_name"
          label="Last Name"
          value={formData.last_name}
          placeholder="Enter last name"
          required
          onChange={handleChange}
        />

        <Input
          id="date_of_birth"
          name="date_of_birth"
          label="Date of Birth"
          type="date"
          value={formData.date_of_birth}
          required
          onChange={handleChange}
        />

        <Select
          id="marital_status"
          name="marital_status"
          label="Marital Status"
          value={formData.marital_status}
          placeholder="Select status"
          options={maritalStatusOptions}
          onChange={handleChange}
        />

        <Select
        id="gender"
        name="gender"
        label="Gender"
        value={formData.gender}
        placeholder="Select gender"
        options={genderOptions}
        required
        onChange={handleChange}
      />

        <Input
          id="email"
          name="email"
          label="Email Address"
          type="email"
          value={formData.email}
          placeholder="customer@example.com"
          autoComplete="email"
          required
          onChange={handleChange}
          className="sm:col-span-2"
        />

        <Input
          id="mobile"
          name="mobile"
          label="Mobile Number"
          type="tel"
          value={formData.mobile}
          placeholder="Enter 10-digit mobile number"
          inputMode="numeric"
          maxLength={10}
          pattern="[0-9]{10}"
          required
          onChange={handleChange}
          className="sm:col-span-2"
        />
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
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : submitLabel}
        </Button>
      </div>
    </form>
  );
}