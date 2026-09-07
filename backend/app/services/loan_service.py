"""Business logic for loan installment and repayment operations."""

from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import AccountStatus, AccountType, InstallmentStatus, TransactionType
from app.models.account import Account, LoanProfile
from app.models.loan import LoanInstallment
from app.models.transaction import AccountTransaction


def add_months(
    source_date: date,
    months: int,
) -> date:
    """Return a date moved forward by the requested number of months."""

    month_index = source_date.month - 1 + months

    year = (
        source_date.year
        + month_index // 12
    )

    month = month_index % 12 + 1

    days_in_month = [
        31,
        29 if (
            year % 400 == 0
            or (
                year % 4 == 0
                and year % 100 != 0
            )
        ) else 28,
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31,
    ]

    day = min(
        source_date.day,
        days_in_month[month - 1],
    )

    return date(
        year,
        month,
        day,
    )


def calculate_emi(
    principal: Decimal,
    annual_interest_rate: Decimal,
    tenure_months: int,
) -> Decimal:
    """Calculate the fixed monthly EMI for a loan."""

    if tenure_months <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Loan tenure must be greater than zero.",
        )

    if annual_interest_rate == 0:
        emi = principal / Decimal(tenure_months)

        return emi.quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

    monthly_rate = (
        annual_interest_rate
        / Decimal("1200")
    )

    factor = (
        Decimal("1") + monthly_rate
    ) ** tenure_months

    emi = (
        principal
        * monthly_rate
        * factor
        / (factor - Decimal("1"))
    )

    return emi.quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )


