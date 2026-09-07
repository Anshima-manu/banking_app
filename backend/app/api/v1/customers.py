"""API routes for customer management."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models.admin import Admin
from app.schemas.customer import (
    AddressCreate,
    AddressResponse,
    AddressUpdate,
    CustomerCreate,
    CustomerResponse,
    CustomerSearchPage,
    CustomerUpdate,
)
from app.services.customer_service import (
    create_customer,
    create_customer_address,
    delete_customer_address,
    get_customer,
    get_customer_addresses,
    search_customers,
    update_customer,
    update_customer_address,
)
from app.schemas.transaction import CustomerTransactionResponse
from app.services.transaction_service import get_customer_transactions


router = APIRouter()


@router.post(
    "",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_customer_route(
    request: CustomerCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
) -> CustomerResponse:
    """Create a customer using validated request data."""

    return create_customer(
        db=db,
        data=request,
    )


@router.get(
    "",
    response_model=CustomerSearchPage,
)
def search_customers_route(
    customer_id: int | None = Query(default=None),
    first_name: str | None = Query(default=None),
    last_name: str | None = Query(default=None),
    email: str | None = Query(default=None),
    mobile: str | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
) -> CustomerSearchPage:
    """Search customers using optional query parameters."""

    return search_customers(
        db=db,
        customer_id=customer_id,
        first_name=first_name,
        last_name=last_name,
        email=email,
        mobile=mobile,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
)
def get_customer_route(
    customer_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
) -> CustomerResponse:
    """Return one customer using the customer ID."""

    return get_customer(
        db=db,
        customer_id=customer_id,
    )


@router.patch(
    "/{customer_id}",
    response_model=CustomerResponse,
)
def update_customer_route(
    customer_id: int,
    request: CustomerUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
) -> CustomerResponse:
    """Update only the customer fields supplied in the request."""

    return update_customer(
        db=db,
        customer_id=customer_id,
        data=request,
    )

@router.get(
    "/{customer_id}/addresses",
    response_model=list[AddressResponse],
)
def get_customer_addresses_route(
    customer_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Return all addresses belonging to a customer."""

    return get_customer_addresses(
        db=db,
        customer_id=customer_id,
    )


@router.post(
    "/{customer_id}/addresses",
    response_model=AddressResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_customer_address_route(
    customer_id: int,
    request: AddressCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Add an address to an existing customer."""

    return create_customer_address(
        db=db,
        customer_id=customer_id,
        data=request,
    )


@router.patch(
    "/{customer_id}/addresses/{address_id}",
    response_model=AddressResponse,
)
def update_customer_address_route(
    customer_id: int,
    address_id: int,
    request: AddressUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Update one customer address."""

    return update_customer_address(
        db=db,
        customer_id=customer_id,
        address_id=address_id,
        data=request,
    )


@router.delete(
    "/{customer_id}/addresses/{address_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_customer_address_route(
    customer_id: int,
    address_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Delete one customer address."""

    delete_customer_address(
        db=db,
        customer_id=customer_id,
        address_id=address_id,
    )

@router.get(
    "/{customer_id}/transactions",
    response_model=list[CustomerTransactionResponse],
)
def get_customer_transactions_route(
    customer_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Return transactions across all accounts owned by a customer."""

    return get_customer_transactions(
        db=db,
        customer_id=customer_id,
    )