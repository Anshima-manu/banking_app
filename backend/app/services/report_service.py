"""Business logic for account transaction reports."""

from datetime import datetime, time
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.transaction import AccountTransaction
from app.models.customer import Customer
from app.models.customer import Customer


def generate_account_report(
    db: Session,
    account_id: int,
    start_date: datetime,
    end_date: datetime,
    transaction_type: str | None = None,
) -> dict:
    """Generate a transaction report for one account."""

    account = db.get(
        Account,
        account_id,
    )

    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found.",
        )

    customer = db.get(
        Customer,
        account.customer_id,
    )

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    if start_date.date() > end_date.date():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date cannot be after end date.",
        )

    start_of_day = datetime.combine(
        start_date.date(),
        time.min,
    )

    end_of_day = datetime.combine(
        end_date.date(),
        time.max,
    )

    opening_transaction = db.execute(
        select(AccountTransaction)
        .where(
            AccountTransaction.account_id == account_id,
            AccountTransaction.transaction_time < start_of_day,
        )
        .order_by(
            AccountTransaction.transaction_time.desc()
        )
        .limit(1)
    ).scalar_one_or_none()

    if opening_transaction is not None:
        opening_balance = (
            opening_transaction.balance_after
        )
    else:
        opening_balance = Decimal("0.00")

    closing_transaction = db.execute(
        select(AccountTransaction)
        .where(
            AccountTransaction.account_id == account_id,
            AccountTransaction.transaction_time <= end_of_day,
        )
        .order_by(
            AccountTransaction.transaction_time.desc()
        )
        .limit(1)
    ).scalar_one_or_none()

    if closing_transaction is not None:
        closing_balance = closing_transaction.balance_after
    else:
        closing_balance = opening_balance

    query = (
        select(AccountTransaction)
        .where(
            AccountTransaction.account_id == account_id,
            AccountTransaction.transaction_time >= start_of_day,
            AccountTransaction.transaction_time <= end_of_day,
        )
        .order_by(
            AccountTransaction.transaction_time.asc()
        )
    )

    if transaction_type:
        query = query.where(
            AccountTransaction.transaction_type
            == transaction_type
        )

    transactions = db.execute(
        query
    ).scalars().all()

    total_deposits = Decimal("0.00")
    total_withdrawals = Decimal("0.00")
    total_loan_repayments = Decimal("0.00")

    for transaction in transactions:
        if transaction.transaction_type == "DEPOSIT":
            total_deposits += transaction.amount

        elif transaction.transaction_type == "WITHDRAWAL":
            total_withdrawals += transaction.amount

        elif transaction.transaction_type == "LOAN_REPAYMENT":
            total_loan_repayments += transaction.amount

    return {
        "account_id": account.account_id,
        "account_number": account.account_number,
        "account_type": account.account_type,

        "customer_id": customer.customer_id,
        "first_name": customer.first_name,
        "last_name": customer.last_name,

        "start_date": start_date.date(),
        "end_date": end_date.date(),

        "opening_balance": opening_balance,
        "closing_balance": closing_balance,

        "total_deposits": total_deposits,
        "total_withdrawals": total_withdrawals,
        "total_loan_repayments": total_loan_repayments,
        
        "transaction_count": len(transactions),
        "transactions": list(transactions),
    }

def search_report_accounts(
    db: Session,
    search: str,
) -> list:
    """Search Savings and Loan accounts for reporting."""

    value = search.strip()

    if not value:
        return []

    rows = db.execute(
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
        )
        .join(
            Account,
            Account.customer_id == Customer.customer_id,
        )
        .where(
            or_(
                Customer.first_name.ilike(
                    f"%{value}%"
                ),
                Customer.last_name.ilike(
                    f"%{value}%"
                ),
                Customer.email.ilike(
                    f"%{value}%"
                ),
                Customer.mobile.ilike(
                    f"%{value}%"
                ),
                Account.account_number.ilike(
                    f"%{value}%"
                ),
            )
        )
        .order_by(
            Customer.first_name.asc(),
            Customer.last_name.asc(),
            Account.account_type.asc(),
            Account.account_id.asc(),
        )
        .limit(10)
    ).all()

    return [
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
        }
        for row in rows
    ]

def generate_customer_report(
    db: Session,
    customer_id: int,
    start_date: datetime,
    end_date: datetime,
    transaction_type: str | None = None,
) -> dict:
    """Generate a combined transaction report for all customer accounts."""

    customer = db.get(
        Customer,
        customer_id,
    )

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    if start_date.date() > end_date.date():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date cannot be after end date.",
        )

    start_of_day = datetime.combine(
        start_date.date(),
        time.min,
    )

    end_of_day = datetime.combine(
        end_date.date(),
        time.max,
    )

    query = (
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
            Account.customer_id == customer_id,
            AccountTransaction.transaction_time
            >= start_of_day,
            AccountTransaction.transaction_time
            <= end_of_day,
        )
        .order_by(
            AccountTransaction.transaction_time.desc()
        )
    )

    if transaction_type:
        query = query.where(
            AccountTransaction.transaction_type
            == transaction_type
        )

    rows = db.execute(
        query
    ).all()

    total_deposits = Decimal("0.00")
    total_withdrawals = Decimal("0.00")
    total_loan_repayments = Decimal("0.00")

    transactions = []

    for (
        transaction,
        account_number,
        account_type,
    ) in rows:
        if transaction.transaction_type == "DEPOSIT":
            total_deposits += transaction.amount

        elif transaction.transaction_type == "WITHDRAWAL":
            total_withdrawals += transaction.amount

        elif (
            transaction.transaction_type
            == "LOAN_REPAYMENT"
        ):
            total_loan_repayments += transaction.amount

        transactions.append(
            {
                "transaction_id":
                    transaction.transaction_id,

                "account_id":
                    transaction.account_id,

                "account_number":
                    account_number,

                "account_type":
                    account_type,

                "transaction_type":
                    transaction.transaction_type,

                "amount":
                    transaction.amount,

                "balance_before":
                    transaction.balance_before,

                "balance_after":
                    transaction.balance_after,

                "reference_number":
                    transaction.reference_number,

                "description":
                    transaction.description,

                "transaction_time":
                    transaction.transaction_time,
            }
        )

    account_count = db.execute(
        select(
            func.count(Account.account_id)
        ).where(
            Account.customer_id == customer_id
        )
    ).scalar_one()

    return {
        "customer_id": customer.customer_id,
        "first_name": customer.first_name,
        "last_name": customer.last_name,
        "email": customer.email,
        "mobile": customer.mobile,
        "start_date": start_date.date(),
        "end_date": end_date.date(),
        "account_count": account_count,
        "total_deposits": total_deposits,
        "total_withdrawals": total_withdrawals,
        "total_loan_repayments": total_loan_repayments,
        "transaction_count": len(transactions),
        "transactions": transactions,
    }