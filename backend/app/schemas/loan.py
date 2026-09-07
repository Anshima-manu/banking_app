"""Pydantic schemas for loan installment and repayment operations."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.core.enums import InstallmentStatus


class LoanPaymentRequest(BaseModel):
    """Validates a payment made toward a loan installment."""

    # The backend determines installment status and outstanding balance.
    amount: Decimal = Field(
        gt=0,
        max_digits=18,
        decimal_places=2,
    )

    description: str | None = Field(
        default=None,
        max_length=255,
    )


class LoanInstallmentResponse(BaseModel):
    """Represents one installment in a loan repayment schedule."""

    installment_id: int
    account_id: int
    installment_number: int
    due_date: date
    amount_due: Decimal
    principal_due: Decimal
    interest_due: Decimal
    amount_paid: Decimal
    installment_status: InstallmentStatus
    paid_at: datetime | None

    model_config = {
        "from_attributes": True,
    }