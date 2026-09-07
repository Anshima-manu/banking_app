"""PDF generation utilities for transaction reports."""

from datetime import datetime, timezone
from decimal import Decimal
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# -------------------------------------------------------------------------
# Theme
# -------------------------------------------------------------------------

PLUM = colors.HexColor("#581C87")
FUCHSIA = colors.HexColor("#C026D3")
ROSE = colors.HexColor("#F43F5E")

EMERALD = colors.HexColor("#059669")
AMBER = colors.HexColor("#D97706")

SLATE_950 = colors.HexColor("#020617")
SLATE_700 = colors.HexColor("#334155")
SLATE_500 = colors.HexColor("#64748B")
SLATE_300 = colors.HexColor("#CBD5E1")
SLATE_200 = colors.HexColor("#E2E8F0")
SLATE_100 = colors.HexColor("#F1F5F9")
SLATE_50 = colors.HexColor("#F8FAFC")

WHITE = colors.white


def _money(value) -> str:
    """Format a numeric value as currency text."""

    if value is None:
        value = Decimal("0.00")

    amount = Decimal(str(value))

    return f"INR {amount:,.2f}"


def _format_datetime(value) -> str:
    """Format transaction timestamp for a report."""

    if value is None:
        return ""

    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return value

    return value.strftime("%d %b %Y, %I:%M %p")


def _format_date(value) -> str:
    """Format report date."""

    if value is None:
        return ""

    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value).date()
        except ValueError:
            return value

    return value.strftime("%d %b %Y")

def _create_styles():
    """Create PDF paragraph styles."""

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=26,
        textColor=SLATE_950,
        spaceAfter=4,
    )

    brand_style = ParagraphStyle(
        "Brand",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=12,
        textColor=FUCHSIA,
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontSize=9,
        leading=13,
        textColor=SLATE_500,
    )

    section_style = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=SLATE_950,
        spaceBefore=4,
        spaceAfter=8,
    )

    label_style = ParagraphStyle(
        "Label",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7,
        leading=9,
        textColor=SLATE_500,
    )

    value_style = ParagraphStyle(
        "Value",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=SLATE_950,
    )

    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=8,
        leading=11,
        textColor=SLATE_700,
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7,
        leading=9,
        textColor=WHITE,
    )

    table_body_style = ParagraphStyle(
        "TableBody",
        parent=styles["Normal"],
        fontSize=7,
        leading=9,
        textColor=SLATE_700,
    )

    amount_right_style = ParagraphStyle(
        "AmountRight",
        parent=table_body_style,
        alignment=TA_LEFT,
    )

    center_style = ParagraphStyle(
        "Center",
        parent=table_body_style,
        alignment=TA_CENTER,
    )

    return {
        "title": title_style,
        "brand": brand_style,
        "subtitle": subtitle_style,
        "section": section_style,
        "label": label_style,
        "value": value_style,
        "body": body_style,
        "table_header": table_header_style,
        "table_body": table_body_style,
        "amount_right": amount_right_style,
        "center": center_style,
    }


def _summary_card(
    label,
    value,
    styles,
    background=SLATE_50,
    value_color=SLATE_950,
):
    """Return one summary-card cell."""

    value_style = ParagraphStyle(
        f"SummaryValue-{label}",
        parent=styles["value"],
        fontSize=11,
        textColor=value_color,
    )

    content = [
        Paragraph(
            str(label).upper(),
            styles["label"],
        ),
        Spacer(
            1,
            3,
        ),
        Paragraph(
            str(value),
            value_style,
        ),
    ]

    table = Table(
        [[content]],
        colWidths=[44 * mm],
    )

    table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    background,
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    SLATE_200,
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
            ]
        )
    )

    return table


def _page_footer(
    canvas,
    document,
):
    """Draw report footer and page number."""

    canvas.saveState()

    page_width, _ = landscape(A4)

    canvas.setStrokeColor(SLATE_200)

    canvas.line(
        15 * mm,
        10 * mm,
        page_width - 15 * mm,
        10 * mm,
    )

    canvas.setFont(
        "Helvetica",
        7,
    )

    canvas.setFillColor(SLATE_500)

    canvas.drawString(
        15 * mm,
        6 * mm,
        "Pennywise - Confidential Banking Report",
    )

    canvas.drawRightString(
        page_width - 15 * mm,
        6 * mm,
        f"Page {document.page}",
    )

    canvas.restoreState()


