'''database model for financial account transactions'''

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
)

from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class AccountTransaction(Base):
    '''stores the financial history of customer accounts'''

    __tablename__ = "account_transactions"

    transaction_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )
    account_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("accounts.account_id"),
        nullable=False,
        index=True,
    )
    performed_by: Mapped[int] = mapped_column(
        ForeignKey("admins.admin_id"),
        nullable=False,
        index=True, 
    )
    transaction_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable=False,
    )
    balance_before: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable=False,
    )
    balance_after: Mapped[Decimal] = mapped_column(
            Numeric(18, 2),
            nullable=False,
    )
    reference_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    transaction_time: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    __table_args__ = (
        Index(
            "ix_transactions_account_time",
            "account_id",
            "transaction_time",
        ),
    )

