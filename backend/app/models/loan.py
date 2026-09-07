'''db model for schedueled loan repayments'''

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)

from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class LoanInstallment(Base):
    '''stores individual installments scheduled for a loan account'''
    __tablename__ = "loan_installments"

    installment_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key = True,
        autoincrement = True,
    )

    account_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("loan_profiles.account_id"),
        nullable = False,
        index = True,
    )

    #sequential installment number within the loan
    installment_number: Mapped[int] = mapped_column(
        Integer,
        nullable = False,
    )

    due_date: Mapped[date] = mapped_column(
        Date,
        nullable = False,
        index = True,
    )

    amount_due: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable = False,
    )

    principal_due: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )

    interest_due: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )

    amount_paid: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        default = Decimal("0.00"),
        nullable = False,
    )

    installment_status: Mapped[str] = mapped_column(
        String(20),
        default = "PENDING",
        nullable = False,
        index = True,
    )

    paid_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    __table_args__ = (
        UniqueConstraint(
            "account_id",
            "installment_number",
            name = "uq_loan_installment_number"
        ),
        Index(
            "ix_loan_installments_account_due_date",
            "account_id",
            "due_date",
        ),
    )