def _build_header(
    story,
    styles,
    title,
    subtitle,
):
    """Add common Pennywise report header."""

    story.append(
        Paragraph(
            "PENNYWISE",
            styles["brand"],
        )
    )

    story.append(
        Paragraph(
            title,
            styles["title"],
        )
    )

    story.append(
        Paragraph(
            subtitle,
            styles["subtitle"],
        )
    )

    story.append(
        Spacer(
            1,
            7 * mm,
        )
    )


def _build_customer_info(
    story,
    report,
    styles,
):
    """Add customer information block."""

    customer_name = f"{report['first_name']} " f"{report['last_name']}"

    rows = [
        [
            Paragraph(
                "CUSTOMER",
                styles["label"],
            ),
            Paragraph(
                "EMAIL",
                styles["label"],
            ),
            Paragraph(
                "MOBILE",
                styles["label"],
            ),
        ],
        [
            Paragraph(
                customer_name,
                styles["value"],
            ),
            Paragraph(
                str(report["email"]),
                styles["body"],
            ),
            Paragraph(
                str(report["mobile"]),
                styles["body"],
            ),
        ],
    ]

    table = Table(
        rows,
        colWidths=[
            80 * mm,
            95 * mm,
            70 * mm,
        ],
    )

    table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    SLATE_50,
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    SLATE_200,
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "LINEBELOW",
                    (0,0),
                    (-1,0),
                    0.5,
                    SLATE_200,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
            ]
        )
    )

    story.append(table)

    story.append(
        Spacer(
            1,
            5 * mm,
        )
    )


def _build_report_metadata(
    story,
    styles,
    start_date,
    end_date,
    scope_text,
):
    """Add scope and reporting period metadata."""

    generated_at = datetime.now(timezone.utc)

    rows = [
        [
            Paragraph(
                "REPORT SCOPE",
                styles["label"],
            ),
            Paragraph(
                "REPORTING PERIOD",
                styles["label"],
            ),
            Paragraph(
                "GENERATED",
                styles["label"],
            ),
        ],
        [
            Paragraph(
                scope_text,
                styles["body"],
            ),
            Paragraph(
                (f"{_format_date(start_date)} " f"to {_format_date(end_date)}"),
                styles["body"],
            ),
            Paragraph(
                generated_at.strftime("%d %b %Y, %H:%M UTC"),
                styles["body"],
            ),
        ],
    ]

    table = Table(
        rows,
        colWidths=[
            80 * mm,
            95 * mm,
            70 * mm,
        ],
    )

    table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    colors.HexColor("#FAF5FF"),
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor("#F5D0FE"),
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "LINEBELOW",
                    (0,0),
                    (-1,0),
                    0.5,
                    SLATE_200,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
            ]
        )
    )

    story.append(table)

    story.append(
        Spacer(
            1,
            7 * mm,
        )
    )


def _build_account_transaction_table(
    story,
    transactions,
    styles,
):
    """Build transaction table for one account."""

    story.append(
        Paragraph(
            "Transaction Statement",
            styles["section"],
        )
    )

    if not transactions:
        story.append(
            Paragraph(
                "No transactions were found for the selected reporting period.",
                styles["body"],
            )
        )

        return

    header = [
        Paragraph(
            "Date & Time",
            styles["table_header"],
        ),
        Paragraph(
            "Reference / Description",
            styles["table_header"],
        ),
        Paragraph(
            "Transaction Type",
            styles["table_header"],
        ),
        Paragraph(
            "Amount",
            styles["table_header"],
        ),
        Paragraph(
            "Balance",
            styles["table_header"],
        ),
    ]

    data = [header]

    for transaction in transactions:
        transaction_type = str(transaction.transaction_type)

        description = transaction.description or "No description"

        reference = str(transaction.reference_number)

        amount = _money(transaction.amount)

        if transaction_type in (
            "DEPOSIT",
            "INTEREST_CREDIT",
        ):
            amount = f"+{amount}"

        elif transaction_type in (
            "WITHDRAWAL",
            "LOAN_REPAYMENT",
        ):
            amount = f"-{amount}"

        data.append(
            [
                Paragraph(
                    _format_datetime(transaction.transaction_time),
                    styles["table_body"],
                ),
                Paragraph(
                    (f"<b>{reference}</b>" f"<br/>{description}"),
                    styles["table_body"],
                ),
                Paragraph(
                    transaction_type.replace(
                        "_",
                        " ",
                    ),
                    styles["table_body"],
                ),
                
                Paragraph(
                    amount,
                    styles["amount_right"],
                ),
                Paragraph(
                    _money(transaction.balance_after),
                    styles["amount_right"],
                ),
            ]
        )

    table = Table(
        data,
        repeatRows=1,
        colWidths=[
            42 * mm,
            45 * mm,
            43 * mm,
            78 * mm,
            28 * mm,
        ],
    )

    table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    PLUM,
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.35,
                    SLATE_200,
                ),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [
                        WHITE,
                        SLATE_50,
                    ],
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
            ]
        )
    )

    story.append(table)


