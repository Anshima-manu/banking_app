"""Pydantic schemas for account transaction reports."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel

from app.core.enums import TransactionType


class ReportTransaction(BaseModel):
    """Represents one transaction included in an account report."""

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


class ReportSummary(BaseModel):
    """Represents calculated totals for an account report."""

    opening_balance: Decimal
    closing_balance: Decimal
    total_deposits: Decimal
    total_withdrawals: Decimal
    total_loan_repayments: Decimal
    transaction_count: int


class AccountReportResponse(BaseModel):
    """Represents a complete account transaction report."""

    account_id: int
    account_number: str
    account_type: str

    customer_id: int
    first_name: str
    last_name: str

    start_date: date
    end_date: date

    opening_balance: Decimal
    closing_balance: Decimal

    total_deposits: Decimal
    total_withdrawals: Decimal
    total_loan_repayments: Decimal

    transaction_count: int

    transactions: list[ReportTransaction]

class CustomerReportTransaction(BaseModel):
    """Represents one transaction in a combined customer report."""

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


class CustomerReportResponse(BaseModel):
    """Represents transactions across all accounts owned by a customer."""

    customer_id: int
    first_name: str
    last_name: str
    email: str
    mobile: str

    start_date: date
    end_date: date

    account_count: int

    total_deposits: Decimal
    total_withdrawals: Decimal
    total_loan_repayments: Decimal

    transaction_count: int

    transactions: list[CustomerReportTransaction]
