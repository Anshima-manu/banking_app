"""Preflight checks before generating the Pennywise large synthetic dataset."""

import sys
from pathlib import Path

from sqlalchemy import func, select


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
    """Return the number of rows in a model table."""

    return db.execute(
        select(
            func.count()
        ).select_from(model)
    ).scalar_one()


def run_preflight() -> None:
    """Inspect Pennywise before large-scale synthetic data generation."""

    db = SessionLocal()

    try:
        india = db.execute(
            select(Country).where(
                Country.country_name == "India"
            )
        ).scalar_one_or_none()

        if india is None:
            print(
                "[FAIL] India is missing from countries."
            )

            return

        state_count = db.execute(
            select(
                func.count(State.state_id)
            ).where(
                State.country_id
                == india.country_id
            )
        ).scalar_one()

        location_count = db.execute(
            select(
                func.count(City.city_id)
            )
            .join(
                State,
                City.state_id
                == State.state_id,
            )
            .where(
                State.country_id
                == india.country_id
            )
        ).scalar_one()

        valid_location_count = db.execute(
            select(
                func.count(City.city_id)
            )
            .join(
                State,
                City.state_id
                == State.state_id,
            )
            .where(
                State.country_id
                == india.country_id,
                func.length(
                    City.postal_code
                ) == 6,
            )
        ).scalar_one()

        print()
        print(
            "========================================"
        )
        print(
            "PENNYWISE LARGE DATASET PREFLIGHT"
        )
        print(
            "========================================"
        )

        print()
        print(
            "LOCATION MASTER DATA"
        )
        print(
            "----------------------------------------"
        )

        print(
            f"Country: India "
            f"(ID {india.country_id})"
        )

        print(
            f"States / UT records: "
            f"{state_count:,}"
        )

        print(
            f"Location / PIN records: "
            f"{location_count:,}"
        )

        print(
            f"Valid 6-digit PIN records: "
            f"{valid_location_count:,}"
        )

        print()
        print(
            "CURRENT TRANSACTIONAL DATA"
        )
        print(
            "----------------------------------------"
        )

        table_counts = [
            (
                "Customers",
                Customer,
            ),
            (
                "Customer Addresses",
                CustomerAddress,
            ),
            (
                "Accounts",
                Account,
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
                "Loan Installments",
                LoanInstallment,
            ),
            (
                "Account Transactions",
                AccountTransaction,
            ),
        ]

        for label, model in table_counts:
            total = count_rows(
                db,
                model,
            )

            print(
                f"{label:<25} {total:>12,}"
            )

        print()
        print(
            "TARGET LARGE DATASET"
        )
        print(
            "----------------------------------------"
        )

        print(
            "Customers                 100,000"
        )

        print(
            "Savings Accounts           100,000"
        )

        print(
            "Loan Accounts              100,000"
        )

        print(
            "Total Accounts             200,000"
        )

        print(
            "Minimum Transactions     3,000,000"
        )

        print()
        print(
            "SAFETY CHECK"
        )
        print(
            "----------------------------------------"
        )

        if valid_location_count == 0:
            print(
                "[FAIL] No usable India PIN locations found."
            )
        else:
            print(
                "[OK] India location master data available."
            )

        print(
            "[OK] This script made no database changes."
        )

        print()
        print(
            "Preflight completed."
        )

    finally:
        db.close()


if __name__ == "__main__":
    run_preflight()