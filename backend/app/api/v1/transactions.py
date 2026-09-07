"""API routes for account transactions."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models.account import Account
from app.models.admin import Admin
from app.models.transaction import AccountTransaction
from app.schemas.transaction import (
    DepositRequest,
    TransactionResponse,
    WithdrawalRequest,
    TransactionAccountSearchPage,
)
from app.services.transaction_service import (
    deposit,
    withdraw,
    search_transaction_accounts,
)

router = APIRouter()

# POST http://localhost:8000/api/v1/accounts/1/deposit with authorization
# token, it will provide deposit details

@router.get(
    "/transactions/search",
    response_model=TransactionAccountSearchPage,
)
def search_transaction_accounts_route(
    search: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Search customers and return Savings accounts for transactions."""

    return search_transaction_accounts(
        db=db,
        search=search,
        page=page,
        page_size=page_size,
    )

@router.post(
    "/accounts/{account_id}/deposit",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
def deposit_route(
    account_id: int,
    request: DepositRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Deposit funds into an active savings account."""

    return deposit(
        db=db,
        account_id=account_id,
        amount=request.amount,
        admin_id=current_admin.admin_id,
        description=request.description,
    )

# POST http://localhost:8000/api/v1/accounts/1/withdraw for monetary withdrawal

@router.post(
    "/accounts/{account_id}/withdraw",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
def withdraw_route(
    account_id: int,
    request: WithdrawalRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Withdraw funds after applying savings account rules."""

    return withdraw(
        db=db,
        account_id=account_id,
        amount=request.amount,
        admin_id=current_admin.admin_id,
        description=request.description,
    )

# GET http://localhost:8000/api/v1/accounts/1/transactions to get transaction history

@router.get(
    "/accounts/{account_id}/transactions",
    response_model=list[TransactionResponse],
)
def get_transactions_route(
    account_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Return transaction history for an account."""

    account = db.get(
        Account,
        account_id,
    )

    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found.",
        )

    transactions = db.execute(
        select(AccountTransaction)
        .where(
            AccountTransaction.account_id == account_id
        )
        .order_by(
            AccountTransaction.transaction_time.desc()
        )
    ).scalars().all()

    return list(transactions)