"""Dashboard API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from datetime import datetime, time, timedelta, timezone
from decimal import Decimal

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models.account import Account, LoanProfile
from app.models.admin import Admin
from app.models.customer import Customer
from app.models.transaction import AccountTransaction
from app.models.loan import LoanInstallment

router = APIRouter()


@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Return dashboard statistics from the database."""

    today = datetime.now(timezone.utc).date()

    seven_day_start_date = (
        today - timedelta(days=6)
    )

    seven_day_start = datetime.combine(
        seven_day_start_date,
        time.min,
    )

    today_start = datetime.combine(
        today,
        time.min,
    )

    tomorrow_start = datetime.combine(
        today + timedelta(days=1),
        time.min,
    )

    total_customers = db.execute(
        select(func.count(Customer.customer_id))
    ).scalar_one()

    active_accounts = db.execute(
        select(func.count(Account.account_id)).where(Account.account_status == "ACTIVE")
    ).scalar_one()

    savings_accounts = db.execute(
        select(func.count(Account.account_id)).where(Account.account_type == "SAVINGS")
    ).scalar_one()

    loan_accounts = db.execute(
        select(func.count(Account.account_id)).where(Account.account_type == "LOAN")
    ).scalar_one()

    frozen_accounts = db.execute(
        select(func.count(Account.account_id)).where(Account.account_status == "FROZEN")
    ).scalar_one()

    closed_accounts = db.execute(
        select(func.count(Account.account_id)).where(Account.account_status == "CLOSED")
    ).scalar_one()

    today_activity = db.execute(
        select(
            func.count(AccountTransaction.transaction_id).label("total_transactions"),
            func.sum(
                func.if_(
                    AccountTransaction.transaction_type == "DEPOSIT",
                    1,
                    0,
                )
            ).label("deposit_count"),
            func.sum(
                func.if_(
                    AccountTransaction.transaction_type == "WITHDRAWAL",
                    1,
                    0,
                )
            ).label("withdrawal_count"),
            func.sum(
                func.if_(
                    AccountTransaction.transaction_type == "LOAN_REPAYMENT",
                    1,
                    0,
                )
            ).label("loan_repayment_count"),
            func.sum(
                func.if_(
                    AccountTransaction.transaction_type == "DEPOSIT",
                    AccountTransaction.amount,
                    0,
                )
            ).label("total_deposits"),
            func.sum(
                func.if_(
                    AccountTransaction.transaction_type == "WITHDRAWAL",
                    AccountTransaction.amount,
                    0,
                )
            ).label("total_withdrawals"),
            func.sum(
                func.if_(
                    AccountTransaction.transaction_type == "LOAN_REPAYMENT",
                    AccountTransaction.amount,
                    0,
                )
            ).label("total_loan_repayments"),
        ).where(
            AccountTransaction.transaction_time >= today_start,
            AccountTransaction.transaction_time < tomorrow_start,
        )
    ).one()

    overdue_activity = db.execute(
        select(
            func.count(
                LoanInstallment.installment_id
            ).label(
                "overdue_installments"
            ),

            func.count(
                func.distinct(
                    LoanInstallment.account_id
                )
            ).label(
                "overdue_loan_accounts"
            ),

            func.coalesce(
                func.sum(
                    LoanInstallment.amount_due
                    - LoanInstallment.amount_paid
                ),
                0,
            ).label(
                "total_overdue_amount"
            ),
        )
        .where(
            LoanInstallment.installment_status
            == "OVERDUE"
        )
    ).one()

    loan_portfolio = db.execute(
        select(
            func.count(
                LoanProfile.account_id
            ).label(
                "total_loans"
            ),

            func.coalesce(
                func.sum(
                    LoanProfile.principal_amount
                ),
                0,
            ).label(
                "total_principal"
            ),

            func.coalesce(
                func.sum(
                    LoanProfile.outstanding_principal
                ),
                0,
            ).label(
                "outstanding_principal"
            ),
        )
    ).one()

    seven_day_rows = db.execute(
        select(
            func.date(
                AccountTransaction.transaction_time
            ).label(
                "activity_date"
            ),

            func.count(
                AccountTransaction.transaction_id
            ).label(
                "transaction_count"
            ),

            func.sum(
                func.if_(
                    AccountTransaction.transaction_type
                    == "DEPOSIT",
                    1,
                    0,
                )
            ).label(
                "deposit_count"
            ),

            func.sum(
                func.if_(
                    AccountTransaction.transaction_type
                    == "WITHDRAWAL",
                    1,
                    0,
                )
            ).label(
                "withdrawal_count"
            ),

            func.sum(
                func.if_(
                    AccountTransaction.transaction_type
                    == "LOAN_REPAYMENT",
                    1,
                    0,
                )
            ).label(
                "loan_repayment_count"
            ),
        )
        .where(
            AccountTransaction.transaction_time
            >= seven_day_start,

            AccountTransaction.transaction_time
            < tomorrow_start,
        )
        .group_by(
            func.date(
                AccountTransaction.transaction_time
            )
        )
        .order_by(
            func.date(
                AccountTransaction.transaction_time
            ).asc()
        )
    ).all()

    activity_by_date = {
        str(row.activity_date): row
        for row in seven_day_rows
    }


    seven_day_activity = []

    for day_offset in range(7):
        activity_date = (
            seven_day_start_date
            + timedelta(
                days=day_offset
            )
        )

        activity_key = str(
            activity_date
        )

        row = activity_by_date.get(
            activity_key
        )

        seven_day_activity.append(
            {
                "date":
                    activity_key,

                "transaction_count": (
                    row.transaction_count
                    if row
                    else 0
                ),

                "deposit_count": (
                    row.deposit_count
                    if row
                    else 0
                ),

                "withdrawal_count": (
                    row.withdrawal_count
                    if row
                    else 0
                ),

                "loan_repayment_count": (
                    row.loan_repayment_count
                    if row
                    else 0
                ),
            }
        )

    total_principal = (
        loan_portfolio.total_principal
        or Decimal("0.00")
    )

    outstanding_principal = (
        loan_portfolio.outstanding_principal
        or Decimal("0.00")
    )

    repaid_principal = (
        total_principal
        - outstanding_principal
    )

    if repaid_principal < Decimal("0.00"):
        repaid_principal = Decimal("0.00")

    if total_principal > Decimal("0.00"):
        repayment_percentage = round(
            float(
                repaid_principal
                / total_principal
                * Decimal("100")
            ),
            2,
        )
    else:
        repayment_percentage = 0.0

    return {
        "total_customers": total_customers,
        "active_accounts": active_accounts,
        "savings_accounts": savings_accounts,
        "loan_accounts": loan_accounts,
        "frozen_accounts": frozen_accounts,
        "closed_accounts": closed_accounts,
        "today_activity": {
            "total_transactions": (
                today_activity.total_transactions
                or 0
            ),

            "deposit_count": (
                today_activity.deposit_count
                or 0
            ),

            "withdrawal_count": (
                today_activity.withdrawal_count
                or 0
            ),

            "loan_repayment_count": (
                today_activity.loan_repayment_count
                or 0
            ),

            "total_deposits": (
                today_activity.total_deposits
                or Decimal("0.00")
            ),

            "total_withdrawals": (
                today_activity.total_withdrawals
                or Decimal("0.00")
            ),

            "total_loan_repayments": (
                today_activity.total_loan_repayments
                or Decimal("0.00")
            ),
        },
        "operational_attention": {
            "frozen_accounts":
                frozen_accounts,

            "overdue_loan_accounts": (
                overdue_activity.overdue_loan_accounts
                or 0
            ),

            "overdue_installments": (
                overdue_activity.overdue_installments
                or 0
            ),

            "total_overdue_amount": (
                overdue_activity.total_overdue_amount
                or Decimal("0.00")
            ),
        },
        "loan_portfolio": {
            "total_loans": (
                loan_portfolio.total_loans
                or 0
            ),

            "total_principal": (
                total_principal
            ),

            "outstanding_principal": (
                outstanding_principal
            ),

            "repaid_principal": (
                repaid_principal
            ),

            "repayment_percentage": (
                repayment_percentage
            ),
        },
        "seven_day_activity":
            seven_day_activity,
        
    }
