'''database models for bank accounts and account-specific profiles'''

from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import(
    BigInteger,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class Account(Base):
    '''stores info shared by all customer bank accounts'''
    __tablename__ = "accounts"

    '''internal identifier used for db relationships'''
    account_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key = True,
        autoincrement = True,
    )

    '''customer who owns this account'''
    customer_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("customers.customer_id"),
        nullable = False,
        index = True,
    )
    account_number: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        nullable=False,
        index=True,
    )
    account_type: Mapped[str] = mapped_column(
        String(20),
        nullable = False,
    )
    account_status: Mapped[str] = mapped_column(
        String(20),
        default = "ACTIVE",
        nullable = False,
        index = True,
    )
    current_balance: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        default = Decimal("0.00"),
        nullable = False,
    )
    opened_at: Mapped[datetime] = mapped_column(
        DateTime,
        default = lambda: datetime.now(timezone.utc),
        nullable = False,
    )
    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable = True,
    )

class SavingsProfile(Base):
    '''stores configuration specific to a savings account'''
    __tablename__ = "savings_profiles"

    account_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("accounts.account_id"),
        primary_key = True,
    )
    minimum_balance: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        default = Decimal("0.00"),
        nullable = False,
    )
    daily_withdrawal_limit: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable = False,
    )

class LoanProfile(Base):
    '''stores lending info specific to a loan account'''
    __tablename__ = "loan_profiles"

    account_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("accounts.account_id"),
        primary_key = True,
    )
    principal_amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable = False,
    )
    interest_rate: Mapped[Decimal] = mapped_column(
        Numeric(6, 3),
        nullable = False,
    )
    tenure_months: Mapped[int] = mapped_column(
        Integer,
        nullable = False,
    )
    outstanding_principal: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable = False,
    )
    repayment_start_date: Mapped[date] = mapped_column(
        Date,
        nullable = False,
    )
    linked_savings_account_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("accounts.account_id"),
        nullable=True,
        index=True,
    )

