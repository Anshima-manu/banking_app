"""API routes for loan installment operations."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models.account import Account
from app.models.admin import Admin
from app.models.loan import LoanInstallment
from app.schemas.loan import LoanInstallmentResponse, LoanPaymentRequest
from app.services.loan_service import pay_loan_installment, update_overdue_installments


router = APIRouter()


@router.get(
    "/accounts/{account_id}/installments",
    response_model=list[LoanInstallmentResponse],
)
def get_loan_installments(
    account_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Return the repayment schedule for a Loan account."""

    account = db.get(
        Account,
        account_id,
    )

    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found.",
        )

    if account.account_type != "LOAN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Installments are available only for Loan accounts.",
        )

    update_overdue_installments(
        db=db,
        account_id=account_id,
    )

    installments = db.execute(
        select(LoanInstallment)
        .where(
            LoanInstallment.account_id == account_id
        )
        .order_by(
            LoanInstallment.installment_number.asc()
        )
    ).scalars().all()

    return list(installments)

@router.post(
    "/accounts/{account_id}/installments/{installment_id}/pay",
    response_model=LoanInstallmentResponse,
)
def pay_loan_installment_route(
    account_id: int,
    installment_id: int,
    request: LoanPaymentRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Process a payment against a Loan installment."""

    return pay_loan_installment(
        db=db,
        account_id=account_id,
        installment_id=installment_id,
        amount=request.amount,
        admin_id=current_admin.admin_id,
    )
