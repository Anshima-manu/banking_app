"""Safely remove Pennywise customer and banking test data.

Preserved:
    admins
    countries
    states
    cities
    alembic_version

Deleted:
    account_transactions
    loan_installments
    savings_profiles
    loan_profiles
    accounts
    customer_addresses
    customers
"""

import sys
from pathlib import Path

from sqlalchemy import delete, func, select


BACKEND_ROOT = Path(__file__).resolve().parents[1]

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(
        0,
        str(BACKEND_ROOT),
    )


from app.db.session import SessionLocal

from app.models.account import (
    Account,
    LoanProfile,
    SavingsProfile,
)
from app.models.customer import (
    Customer,
    CustomerAddress,
)
from app.models.loan import LoanInstallment
from app.models.location import (
    City,
    Country,
    State,
)
from app.models.transaction import AccountTransaction


def count_rows(
    db,
    model,
) -> int:
    """Return row count for a table."""

    return db.execute(
        select(
            func.count()
        ).select_from(model)
    ).scalar_one()


def reset_demo_data() -> None:
    """Delete customer/banking data while preserving master data."""

    db = SessionLocal()

    try:
        print()
        print(
            "========================================"
        )
        print(
            "PENNYWISE DEMO DATA RESET"
        )
        print(
            "========================================"
        )

        print()
        print(
            "CURRENT DATA"
        )
        print(
            "----------------------------------------"
        )

        tables = [
            (
                "Transactions",
                AccountTransaction,
            ),
            (
                "Loan Installments",
                LoanInstallment,
            ),
            (
                "Savings Profiles",
                SavingsProfile,
            ),
            (
                "Loan Profiles",
                LoanProfile,
            ),
            (
                "Accounts",
                Account,
            ),
            (
                "Customer Addresses",
                CustomerAddress,
            ),
            (
                "Customers",
                Customer,
            ),
        ]

        for label, model in tables:
            total = count_rows(
                db,
                model,
            )

            print(
                f"{label:<25} {total:>12,}"
            )

        print()
        print(
            "PRESERVED MASTER DATA"
        )
        print(
            "----------------------------------------"
        )

        print(
            f"Countries                 "
            f"{count_rows(db, Country):>12,}"
        )

        print(
            f"States                    "
            f"{count_rows(db, State):>12,}"
        )

        print(
            f"Cities / PIN locations    "
            f"{count_rows(db, City):>12,}"
        )

        print()
        print(
            "Deleting transactional data..."
        )

        # Delete strictly in foreign-key dependency order.

        db.execute(
            delete(
                AccountTransaction
            )
        )

        print(
            "[OK] Account transactions deleted."
        )

        db.execute(
            delete(
                LoanInstallment
            )
        )

        print(
            "[OK] Loan installments deleted."
        )

        db.execute(
            delete(
                SavingsProfile
            )
        )

        print(
            "[OK] Savings profiles deleted."
        )

        db.execute(
            delete(
                LoanProfile
            )
        )

        print(
            "[OK] Loan profiles deleted."
        )

        db.execute(
            delete(
                Account
            )
        )

        print(
            "[OK] Accounts deleted."
        )

        db.execute(
            delete(
                CustomerAddress
            )
        )

        print(
            "[OK] Customer addresses deleted."
        )

        db.execute(
            delete(
                Customer
            )
        )

        print(
            "[OK] Customers deleted."
        )

        db.commit()

        print()
        print(
            "========================================"
        )
        print(
            "RESET COMPLETED"
        )
        print(
            "========================================"
        )

        print()
        print(
            "Customer and banking data has been removed."
        )

        print(
            "Admins and India location master data were preserved."
        )

    except Exception:
        db.rollback()

        print()
        print(
            "[FAIL] Reset failed. Database changes were rolled back."
        )

        raise

    finally:
        db.close()


if __name__ == "__main__":
    reset_demo_data()