"""Pydantic schemas for financial transaction API operations."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.core.enums import TransactionType


class DepositRequest(BaseModel):
    """Validates a savings account deposit request."""

    # Only the requested amount is supplied by the client.
    amount: Decimal = Field(
        gt=0, #because negative deposits are not allowed
        max_digits=18,
        decimal_places=2,
    )

    description: str | None = Field(
        default=None,
        max_length=255,
    )


class WithdrawalRequest(BaseModel):
    """Validates a savings account withdrawal request."""

    # Balance and withdrawal rules are checked by the backend.
    amount: Decimal = Field(
        gt=0,
        max_digits=18,
        decimal_places=2,
    )

    description: str | None = Field(
        default=None,
        max_length=255,
    )


class TransactionResponse(BaseModel):
    """Represents a completed financial transaction."""

    transaction_id: int
    account_id: int
    performed_by: int
    transaction_type: TransactionType
    amount: Decimal
    balance_before: Decimal
    balance_after: Decimal
    reference_number: str
    description: str | None
    transaction_time: datetime

    model_config = {
        "from_attributes": True,
    }

class CustomerTransactionResponse(BaseModel):
    """Represents a transaction with its account information."""

    transaction_id: int
    account_id: int
    account_number: str
    account_type: str
    transaction_type: TransactionType
    amount: Decimal
    balance_before: Decimal
    balance_after: Decimal
    reference_number: str
    description: str | None
    transaction_time: datetime

class TransactionAccountSearchResponse(BaseModel):
    """Represents a customer Savings account available for transactions."""

    customer_id: int
    first_name: str
    last_name: str
    email: str
    mobile: str

    account_id: int
    account_number: str
    account_type: str
    account_status: str
    current_balance: Decimal

    outstanding_principal: Decimal | None = None

class TransactionAccountSearchPage(BaseModel):
    items: list[TransactionAccountSearchResponse]
    total: int
    page: int
    page_size: int
    total_pages: int