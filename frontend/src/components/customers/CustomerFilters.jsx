import {
  RotateCcw,
  Search,
} from "lucide-react";

import { useState } from "react";

import Button from "../ui/Button";
import Input from "../ui/Input";


const initialFilters = {
  customer_id: "",
  first_name: "",
  last_name: "",
  email: "",
  mobile: "",
};


export default function CustomerFilters({
  loading = false,
  onSearch,
  onReset,
}) {
  const [filters, setFilters] = useState(
    initialFilters
  );


  function handleChange(event) {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }


  function handleSubmit(event) {
    event.preventDefault();

    const params = {};

    if (filters.customer_id.trim()) {
      params.customer_id = Number(
        filters.customer_id
      );
    }

    if (filters.first_name.trim()) {
      params.first_name =
        filters.first_name.trim();
    }

    if (filters.last_name.trim()) {
      params.last_name =
        filters.last_name.trim();
    }

    if (filters.email.trim()) {
      params.email =
        filters.email.trim();
    }

    if (filters.mobile.trim()) {
      params.mobile =
        filters.mobile.trim();
    }

    onSearch(params);
  }


  function handleReset() {
    setFilters(initialFilters);

    if (onReset) {
      onReset();
    }
  }


  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div
        className="
          grid
          grid-cols-5
          gap-4
        "
      >
        <Input
          id="customer_id"
          name="customer_id"
          label="Customer ID"
          type="number"
          min="1"
          value={filters.customer_id}
          placeholder="e.g. 101"
          onChange={handleChange}
        />

        <Input
          id="first_name"
          name="first_name"
          label="First Name"
          value={filters.first_name}
          placeholder="First name"
          onChange={handleChange}
        />

        <Input
          id="last_name"
          name="last_name"
          label="Last Name"
          value={filters.last_name}
          placeholder="Last name"
          onChange={handleChange}
        />

        <Input
          id="email"
          name="email"
          label="Email"
          type="email"
          value={filters.email}
          placeholder="Email address"
          onChange={handleChange}
        />

        <Input
          id="mobile"
          name="mobile"
          label="Mobile"
          type="tel"
          value={filters.mobile}
          placeholder="Mobile number"
          onChange={handleChange}
        />
      </div>

      <div
        className="
          flex
          items-center
          justify-end
          gap-3
          border-t
          border-slate-100
          pt-4
        "
      >
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={handleReset}
        >
          <RotateCcw size={16} />
          Reset
        </Button>

        <Button
          type="submit"
          disabled={loading}
        >
          <Search size={16} />

          {loading
            ? "Searching..."
            : "Search Customers"}
        </Button>
      </div>
    </form>
  );
}
