"""API routes for account transaction reports."""

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from io import BytesIO
from fastapi.responses import StreamingResponse

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models.admin import Admin
from app.schemas.report import AccountReportResponse, CustomerReportResponse
from app.services.report_service import generate_account_report, generate_customer_report, search_report_accounts
from app.schemas.transaction import TransactionAccountSearchResponse
from app.services.report_pdf_service import generate_account_report_pdf, generate_customer_report_pdf



router = APIRouter()

@router.get(
    "/accounts/search",
    response_model=list[TransactionAccountSearchResponse],
)
def search_report_accounts_route(
    search: str,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Search Savings and Loan accounts available for reporting."""

    return search_report_accounts(
        db=db,
        search=search,
    )


@router.get(
    "/accounts/{account_id}",
    response_model=AccountReportResponse,
)
def get_account_report(
    account_id: int,
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    transaction_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Return a filtered transaction report for one account."""

    return generate_account_report(
        db=db,
        account_id=account_id,
        start_date=start_date,
        end_date=end_date,
        transaction_type=transaction_type,
    )

@router.get(
    "/accounts/{account_id}/pdf",
)
def download_account_report_pdf(
    account_id: int,
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    transaction_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Generate and download a PDF report for one account."""

    report = generate_account_report(
        db=db,
        account_id=account_id,
        start_date=start_date,
        end_date=end_date,
        transaction_type=transaction_type,
    )

    customer_name = (
    f"{report['first_name']} "
    f"{report['last_name']}"
)

    pdf_bytes = generate_account_report_pdf(
        report=report,
        customer_name=customer_name,
    )

    filename = (
        f"account_report_"
        f"{account_id}_"
        f"{start_date.date()}_"
        f"{end_date.date()}.pdf"
    )

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="pennywise-bank-stmt/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            ),
        },
    )

@router.get(
    "/customers/{customer_id}",
    response_model=CustomerReportResponse,
)
def get_customer_report(
    customer_id: int,
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    transaction_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Return a combined report across all accounts owned by a customer."""

    return generate_customer_report(
        db=db,
        customer_id=customer_id,
        start_date=start_date,
        end_date=end_date,
        transaction_type=transaction_type,
    )

@router.get(
    "/customers/{customer_id}/pdf",
)
def download_customer_report_pdf(
    customer_id: int,
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    transaction_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Generate and download a combined customer report PDF."""

    report = generate_customer_report(
        db=db,
        customer_id=customer_id,
        start_date=start_date,
        end_date=end_date,
        transaction_type=transaction_type,
    )

    pdf_bytes = generate_customer_report_pdf(
        report=report,
    )

    filename = (
        f"customer_report_"
        f"{customer_id}_"
        f"{start_date.date()}_"
        f"{end_date.date()}.pdf"
    )

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="pennywise-bank-stmt/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            ),
        },
    )