def _build_customer_transaction_table(
    story,
    transactions,
    styles,
):
    """Build combined transaction table for all customer accounts."""

    story.append(
        Paragraph(
            "Combined Transaction Statement",
            styles["section"],
        )
    )

    if not transactions:
        story.append(
            Paragraph(
                "No transactions were found for the selected reporting period.",
                styles["body"],
            )
        )

        return

    header = [
        Paragraph(
            "Date & Time",
            styles["table_header"],
        ),
        Paragraph(
            "Account",
            styles["table_header"],
        ),
        Paragraph(
            "Reference / Description",
            styles["table_header"],
        ),
        Paragraph(
            "Transaction Type",
            styles["table_header"],
        ),
        Paragraph(
            "Amount",
            styles["table_header"],
        ),
    ]

    data = [header]

    for transaction in transactions:
        transaction_type = str(transaction["transaction_type"])

        account_text = (
            f"{transaction['account_type']}"
            f"<br/>"
            f"{transaction['account_number']}"
        )

        description = transaction.get("description") or "No description"

        reference = str(transaction["reference_number"])

        amount = _money(transaction["amount"])

        if transaction_type in (
            "DEPOSIT",
            "INTEREST_CREDIT",
        ):
            amount = f"+{amount}"

        elif transaction_type in (
            "WITHDRAWAL",
            "LOAN_REPAYMENT",
        ):
            amount = f"-{amount}"

        data.append(
            [
                Paragraph(
                    _format_datetime(transaction["transaction_time"]),
                    styles["table_body"],
                ),
                Paragraph(
                    account_text,
                    styles["table_body"],
                ),
                Paragraph(
                    (f"<b>{reference}</b>" f"<br/>{description}"),
                    styles["table_body"],
                ),
                Paragraph(
                    transaction_type.replace(
                        "_",
                        " ",
                    ),
                    styles["table_body"],
                ),
                Paragraph(
                    amount,
                    styles["amount_right"],
                ),
            ]
        )

    table = Table(
        data,
        repeatRows=1,
        colWidths=[
            42 * mm,
            45 * mm,
            43 * mm,
            82 * mm,
            32 * mm,
        ],
    )

    table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    PLUM,
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.35,
                    SLATE_200,
                ),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [
                        WHITE,
                        SLATE_50,
                    ],
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
            ]
        )
    )

    story.append(table)


