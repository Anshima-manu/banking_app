import {
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";

import Button from "../ui/Button";
import Card from "../ui/Card";


export default function AddressCard({
  address,
  onEdit,
  onDelete,
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-violet-50
            text-violet-700
          "
        >
          <MapPin size={19} />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {address.is_primary && (
            <span
              className="
                rounded-full
                bg-violet-50
                px-2.5
                py-1
                text-xs
                font-semibold
                text-violet-700
              "
            >
              Primary
            </span>
          )}

          <span
            className="
              rounded-full
              bg-slate-100
              px-2.5
              py-1
              text-xs
              font-semibold
              text-slate-600
            "
          >
            {address.address_type}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <p className="font-semibold text-slate-900">
          {address.address_line_1}
        </p>

        {address.address_line_2 && (
          <p className="mt-1 text-sm text-slate-500">
            {address.address_line_2}
          </p>
        )}

        <p className="mt-3 text-xs text-slate-400">
          Location ID: {address.city_id}
        </p>
      </div>

      <div
        className="
          mt-5
          flex
          items-center
          gap-2
          border-t
          border-slate-100
          pt-4
        "
      >
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onEdit(address)}
        >
          <Pencil size={15} />
          Edit
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="
            text-rose-600
            hover:bg-rose-50
            hover:text-rose-700
          "
          onClick={() => onDelete(address)}
        >
          <Trash2 size={15} />
          Delete
        </Button>
      </div>
    </Card>
  );
}