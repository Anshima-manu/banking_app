"""Pydantic schemas for customer and address API operations."""

from datetime import date, datetime
from pydantic import BaseModel, EmailStr, Field
from app.core.enums import AddressType
from app.schemas.account import AccountCreate


class AddressCreate(BaseModel):
    """Validates a new customer address."""

    city_id: int
    address_type: AddressType

    address_line_1: str = Field(
        min_length=3,
        max_length=255,
    )

    address_line_2: str | None = Field(
        default=None,
        max_length=255,
    )

    is_primary: bool = False


class AddressUpdate(BaseModel):
    """validates editable address fields"""

    city_id: int | None = None
    address_type: AddressType | None = None

    address_line_1: str | None = Field(
        default=None,
        min_length=3,
        max_length=255,
    )

    address_line_2: str | None = Field(
        default=None,
        max_length=255,
    )

    is_primary: bool | None = None


class AddressResponse(BaseModel):
    """Represents a customer address returned by the API."""

    address_id: int
    city_id: int
    address_type: AddressType
    address_line_1: str
    address_line_2: str | None
    is_primary: bool

    model_config = {
        "from_attributes": True,
    }


class CustomerCreate(BaseModel):
    """Validates data required to create a customer."""

    first_name: str = Field(
        min_length=2,
        max_length=100,
    )

    last_name: str = Field(
        min_length=2,
        max_length=100,
    )

    date_of_birth: date

    email: EmailStr

    mobile: str = Field(
        min_length=10,
        max_length=10,
        pattern=r"^\d{10}$",
    )

    marital_status: str | None = Field(
        default=None,
        max_length=30,
    )

    gender: str = Field(
        min_length=1,
        max_length=20,
    )


    addresses: list[AddressCreate] = Field(
        min_length=1,
    )

    account: AccountCreate


class CustomerUpdate(BaseModel):
    """validates fields that may be changed for a customer"""

    first_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    last_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    date_of_birth: date | None = None
    email: EmailStr | None = None

    mobile: str | None = Field(
        default=None,
        min_length=7,
        max_length=20,
    )

    marital_status: str | None = Field(
        default=None,
        max_length=30,
    )

    gender: str | None = Field(
        default=None,
        max_length=20,
    )


class CustomerResponse(BaseModel):
    """represents customer information returned by the API"""

    customer_id: int
    first_name: str
    last_name: str
    date_of_birth: date
    email: EmailStr #this gives email-format validation
    mobile: str
    marital_status: str | None
    gender: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class CustomerSearchPage(BaseModel):
    items: list[CustomerResponse]
    total: int
    page: int
    page_size: int
    total_pages: int