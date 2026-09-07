'''database models for customer details and addresses'''

from datetime import date, datetime, timezone

from sqlalchemy import(
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
)

from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class Customer(Base):
    '''Stores a customer's personal and contact info'''
    __tablename__ = "customers"

    '''internal db identifier'''
    customer_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key = True,
        autoincrement = True,
    )
    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable = False,
    )
    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable = False,
    )
    date_of_birth: Mapped[date] = mapped_column(
        Date,
        nullable = False,
    )
    email: Mapped[str] = mapped_column(
        String(225),
        unique = True,
        nullable = False,
        index = True,
    )
    mobile: Mapped[str] = mapped_column(
        String(20),
        nullable = False,
        index = True,
    )
    marital_status: Mapped[str | None] = mapped_column(
        String(30),
    )
    gender: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default = lambda: datetime.now(timezone.utc),
        nullable = False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default = lambda: datetime.now(timezone.utc),
        onupdate = lambda: datetime.now(timezone.utc),
        nullable = False,
    )

class CustomerAddress(Base):
    '''stores current and permanent addresses for customers'''
    __tablename__ = "customer_addresses"

    address_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key = True,
        autoincrement = True,
    )
    customer_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("customers.customer_id"),
        nullable = False,
        index = True,
    )
    city_id: Mapped[int] = mapped_column(
        ForeignKey("cities.city_id"),
        nullable = False,
        index = True,
    )
    address_type: Mapped[str] = mapped_column(
        String(20),
        nullable = False,
    )
    address_line_1: Mapped[str] = mapped_column(
        String(255),
        nullable = False,
    )
    address_line_2: Mapped[str | None] = mapped_column(
        String(255),
    )
    is_primary: Mapped[bool] = mapped_column(
        Boolean,
        default = False,
        nullable = False,
    )
    #a customer can only have one address of each type
    __table_args__ = (
        UniqueConstraint(
            "customer_id",
            "address_type",
            name = "uq_customer_address_type",
        ),
    )