def generate_account_report_pdf(
    report: dict,
    customer_name: str | None = None,
) -> bytes:
    """Generate a PDF for one specific account report."""

    buffer = BytesIO()

    styles = _create_styles()

    document = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        title="Pennywise Account Transaction Report",
        author="Pennywise",
    )

    story = []

    _build_header(
        story=story,
        styles=styles,
        title="Account Transaction Report",
        subtitle=("Transaction activity for the selected Pennywise account."),
    )

    account_number = report["account_number"]

    scope_text = f"{report['account_type']} " f"{account_number}"

    information_rows = [
        [
            Paragraph(
                "ACCOUNT",
                styles["label"],
            ),
            Paragraph(
                "ACCOUNT TYPE",
                styles["label"],
            ),
            Paragraph(
                "CUSTOMER",
                styles["label"],
            ),
        ],
        [
            Paragraph(
                account_number,
                styles["value"],
            ),
            Paragraph(
                str(report["account_type"]),
                styles["value"],
            ),
            Paragraph(
                customer_name or "Pennywise Customer",
                styles["body"],
            ),
        ],
    ]

    information_table = Table(
        information_rows,
        colWidths=[
            80 * mm,
            70 * mm,
            95 * mm,
        ],
    )

    information_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    SLATE_50,
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    SLATE_200,
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "LINEBELOW",
                    (0,0),
                    (-1,0),
                    0.5,
                    SLATE_200,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
            ]
        )
    )

    story.append(information_table)

    story.append(
        Spacer(
            1,
            5 * mm,
        )
    )

    _build_report_metadata(
        story=story,
        styles=styles,
        start_date=report["start_date"],
        end_date=report["end_date"],
        scope_text=scope_text,
    )

    story.append(
        Paragraph(
            "Report Summary",
            styles["section"],
        )
    )

    summary = Table(
        [
            [
                _summary_card(
                    "Opening Balance",
                    _money(report["opening_balance"]),
                    styles,
                ),
                _summary_card(
                    "Closing Balance",
                    _money(report["closing_balance"]),
                    styles,
                ),
                _summary_card(
                    "Deposits",
                    _money(report["total_deposits"]),
                    styles,
                    background=colors.HexColor("#ECFDF5"),
                    value_color=EMERALD,
                ),
            ],
            [
                _summary_card(
                    "Withdrawals",
                    _money(report["total_withdrawals"]),
                    styles,
                    background=colors.HexColor("#FFF1F2"),
                    value_color=ROSE,
                ),
                _summary_card(
                    "Loan Repayments",
                    _money(report["total_loan_repayments"]),
                    styles,
                    background=colors.HexColor("#FAF5FF"),
                    value_color=PLUM,
                ),
                _summary_card(
                    "Transactions",
                    report["transaction_count"],
                    styles,
                    background=colors.HexColor("#FFFBEB"),
                    value_color=AMBER,
                ),
            ],
        ],
        colWidths=[
            82 * mm,
            82 * mm,
            82 * mm,
        ],
    )

    summary.setStyle(
        TableStyle(
            [
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    2,
                ),
                
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    2,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    2,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    2,
                ),
            ]
        )
    )

    story.append(summary)

    story.append(
        Spacer(
            1,
            7 * mm,
        )
    )

    _build_account_transaction_table(
        story=story,
        transactions=report["transactions"],
        styles=styles,
    )

    document.build(
        story,
        onFirstPage=_page_footer,
        onLaterPages=_page_footer,
    )

    pdf_bytes = buffer.getvalue()

    buffer.close()

    return pdf_bytes


def generate_customer_report_pdf(
    report: dict,
) -> bytes:
    """Generate a combined customer transaction report PDF."""

    buffer = BytesIO()

    styles = _create_styles()

    document = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        title="Pennywise Combined Customer Transaction Report",
        author="Pennywise",
    )

    story = []

    _build_header(
        story=story,
        styles=styles,
        title="Combined Transaction Report",
        subtitle=("Transaction activity across all linked customer accounts."),
    )

    _build_customer_info(
        story=story,
        report=report,
        styles=styles,
    )

    scope_text = f"All Accounts " f"({report['account_count']} linked)"

    _build_report_metadata(
        story=story,
        styles=styles,
        start_date=report["start_date"],
        end_date=report["end_date"],
        scope_text=scope_text,
    )

    story.append(
        Paragraph(
            "Report Summary",
            styles["section"],
        )
    )

    summary = Table(
        [
            [
                _summary_card(
                    "Total Deposits",
                    _money(report["total_deposits"]),
                    styles,
                    background=colors.HexColor("#ECFDF5"),
                    value_color=EMERALD,
                ),
                _summary_card(
                    "Total Withdrawals",
                    _money(report["total_withdrawals"]),
                    styles,
                    background=colors.HexColor("#FFF1F2"),
                    value_color=ROSE,
                ),
                _summary_card(
                    "Loan Repayments",
                    _money(report["total_loan_repayments"]),
                    styles,
                    background=colors.HexColor("#FAF5FF"),
                    value_color=PLUM,
                ),
                _summary_card(
                    "Transactions",
                    report["transaction_count"],
                    styles,
                    background=colors.HexColor("#FFFBEB"),
                    value_color=AMBER,
                ),
            ]
        ],
        colWidths=[
            61 * mm,
            61 * mm,
            61 * mm,
            61 * mm,
        ],
    )

    summary.setStyle(
        TableStyle(
            [
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    2,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    2,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    2,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    2,
                ),
            ]
        )
    )

    story.append(summary)

    story.append(
        Spacer(
            1,
            7 * mm,
        )
    )

    _build_customer_transaction_table(
        story=story,
        transactions=report["transactions"],
        styles=styles,
    )

    document.build(
        story,
        onFirstPage=_page_footer,
        onLaterPages=_page_footer,
    )

    pdf_bytes = buffer.getvalue()

    buffer.close()

    return pdf_bytes
