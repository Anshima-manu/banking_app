"""Pydantic schemas for bank account API operations."""

from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field, model_validator
from app.core.enums import AccountStatus, AccountType


class SavingsProfileCreate(BaseModel):
    """Validates configuration for a new savings account."""

    minimum_balance: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
    )

    daily_withdrawal_limit: Decimal = Field(
        gt=0,
    )


class LoanProfileCreate(BaseModel):
    """Validates configuration for a new loan account."""
    '''gt = greater than, ge = greater than or equal to,
    le = less than or equal to'''

    principal_amount: Decimal = Field(
        gt=0,
    )

    interest_rate: Decimal = Field(
        ge=0,
        le=100,
    )

    tenure_months: int = Field(
        gt=0,
    )

    repayment_start_date: date


class AccountCreate(BaseModel):
    """Validates creation of a savings or loan account."""

    account_type: AccountType

    opening_balance: Decimal | None = Field(
        default=None,
        ge=0,
    )

    savings_profile: SavingsProfileCreate | None = None
    loan_profile: LoanProfileCreate | None = None

    @model_validator(mode="after")
    def validate_opening_balance(self):
        if (
            self.account_type == AccountType.SAVINGS
            and self.opening_balance is None
        ):
            raise ValueError(
                "Opening balance is required for a savings account."
            )

        if (
            self.account_type == AccountType.LOAN
            and self.opening_balance is not None
        ):
            raise ValueError(
                "Opening balance is only allowed for a savings account."
            )

        return self

    @model_validator(mode="after")
    def validate_savings_balance(self):
        if self.account_type == AccountType.SAVINGS:
            if self.opening_balance is None:
                raise ValueError("Opening balance is required.")

            if self.savings_profile is None:
                raise ValueError("Savings profile is required.")

            if (
                self.opening_balance
                < self.savings_profile.minimum_balance
            ):
                raise ValueError(
                    "Opening balance must be greater than or equal "
                    "to the minimum balance."
                )

        return self


class AccountStatusUpdate(BaseModel):
    """Validates an account lifecycle status change."""

    account_status: AccountStatus


class SavingsProfileResponse(BaseModel):
    """Represents savings-specific account information."""

    account_id: int
    minimum_balance: Decimal
    daily_withdrawal_limit: Decimal

    model_config = {
        "from_attributes": True,
    }


class LoanProfileResponse(BaseModel):
    """Represents loan-specific account information."""

    account_id: int
    principal_amount: Decimal
    interest_rate: Decimal
    tenure_months: int
    outstanding_principal: Decimal
    repayment_start_date: date

    model_config = {
        "from_attributes": True,
    }


class AccountResponse(BaseModel):
    """Represents common account information returned by the API."""

    account_id: int
    customer_id: int
    account_number: str
    account_type: AccountType
    account_status: AccountStatus
    current_balance: Decimal
    opened_at: datetime
    closed_at: datetime | None

    model_config = {
        "from_attributes": True,
    }