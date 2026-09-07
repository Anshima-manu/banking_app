"""Validate synthetic Pennywise seed data for consistency."""

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
from app.models.transaction import AccountTransaction


def print_result(
    label,
    passed,
    detail="",
):
    """Print one validation result."""

    status = "[OK]" if passed else "[FAIL]"

    print(
        f"{status:<7} {label}"
        + (
            f" - {detail}"
            if detail
            else ""
        )
    )


def validate_dataset():
    """Run consistency checks against Pennywise synthetic records."""

    db = SessionLocal()

    failures = 0

    try:
        print()
        print(
            "========================================"
        )
        print(
            "PENNYWISE SYNTHETIC DATA VALIDATION"
        )
        print(
            "========================================"
        )
        print()

        synthetic_customer_ids = list(
            db.execute(
                select(
                    Customer.customer_id
                ).order_by(
                    Customer.customer_id.asc()
                )
            ).scalars().all()
        )

        customer_count = len(
            synthetic_customer_ids
        )

        passed = customer_count > 0

        print_result(
            "Customers exist",
            passed,
            f"{customer_count:,} customers",
        )

        if not passed:
            return

        # -----------------------------------------------------
        # Address validation
        # -----------------------------------------------------

        customers_without_address = (
            db.execute(
                select(
                    func.count(
                        Customer.customer_id
                    )
                )
                .where(
                    Customer.customer_id.in_(
                        synthetic_customer_ids
                    )
                )
                .where(
                    ~Customer.customer_id.in_(
                        select(
                            CustomerAddress.customer_id
                        )
                    )
                )
            ).scalar_one()
        )

        passed = (
            customers_without_address == 0
        )

        print_result(
            "Every customer has an address",
            passed,
            (
                f"{customers_without_address:,} "
                "missing"
            ),
        )

        if not passed:
            failures += 1

        # -----------------------------------------------------
        # Exactly two accounts per customer
        # -----------------------------------------------------

        invalid_account_counts = list(
            db.execute(
                select(
                    Account.customer_id,
                    func.count(
                        Account.account_id
                    ).label(
                        "account_count"
                    ),
                )
                .where(
                    Account.customer_id.in_(
                        synthetic_customer_ids
                    )
                )
                .group_by(
                    Account.customer_id
                )
                .having(
                    func.count(
                        Account.account_id
                    ) != 2
                )
            ).all()
        )

        passed = (
            len(
                invalid_account_counts
            )
            == 0
        )

        print_result(
            "Exactly two accounts per customer",
            passed,
            (
                f"{len(invalid_account_counts):,} "
                "invalid customers"
            ),
        )

        if not passed:
            failures += 1

        # -----------------------------------------------------
        # One Savings + one Loan
        # -----------------------------------------------------

        account_type_rows = list(
            db.execute(
                select(
                    Account.customer_id,
                    Account.account_type,
                    func.count(
                        Account.account_id
                    ),
                )
                .where(
                    Account.customer_id.in_(
                        synthetic_customer_ids
                    )
                )
                .group_by(
                    Account.customer_id,
                    Account.account_type,
                )
            ).all()
        )

        account_type_counts = {}

        for (
            customer_id,
            account_type,
            count,
        ) in account_type_rows:
            account_type_counts.setdefault(
                customer_id,
                {},
            )[account_type] = count

        invalid_account_types = []

        for customer_id in synthetic_customer_ids:
            counts = account_type_counts.get(
                customer_id,
                {},
            )

            if (
                counts.get(
                    "SAVINGS",
                    0,
                )
                != 1
                or counts.get(
                    "LOAN",
                    0,
                )
                != 1
            ):
                invalid_account_types.append(
                    customer_id
                )

        passed = (
            len(
                invalid_account_types
            )
            == 0
        )

        print_result(
            "One Savings and one Loan per customer",
            passed,
            (
                f"{len(invalid_account_types):,} "
                "invalid customers"
            ),
        )

        if not passed:
            failures += 1

        # -----------------------------------------------------
        # Profile validation
        # -----------------------------------------------------

        seeded_account_ids = list(
            db.execute(
                select(
                    Account.account_id
                ).where(
                    Account.customer_id.in_(
                        synthetic_customer_ids
                    )
                )
            ).scalars().all()
        )

        savings_account_ids = list(
            db.execute(
                select(
                    Account.account_id
                ).where(
                    Account.customer_id.in_(
                        synthetic_customer_ids
                    ),
                    Account.account_type
                    == "SAVINGS",
                )
            ).scalars().all()
        )

        loan_account_ids = list(
            db.execute(
                select(
                    Account.account_id
                ).where(
                    Account.customer_id.in_(
                        synthetic_customer_ids
                    ),
                    Account.account_type
                    == "LOAN",
                )
            ).scalars().all()
        )

        savings_profile_count = (
            db.execute(
                select(
                    func.count(
                        SavingsProfile.account_id
                    )
                ).where(
                    SavingsProfile.account_id.in_(
                        savings_account_ids
                    )
                )
            ).scalar_one()
        )

        passed = (
            savings_profile_count
            == len(
                savings_account_ids
            )
        )

        print_result(
            "Every Savings account has a profile",
            passed,
            (
                f"{savings_profile_count:,}/"
                f"{len(savings_account_ids):,}"
            ),
        )

        if not passed:
            failures += 1

        loan_profile_count = (
            db.execute(
                select(
                    func.count(
                        LoanProfile.account_id
                    )
                ).where(
                    LoanProfile.account_id.in_(
                        loan_account_ids
                    )
                )
            ).scalar_one()
        )

        passed = (
            loan_profile_count
            == len(
                loan_account_ids
            )
        )

        print_result(
            "Every Loan account has a profile",
            passed,
            (
                f"{loan_profile_count:,}/"
                f"{len(loan_account_ids):,}"
            ),
        )

        if not passed:
            failures += 1

        # -----------------------------------------------------
        # Transaction count per customer
        # -----------------------------------------------------

        transaction_counts = dict(
            db.execute(
                select(
                    Account.customer_id,
                    func.count(
                        AccountTransaction.transaction_id
                    ),
                )
                .join(
                    AccountTransaction,
                    AccountTransaction.account_id
                    == Account.account_id,
                )
                .where(
                    Account.customer_id.in_(
                        synthetic_customer_ids
                    )
                )
                .group_by(
                    Account.customer_id
                )
            ).all()
        )

        customers_below_30 = [
            customer_id
            for customer_id
            in synthetic_customer_ids
            if transaction_counts.get(
                customer_id,
                0,
            )
            < 30
        ]

        passed = (
            len(
                customers_below_30
            )
            == 0
        )

        print_result(
            "At least 30 transactions per customer",
            passed,
            (
                f"{len(customers_below_30):,} "
                "customers below requirement"
            ),
        )

        if not passed:
            failures += 1

        total_transactions = (
            db.execute(
                select(
                    func.count(
                        AccountTransaction.transaction_id
                    )
                ).where(
                    AccountTransaction.account_id.in_(
                        seeded_account_ids
                    )
                )
            ).scalar_one()
        )

        print_result(
            "Transaction count",
            True,
            f"{total_transactions:,} transactions",
        )

        # -----------------------------------------------------
        # Savings balance arithmetic
        # -----------------------------------------------------

        bad_savings_transactions = 0

        savings_transactions = (
            db.execute(
                select(
                    AccountTransaction
                )
                .where(
                    AccountTransaction.account_id.in_(
                        savings_account_ids
                    )
                )
            ).scalars()
        )

        for transaction in savings_transactions:
            if (
                transaction.transaction_type
                == "DEPOSIT"
            ):
                expected_balance = (
                    transaction.balance_before
                    + transaction.amount
                )

            elif (
                transaction.transaction_type
                == "WITHDRAWAL"
            ):
                expected_balance = (
                    transaction.balance_before
                    - transaction.amount
                )

            else:
                continue

            if (
                expected_balance
                != transaction.balance_after
            ):
                bad_savings_transactions += 1

        passed = (
            bad_savings_transactions == 0
        )

        print_result(
            "Savings transaction arithmetic",
            passed,
            (
                f"{bad_savings_transactions:,} "
                "invalid transactions"
            ),
        )

        if not passed:
            failures += 1

        # -----------------------------------------------------
        # Savings final balance
        # -----------------------------------------------------

        latest_transaction_ids = (
            select(
                AccountTransaction.account_id,
                func.max(
                    AccountTransaction.transaction_id
                ).label(
                    "latest_transaction_id"
                ),
            )
            .where(
                AccountTransaction.account_id.in_(
                    savings_account_ids
                )
            )
            .group_by(
                AccountTransaction.account_id
            )
            .subquery()
        )


        bad_savings_balances = db.execute(
            select(
                func.count(
                    Account.account_id
                )
            )
            .join(
                latest_transaction_ids,
                latest_transaction_ids.c.account_id
                == Account.account_id,
            )
            .join(
                AccountTransaction,
                AccountTransaction.transaction_id
                == latest_transaction_ids.c.latest_transaction_id,
            )
            .where(
                Account.current_balance
                != AccountTransaction.balance_after
            )
        ).scalar_one()


        passed = (
            bad_savings_balances
            == 0
        )

        print_result(
            "Savings current balances",
            passed,
            (
                f"{bad_savings_balances:,} "
                "incorrect balances"
            ),
        )

        if not passed:
            failures += 1

        # -----------------------------------------------------
        # Loan installment principal totals
        # -----------------------------------------------------

        loan_principal_rows = db.execute(
            select(
                LoanProfile.account_id,
                LoanProfile.principal_amount,
                func.coalesce(
                    func.sum(
                        LoanInstallment.principal_due
                    ),
                    0,
                ).label(
                    "scheduled_principal"
                ),
            )
            .outerjoin(
                LoanInstallment,
                LoanInstallment.account_id
                == LoanProfile.account_id,
            )
            .where(
                LoanProfile.account_id.in_(
                    loan_account_ids
                )
            )
            .group_by(
                LoanProfile.account_id,
                LoanProfile.principal_amount,
            )
        ).all()


        bad_loan_principal_totals = 0

        for row in loan_principal_rows:
            difference = abs(
                row.principal_amount
                - row.scheduled_principal
            )

            if difference > 0.01:
                bad_loan_principal_totals += 1


        passed = (
            bad_loan_principal_totals
            == 0
        )

        print_result(
            "Loan installment principal totals",
            passed,
            (
                f"{bad_loan_principal_totals:,} "
                "invalid Loans"
            ),
        )

        if not passed:
            failures += 1

        # -----------------------------------------------------
        # Loan outstanding principal validation
        # -----------------------------------------------------

        paid_principal_expression = (
            func.coalesce(
                func.sum(
                    func.if_(
                        LoanInstallment.installment_status
                        == "PAID",
                        LoanInstallment.principal_due,
                        0,
                    )
                ),
                0,
            )
        )


        loan_outstanding_rows = db.execute(
            select(
                LoanProfile.account_id,
                LoanProfile.principal_amount,
                LoanProfile.outstanding_principal,
                paid_principal_expression.label(
                    "paid_principal"
                ),
            )
            .outerjoin(
                LoanInstallment,
                LoanInstallment.account_id
                == LoanProfile.account_id,
            )
            .where(
                LoanProfile.account_id.in_(
                    loan_account_ids
                )
            )
            .group_by(
                LoanProfile.account_id,
                LoanProfile.principal_amount,
                LoanProfile.outstanding_principal,
            )
        ).all()


        bad_outstanding_principal = 0

        for row in loan_outstanding_rows:
            expected_outstanding = (
                row.principal_amount
                - row.paid_principal
            )

            difference = abs(
                expected_outstanding
                - row.outstanding_principal
            )

            if difference > 0.01:
                bad_outstanding_principal += 1


        passed = (
            bad_outstanding_principal
            == 0
        )

        print_result(
            "Loan outstanding principal",
            passed,
            (
                f"{bad_outstanding_principal:,} "
                "invalid Loans"
            ),
        )

        if not passed:
            failures += 1

        '''Transaction orphan validation'''

        orphan_transactions = (
            db.execute(
                select(
                    func.count(
                        AccountTransaction.transaction_id
                    )
                )
                .outerjoin(
                    Account,
                    AccountTransaction.account_id
                    == Account.account_id,
                )
                .where(
                    Account.account_id.is_(
                        None
                    )
                )
            ).scalar_one()
        )

        passed = (
            orphan_transactions == 0
        )

        print_result(
            "No orphan transactions",
            passed,
            (
                f"{orphan_transactions:,} "
                "orphans"
            ),
        )

        if not passed:
            failures += 1

        print()
        print(
            "========================================"
        )

        if failures == 0:
            print(
                "VALIDATION PASSED"
            )
            print(
                "Synthetic dataset is internally consistent."
            )
        else:
            print(
                "VALIDATION FAILED"
            )
            print(
                f"{failures} validation check(s) failed."
            )

        print(
            "========================================"
        )
        print()

    finally:
        db.close()


if __name__ == "__main__":
    validate_dataset()