def generate_installment_schedule(
    db: Session,
    account_id: int,
) -> list:
    """Generate the repayment schedule for a Loan account."""

    account = db.get(
        Account,
        account_id,
    )

    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found.",
        )

    if account.account_type != AccountType.LOAN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Installments can only be generated for Loan accounts.",
        )

    loan_profile = db.get(
        LoanProfile,
        account_id,
    )

    if loan_profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan profile not found.",
        )

    existing_installment = db.execute(
        select(LoanInstallment).where(
            LoanInstallment.account_id == account_id
        )
    ).first()

    if existing_installment is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Loan installment schedule already exists.",
        )

    principal = loan_profile.principal_amount
    annual_rate = loan_profile.interest_rate
    tenure_months = loan_profile.tenure_months

    emi = calculate_emi(
        principal=principal,
        annual_interest_rate=annual_rate,
        tenure_months=tenure_months,
    )

    monthly_rate = (
        annual_rate / Decimal("1200")
    )

    outstanding_balance = principal

    installments = []

    for installment_number in range(
        1,
        tenure_months + 1,
    ):
        due_date = add_months(
            loan_profile.repayment_start_date,
            installment_number - 1,
        )

        interest_due = (
            outstanding_balance * monthly_rate
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

        principal_due = (
            emi - interest_due
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

        if installment_number == tenure_months:
            principal_due = outstanding_balance

            amount_due = (
                principal_due + interest_due
            ).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP,
            )
        else:
            amount_due = emi

        installment = LoanInstallment(
            account_id=account_id,
            installment_number=installment_number,
            due_date=due_date,
            amount_due=amount_due,
            principal_due=principal_due,
            interest_due=interest_due,
            amount_paid=Decimal("0.00"),
            installment_status=(
                InstallmentStatus.PENDING.value
            ),
            paid_at=None,
        )

        db.add(installment)
        installments.append(installment)

        outstanding_balance = (
            outstanding_balance - principal_due
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

    db.flush()

    return installments

def pay_loan_installment(
    db: Session,
    account_id: int,
    installment_id: int,
    amount: Decimal,
    admin_id: int,
) -> LoanInstallment:
    """Process a payment against a Loan installment."""

    if amount <= Decimal("0.00"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount must be greater than zero.",
        )

    try:
        account = db.execute(
            select(Account)
            .where(
                Account.account_id == account_id
            )
            .with_for_update()
        ).scalar_one_or_none()

        if account is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found.",
            )

        if account.account_type != AccountType.LOAN.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Repayment is allowed only for Loan accounts.",
            )

        if account.account_status != AccountStatus.ACTIVE.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The Loan account is not active.",
            )

        loan_profile = db.execute(
            select(LoanProfile)
            .where(
                LoanProfile.account_id == account_id
            )
            .with_for_update()
        ).scalar_one_or_none()

        if loan_profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Loan profile not found.",
            )

        installment = db.execute(
            select(LoanInstallment)
            .where(
                LoanInstallment.installment_id == installment_id,
                LoanInstallment.account_id == account_id,
            )
            .with_for_update()
        ).scalar_one_or_none()

        if installment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Loan installment not found.",
            )

        if installment.installment_status == InstallmentStatus.PAID.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This installment is already fully paid.",
            )

        earlier_unpaid_installment = db.execute(
            select(LoanInstallment).where(
                LoanInstallment.account_id == account_id,
                LoanInstallment.installment_number
                < installment.installment_number,
                LoanInstallment.installment_status
                != InstallmentStatus.PAID.value,
            )
        ).scalars().first()

        if earlier_unpaid_installment is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Earlier loan installments must be fully paid "
                    "before paying this installment."
                ),
            )

        remaining_amount = (
            installment.amount_due
            - installment.amount_paid
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

        if amount > remaining_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment exceeds the remaining installment amount.",
            )

        amount_paid_before = installment.amount_paid

        amount_paid_after = (
            amount_paid_before + amount
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

        principal_already_paid = Decimal("0.00")

        if installment.amount_due > Decimal("0.00"):
            payment_ratio_before = (
                amount_paid_before
                / installment.amount_due
            )

            principal_already_paid = (
                installment.principal_due
                * payment_ratio_before
            ).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP,
            )

        payment_ratio_after = (
            amount_paid_after
            / installment.amount_due
        )

        principal_paid_after = (
            installment.principal_due
            * payment_ratio_after
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

        principal_component = (
            principal_paid_after
            - principal_already_paid
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

        if amount_paid_after == installment.amount_due:
            principal_component = (
                installment.principal_due
                - principal_already_paid
            ).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP,
            )

        was_overdue = (
            installment.installment_status == InstallmentStatus.OVERDUE.value
        )

        installment.amount_paid = amount_paid_after

        if amount_paid_after == installment.amount_due:
            installment.installment_status = (
                InstallmentStatus.PAID.value
            )

            installment.paid_at = datetime.now(timezone.utc)

        elif was_overdue:
            installment.installment_status = (
                InstallmentStatus.OVERDUE.value
            )

        else:
            installment.installment_status = (
                InstallmentStatus.PARTIAL.value
            )

            installment.paid_at = None

        new_outstanding_principal = (
            loan_profile.outstanding_principal
            - principal_component
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

        if new_outstanding_principal < Decimal("0.00"):
            new_outstanding_principal = Decimal("0.00")

        loan_profile.outstanding_principal = (
            new_outstanding_principal
        ) 

        if (loan_profile.outstanding_principal== Decimal("0.00")):
            remaining_unpaid_installment = db.execute(
                select(LoanInstallment).where(
                    LoanInstallment.account_id == account_id,
                    LoanInstallment.installment_status
                    != InstallmentStatus.PAID.value,
                    LoanInstallment.installment_id
                    != installment.installment_id,
                )
            ).scalars().first()

            if remaining_unpaid_installment is None:
                loan_profile.outstanding_principal = Decimal("0.00")

        transaction = AccountTransaction(
            account_id=account_id,
            performed_by=admin_id,
            transaction_type=TransactionType.LOAN_REPAYMENT.value,
            amount=amount,
            balance_before=(
                account.current_balance
            ),
            balance_after=(
                account.current_balance
            ),
            reference_number=(
                f"TXN-{uuid4().hex[:16].upper()}"
            ),
            description=(
                f"Loan installment "
                f"{installment.installment_number} repayment"
            ),
        )

        db.add(transaction)

        db.commit()
        db.refresh(installment)

        return installment

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise

def update_overdue_installments(
    db: Session,
    account_id: int,
) -> None:
    """Mark past-due unpaid Loan installments as overdue."""

    today = date.today()

    installments = db.execute(
        select(LoanInstallment).where(
            LoanInstallment.account_id == account_id,
            LoanInstallment.due_date < today,
            LoanInstallment.installment_status.in_(
                [
                    InstallmentStatus.PENDING.value,
                    InstallmentStatus.PARTIAL.value,
                ]
            ),
        )
    ).scalars().all()

    for installment in installments:
        installment.installment_status = (
            InstallmentStatus.OVERDUE.value
        )

    if installments:
        db.commit()