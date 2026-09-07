"""Business logic for savings account deposits and withdrawals."""

from datetime import datetime, time
from decimal import Decimal
from uuid import uuid4
from math import ceil

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.enums import (
    AccountStatus,
    AccountType,
    TransactionType,
)
from app.models.account import Account, SavingsProfile
from app.models.transaction import AccountTransaction
from app.models.customer import Customer
from app.models.account import LoanProfile


def generate_transaction_reference() -> str:
    """Generate a unique reference for a financial transaction."""

    return f"TXN-{uuid4().hex[:16].upper()}"


def get_locked_savings_account(
    db: Session,
    account_id: int,
) -> Account:
    """Lock and return an active savings account."""

    account = db.execute(
        select(Account)
        .where(Account.account_id == account_id)
        .with_for_update() # it locks the account row while the transaction is being processed
    ).scalar_one_or_none()

    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found.",
        )

    if account.account_type != AccountType.SAVINGS.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This operation is allowed only for savings accounts.",
        )

    if account.account_status != AccountStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The account is not active.",
        )

    return account


def deposit(
    db: Session,
    account_id: int,
    amount: Decimal,
    admin_id: int,
    description: str | None = None,
) -> AccountTransaction:
    """Deposit funds and record the resulting transaction."""

    try:
        account = get_locked_savings_account(
            db=db,
            account_id=account_id,
        )

        balance_before = account.current_balance
        balance_after = balance_before + amount

        account.current_balance = balance_after

        transaction = AccountTransaction(
            account_id=account.account_id,
            performed_by=admin_id,
            transaction_type=TransactionType.DEPOSIT.value,
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            reference_number=generate_transaction_reference(),
            description=description,
        )

        db.add(transaction)
        db.commit()
        db.refresh(transaction)

        return transaction

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


def get_today_withdrawal_total(
    db: Session,
    account_id: int,
) -> Decimal:
    """Return the total amount withdrawn from an account today."""

    today = datetime.now().date()

    start_of_day = datetime.combine(
        today,
        time.min,
    )

    end_of_day = datetime.combine(
        today,
        time.max,
    )

    total = db.execute(
        select(
            func.coalesce(
                func.sum(AccountTransaction.amount),
                Decimal("0.00"),
            )
        )
        .where(
            AccountTransaction.account_id == account_id,
            AccountTransaction.transaction_type
            == TransactionType.WITHDRAWAL.value,
            AccountTransaction.transaction_time >= start_of_day,
            AccountTransaction.transaction_time <= end_of_day,
        )
    ).scalar_one()

    return Decimal(total)


def withdraw(
    db: Session,
    account_id: int,
    amount: Decimal,
    admin_id: int,
    description: str | None = None,
) -> AccountTransaction:
    """Withdraw funds after applying savings account rules."""

    try:
        account = get_locked_savings_account(
            db=db,
            account_id=account_id,
        )

        profile = db.get(
            SavingsProfile,
            account.account_id,
        )

        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Savings profile is missing.",
            )

        today_total = get_today_withdrawal_total(
            db=db,
            account_id=account.account_id,
        )

        if today_total + amount > profile.daily_withdrawal_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Daily withdrawal limit exceeded.",
            )

        if amount > account.current_balance:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient account balance.",
            )

        balance_after = account.current_balance - amount

        if balance_after < profile.minimum_balance:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Minimum balance requirement would be violated.",
            )

        balance_before = account.current_balance
        account.current_balance = balance_after

        transaction = AccountTransaction(
            account_id=account.account_id,
            performed_by=admin_id,
            transaction_type=TransactionType.WITHDRAWAL.value,
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            reference_number=generate_transaction_reference(),
            description=description,
        )

        db.add(transaction)
        db.commit()
        db.refresh(transaction)

        return transaction

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise

def get_customer_transactions(
    db: Session,
    customer_id: int,
) -> list:
    """Return transactions from all accounts belonging to a customer."""

    customer_exists = db.execute(
        select(Account.customer_id).where(
            Account.customer_id == customer_id
        )
    ).first()

    if customer_exists is None:
        from app.models.customer import Customer

        customer = db.get(
            Customer,
            customer_id,
        )

        if customer is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found.",
            )

    rows = db.execute(
        select(
            AccountTransaction,
            Account.account_number,
            Account.account_type,
        )
        .join(
            Account,
            Account.account_id
            == AccountTransaction.account_id,
        )
        .where(
            Account.customer_id == customer_id
        )
        .order_by(
            AccountTransaction.transaction_time.desc()
        )
    ).all()

    transactions = []

    for transaction, account_number, account_type in rows:
        transactions.append(
            {
                "transaction_id": transaction.transaction_id,
                "account_id": transaction.account_id,
                "account_number": account_number,
                "account_type": account_type,
                "transaction_type": transaction.transaction_type,
                "amount": transaction.amount,
                "balance_before": transaction.balance_before,
                "balance_after": transaction.balance_after,
                "reference_number": transaction.reference_number,
                "description": transaction.description,
                "transaction_time": transaction.transaction_time,
            }
        )

    return transactions

def search_transaction_accounts(
    db: Session,
    search: str,
    page: int = 1,
    page_size: int = 10,
) -> dict:
    value = search.strip()

    if not value:
        return {
            "items": [],
            "total": 0,
            "page": page,
            "page_size": page_size,
            "total_pages": 0,
        }

    filters = (
        Account.account_type.in_(["SAVINGS", "LOAN"]),
        or_(
            Customer.first_name.ilike(f"%{value}%"),
            Customer.last_name.ilike(f"%{value}%"),
            Customer.email.ilike(f"%{value}%"),
            Customer.mobile.ilike(f"%{value}%"),
            Account.account_number.ilike(f"%{value}%"),
        ),
    )

    total = db.scalar(
        select(func.count())
        .select_from(Account)
        .join(Customer, Account.customer_id == Customer.customer_id)
        .where(*filters)
    ) or 0

    query = (
        select(
            Customer.customer_id,
            Customer.first_name,
            Customer.last_name,
            Customer.email,
            Customer.mobile,
            Account.account_id,
            Account.account_number,
            Account.account_type,
            Account.account_status,
            Account.current_balance,
            LoanProfile.outstanding_principal,
        )
        .join(Account, Account.customer_id == Customer.customer_id)
        .outerjoin(LoanProfile, LoanProfile.account_id == Account.account_id)
        .where(*filters)
        .order_by(Customer.first_name, Customer.last_name, Account.account_id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    rows = db.execute(query).all()

    items = [
        {
            "customer_id": row.customer_id,
            "first_name": row.first_name,
            "last_name": row.last_name,
            "email": row.email,
            "mobile": row.mobile,
            "account_id": row.account_id,
            "account_number": row.account_number,
            "account_type": row.account_type,
            "account_status": row.account_status,
            "current_balance": row.current_balance,
            "outstanding_principal": row.outstanding_principal,
        }
        for row in rows
    ]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": ceil(total / page_size) if total else 0,
    }