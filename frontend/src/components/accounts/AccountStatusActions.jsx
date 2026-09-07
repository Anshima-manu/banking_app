import {
  CircleCheck,
  LockKeyhole,
  Snowflake,
} from "lucide-react";
import { useState } from "react";

import { updateAccountStatus } from "../../api/accountApi";

import Button from "../ui/Button";
import ConfirmDialog from "../ui/ConfirmDialog";
import ErrorMessage from "../ui/ErrorMessage";


export default function AccountStatusActions({
  account,
  onStatusChanged,
}) {
  const [pendingStatus, setPendingStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  async function handleStatusChange() {
    if (!pendingStatus) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      await updateAccountStatus(
        account.account_id,
        pendingStatus
      );

      setPendingStatus(null);

      await onStatusChanged();
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail ||
        "Unable to update account status.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }


  function closeDialog() {
    if (!loading) {
      setPendingStatus(null);
    }
  }


  const isActive =
    account.account_status === "ACTIVE";

  const isFrozen =
    account.account_status === "FROZEN";

  const isClosed =
    account.account_status === "CLOSED";


  return (
    <div className="space-y-3">
      <ErrorMessage message={error} />

      <div className="flex flex-wrap gap-3">
        {isActive && (
          <Button
            variant="secondary"
            onClick={() => setPendingStatus("FROZEN")}
          >
            <Snowflake size={16} />
            Freeze Account
          </Button>
        )}

        {isFrozen && (
          <Button
            onClick={() => setPendingStatus("ACTIVE")}
          >
            <CircleCheck size={16} />
            Reactivate Account
          </Button>
        )}

        {!isClosed && (
          <Button
            variant="danger"
            onClick={() => setPendingStatus("CLOSED")}
          >
            <LockKeyhole size={16} />
            Close Account
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={pendingStatus !== null}
        title="Change Account Status"
        message={
          pendingStatus === "CLOSED"
            ? "This will permanently close the account. A closed account cannot be reopened."
            : `Change this account's status to ${pendingStatus}?`
        }
        confirmLabel={
          pendingStatus === "CLOSED"
            ? "Close Account"
            : "Confirm Change"
        }
        variant={
          pendingStatus === "CLOSED"
            ? "danger"
            : "primary"
        }
        loading={loading}
        onConfirm={handleStatusChange}
        onCancel={closeDialog}
      />
    </div>
  );
}