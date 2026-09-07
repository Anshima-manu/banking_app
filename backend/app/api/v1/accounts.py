"""API routes for customer bank account management."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models.admin import Admin
from app.schemas.account import (
    AccountCreate,
    AccountResponse,
    AccountStatusUpdate,
    LoanProfileResponse,
    SavingsProfileResponse
)
from app.services.account_service import (
    create_account,
    get_account,
    get_customer_accounts,
    get_loan_profile,
    get_savings_profile,
    update_account_status,
)


router = APIRouter()

# POST /api/v1/customers/1/accounts to create savings account
# POST /api/v1/customers/1/accounts to create loan account


@router.post(
    "/customers/{customer_id}/accounts",
    response_model=AccountResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_account_route(
    customer_id: int,
    request: AccountCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Create a Savings or Loan account for a customer."""

    return create_account(
        db=db,
        customer_id=customer_id,
        data=request,
    )

# GET /api/v1/customers/1/accounts to get customer's all accounts (1 is the customer_id)

@router.get(
    "/customers/{customer_id}/accounts",
    response_model=list[AccountResponse],
)
def get_customer_accounts_route(
    customer_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Return all accounts belonging to a customer."""

    return get_customer_accounts(
        db=db,
        customer_id=customer_id,
    )

# GET /api/v1/accounts/10 to get one account (this returns account 10)

@router.get(
    "/accounts/{account_id}",
    response_model=AccountResponse,
)
def get_account_route(
    account_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Return one account using its internal account ID."""

    return get_account(
        db=db,
        account_id=account_id,
    )

# PATCH /api/v1/accounts/10/status to freeze an account

@router.patch(
    "/accounts/{account_id}/status",
    response_model=AccountResponse,
)
def update_account_status_route(
    account_id: int,
    request: AccountStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Change the operational status of an account."""

    return update_account_status(
        db=db,
        account_id=account_id,
        new_status=request.account_status,
    )

@router.get(
    "/accounts/{account_id}/savings-profile",
    response_model=SavingsProfileResponse,
)
def get_savings_profile_route(
    account_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Return savings-specific information for an account."""

    return get_savings_profile(
        db=db,
        account_id=account_id,
    )

@router.get(
    "/accounts/{account_id}/loan-profile",
    response_model=LoanProfileResponse,
)
def get_loan_profile_route(
    account_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Return loan-specific information for an account."""

    return get_loan_profile(
        db=db,
        account_id=account_id,
    )