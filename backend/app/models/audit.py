'''db model for administrative audit events'''

from datetime import datetime, timezone
from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Integer,
    String,
)

from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class AuditEvent(Base):
    '''records important administrative changes in the banking system'''

    __tablename__ = "audit_events"

    audit_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )
    admin_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("admins.admin_id"),
        nullable=False,
        index=True,
    )
    customer_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("customers.customer_id"),
        nullable = True,
        index = True,
    )
    account_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("accounts.account_id"),
        nullable=True,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    change_summary: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    