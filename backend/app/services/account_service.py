"""Business logic for customer bank account management."""

import secrets
from decimal import Decimal
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import AccountStatus, AccountType
from app.models.account import Account, LoanProfile, SavingsProfile
from app.models.customer import Customer
from app.schemas.account import AccountCreate
from app.services.loan_service import generate_installment_schedule


def generate_account_number(db: Session) -> str:
    """Generate a unique numeric account number."""

    while True:
        account_number = "".join(
            str(secrets.randbelow(10))
            for _ in range(12)
        )

        existing_account = db.execute(
            select(Account).where(
                Account.account_number == account_number
            )
        ).scalar_one_or_none()

        if existing_account is None:
            return account_number


def get_account(
    db: Session,
    account_id: int,
) -> Account:
    """Return an account by ID or raise a 404 error."""

    account = db.get(
        Account,
        account_id,
    )

    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found.",
        )

    return account

def get_savings_profile(
    db: Session,
    account_id: int,
) -> SavingsProfile:
    """Return savings-specific details for a savings account."""

    account = get_account(
        db=db,
        account_id=account_id,
    )

    if account.account_type != AccountType.SAVINGS.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This is not a savings account.",
        )

    profile = db.get(
        SavingsProfile,
        account_id,
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings profile not found.",
        )

    return profile


def get_loan_profile(
    db: Session,
    account_id: int,
) -> LoanProfile:
    """Return loan-specific details for a loan account."""

    account = get_account(
        db=db,
        account_id=account_id,
    )

    if account.account_type != AccountType.LOAN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This is not a loan account.",
        )

    profile = db.get(
        LoanProfile,
        account_id,
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan profile not found.",
        )

    return profile


def get_customer_accounts(
    db: Session,
    customer_id: int,
) -> list[Account]:
    """Return all accounts belonging to a customer."""

    customer = db.get(
        Customer,
        customer_id,
    )

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    accounts = db.execute(
        select(Account)
        .where(
            Account.customer_id == customer_id
        )
        .order_by(Account.opened_at.desc())
    ).scalars().all()

    return list(accounts)


def create_account(
    db: Session,
    customer_id: int,
    data: AccountCreate,
) -> Account:
    """Create an account and its matching product profile."""

    customer = db.get(
        Customer,
        customer_id,
    )

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    # A savings account requires only a savings profile.
    if data.account_type == AccountType.SAVINGS:
        if data.savings_profile is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Savings profile is required.",
            )

        if data.loan_profile is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Loan profile is not allowed for a savings account.",
            )

    # A loan account requires only a loan profile.
    if data.account_type == AccountType.LOAN:
        if data.loan_profile is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Loan profile is required.",
            )

        if data.savings_profile is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Savings profile is not allowed for a loan account.",
            )

        linked_savings_account = db.execute(
            select(Account).where(
                Account.account_id
                == data.loan_profile.linked_savings_account_id,
                Account.customer_id == customer_id,
                Account.account_type == AccountType.SAVINGS.value,
                Account.account_status == AccountStatus.ACTIVE.value,
            )
        ).scalar_one_or_none()

        if linked_savings_account is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Select an active savings account belonging to this customer."
                ),
            )

    try:
        account = Account(
            customer_id=customer_id,
            account_number=generate_account_number(db),
            account_type=data.account_type.value,
            account_status=AccountStatus.ACTIVE.value,
            current_balance=(
                data.opening_balance
                if data.account_type == AccountType.SAVINGS
                else Decimal("0.00")
            ),
        )

        db.add(account)

        # Makes the generated account_id available before commit.
        db.flush()

        if data.account_type == AccountType.SAVINGS:
            profile = data.savings_profile

            savings_profile = SavingsProfile(
                account_id=account.account_id,
                minimum_balance=profile.minimum_balance,
                daily_withdrawal_limit=profile.daily_withdrawal_limit,
            )

            db.add(savings_profile)

        elif data.account_type == AccountType.LOAN:
            profile = data.loan_profile

            loan_profile = LoanProfile(
                account_id=account.account_id,
                principal_amount=profile.principal_amount,
                interest_rate=profile.interest_rate,
                tenure_months=profile.tenure_months,
                outstanding_principal=profile.principal_amount,
                repayment_start_date=profile.repayment_start_date,
                linked_savings_account_id=(
                    profile.linked_savings_account_id
                ),
            )

            db.add(loan_profile)
            db.flush()
            generate_installment_schedule(
                db=db,
                account_id=account.account_id,
            )

        db.commit()
        db.refresh(account)

        return account

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


def update_account_status(
    db: Session,
    account_id: int,
    new_status: AccountStatus,
) -> Account:
    """Change account status while preserving lifecycle history."""

    account = get_account(
        db=db,
        account_id=account_id,
    )

    current_status = account.account_status

    if current_status == AccountStatus.CLOSED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A closed account cannot be reopened.",
        )

    if current_status == new_status.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Account is already {new_status.value}.",
        )

    try:
        account.account_status = new_status.value

        if new_status == AccountStatus.CLOSED:
            account.closed_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(account)

        return account

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise