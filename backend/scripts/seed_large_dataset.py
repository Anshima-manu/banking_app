"""Generate deterministic synthetic data for Pennywise.

Default validation dataset:
    100 customers
    1 address per customer
    1 Savings account per customer
    1 Loan account per customer
    30 transactions per customer

The script DOES NOT delete existing data.
"""

import argparse
import random
import sys

from datetime import (
    date,
    datetime,
    time,
    timedelta,
    timezone,
)
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

from sqlalchemy import (
    func,
    insert,
    select,
)


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
from app.models.admin import Admin
from app.models.customer import (
    Customer,
    CustomerAddress,
)
from app.models.loan import LoanInstallment
from app.models.location import City
from app.models.transaction import AccountTransaction
from app.services.loan_service import (
    add_months,
    calculate_emi,
)


TWOPLACES = Decimal("0.01")


FIRST_NAMES = [
    # Indian
    "Aarav","Aarohi","Aditi","Aditya","Akash","Akshay","Amar","Amit","Ananya","Anika",
    "Anjali","Ankit","Anusha","Arjun","Arnav","Avni","Deepak","Dev","Devika","Diya",
    "Gaurav","Harsh","Harini","Ishaan","Ishita","Jhanvi","Kabir","Karan","Kavya",
    "Khushi","Krishna","Kunal","Lakshmi","Manish","Meera","Mohit","Naina","Nandini",
    "Navya","Neha","Nikhil","Nisha","Pooja","Pranav","Prisha","Priya","Rahul","Raj",
    "Riya","Rohan","Rohit","Saanvi","Sahil","Sakshi","Sameer","Sanjana","Shivam",
    "Shreya","Sneha","Sonia","Tanvi","Tanya","Varun","Ved","Vihaan","Vikram","Yash",
    "Yashika","Zoya",

    # More Indian
    "Abhishek","Aishwarya","Alok","Bhavna","Chetan","Darshan","Esha","Farhan","Girish",
    "Hema","Inder","Jaspreet","Kartik","Lalit","Madhav","Naveen","Omkar","Parth",
    "Qamar","Ritika","Siddharth","Tejas","Uday","Vaibhav","Waseem","Yogesh",

    # Western
    "James","John","Robert","Michael","William","David","Richard","Joseph","Thomas",
    "Charles","Christopher","Daniel","Matthew","Anthony","Mark","Donald","Steven",
    "Paul","Andrew","Joshua","Kenneth","Kevin","Brian","George","Edward","Ronald",
    "Timothy","Jason","Jeffrey","Ryan","Jacob","Gary","Nicholas","Eric","Jonathan",

    "Emma","Olivia","Ava","Isabella","Sophia","Mia","Charlotte","Amelia","Harper",
    "Evelyn","Abigail","Emily","Ella","Elizabeth","Camila","Luna","Sofia","Avery",
    "Mila","Aria","Scarlett","Penelope","Layla","Chloe","Victoria","Madison"
]

LAST_NAMES = [
    # Indian
    "Agarwal","Bansal","Bhat","Chatterjee","Chauhan","Das","Desai","Dubey","Ghosh",
    "Gill","Goyal","Gupta","Iyer","Jain","Jha","Joshi","Kapoor","Khan","Khanna",
    "Kulkarni","Kumar","Malhotra","Mehta","Menon","Mishra","Mukherjee","Nair",
    "Pandey","Patel","Pillai","Rao","Reddy","Roy","Saxena","Shah","Sharma",
    "Shetty","Singh","Sinha","Srivastava","Thakur","Trivedi","Varma","Verma",

    # More Indian
    "Acharya","Bose","Chopra","Dutta","Gandhi","Hegde","Jindal","Kaul","Lal",
    "Mathur","Naidu","Ojha","Purohit","Qureshi","Rastogi","Sengar","Tiwari",
    "Upadhyay","Vyas","Wadhwa","Yadav","Zaidi",

    # Western
    "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis",
    "Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson",
    "Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson",
    "White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker",
    "Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores",
    "Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell",
    "Carter","Roberts"
]

MARITAL_STATUSES = [
    "SINGLE",
    "MARRIED",
    "DIVORCED",
    "WIDOWED",
]


GENDERS = [
    "MALE",
    "FEMALE",
    "OTHER",
]

EMAIL_DOMAINS = [
    "gmail.com",
    "outlook.com",
    "yahoo.com",
    "yahoo.co.in",
    "icloud.com",
    "proton.me",
]

STREET_NAMES = [
    # Existing
    "MG Road","Station Road","Park Street","Nehru Road","Lake Road","Temple Road",
    "College Road","Market Road","Gandhi Road","Church Street","Residency Road",
    "Main Road","Ring Road","Garden Road","Hill Road","Canal Road","Airport Road",
    "Railway Road","Hospital Road","School Road",

    # More Indian
    "Link Road","Outer Ring Road","Inner Ring Road","Bypass Road","Sector Road",
    "Janpath Road","Rajpath Road","LBS Marg","Tilak Road","Subhash Road",
    "Azad Road","Ambedkar Road","Tagore Road","Vivekananda Road","Ashram Road",
    "Court Road","Bus Stand Road","Industrial Area Road","Power House Road",
]

LOCALITY_NAMES = [
    # Existing
    "Green Park","Shanti Nagar","Nehru Nagar","Gandhi Nagar","Lake View",
    "Vijay Nagar","Ashok Nagar","Indira Nagar","Model Town","Civil Lines",
    "New Colony","Central Colony","Krishna Nagar","Shivaji Nagar",
    "Rajendra Nagar","Saraswati Nagar",

    # More Indian
    "Laxmi Nagar","Durga Nagar","Ganesh Nagar","Om Nagar","Sai Nagar",
    "Balaji Nagar","Hanuman Nagar","Ram Nagar","Shankar Nagar","Adarsh Nagar",
    "Prem Nagar","Surya Nagar","Chandra Nagar","Vasant Vihar","Shalimar Bagh",
    "Mayur Vihar","Patel Nagar","Karol Bagh","Dwarka Sector 10","Noida Sector 62",
]

BUILDING_NAMES = [
    # Existing
    "Green View Apartments","Lake View Residency","Sunrise Apartments",
    "Royal Residency","Garden Enclave","Silver Heights","Maple Residency",
    "Palm Grove","Harmony Apartments","Central Heights",

    # More Indian-style
    "Sai Residency","Shanti Apartments","Krishna Enclave","Ganesh Towers",
    "Lakshmi Heights","Balaji Residency","Om Plaza","Shiv Residency",
    "Gokul Apartments","Vaishnavi Towers","Anand Residency","Aashiyana Homes",
    "Shree Apartments","Sudarshan Heights","Kaveri Residency",
]


def money(value) -> Decimal:
    """Round a value to two monetary decimal places."""

    return Decimal(str(value)).quantize(
        TWOPLACES,
        rounding=ROUND_HALF_UP,
    )


def get_max_id(
    db,
    model,
    column,
) -> int:
    """Return current maximum primary-key value."""

    result = db.execute(
        select(
            func.max(column)
        ).select_from(model)
    ).scalar_one()

    return int(result or 0)


def random_date_between(
    rng: random.Random,
    start: date,
    end: date,
) -> date:
    """Return a deterministic random date in the interval."""

    days = (
        end - start
    ).days

    return start + timedelta(
        days=rng.randint(
            0,
            max(days, 0),
        )
    )


def date_to_utc_datetime(
    value: date,
    hour: int = 10,
    minute: int = 0,
) -> datetime:
    """Convert a date to a naive UTC datetime for MySQL DATETIME."""

    return datetime.combine(
        value,
        time(
            hour=hour,
            minute=minute,
        ),
    )


def unique_account_number(
    account_id: int,
) -> str:
    """Build a deterministic 14-digit account number."""

    return f"81{account_id:012d}"


def unique_reference(
    transaction_id: int,
) -> str:
    """Build a deterministic unique transaction reference."""

    return (
        f"SEED-TXN-{transaction_id:020d}"
    )


def build_savings_transactions(
    rng: random.Random,
    account_id: int,
    transaction_id_start: int,
    performed_by: int,
    opened_date: date,
    count: int,
):
    """Generate coherent Savings deposit/withdrawal history."""

    transactions = []

    transaction_id = transaction_id_start

    balance = Decimal("0.00")

    start_date = max(
        opened_date,
        date.today()
        - timedelta(days=365),
    )

    end_date = date.today()

    transaction_times = sorted(
        date_to_utc_datetime(
            random_date_between(
                rng,
                start_date,
                end_date,
            ),
            hour=rng.randint(
                4,
                16,
            ),
            minute=rng.randint(
                0,
                59,
            ),
        )
        for _ in range(count)
    )

    for index, transaction_time in enumerate(
        transaction_times,
        start=1,
    ):
        # Ensure first transaction establishes a useful balance.
        if index == 1:
            transaction_type = "DEPOSIT"

            amount = money(
                rng.randint(
                    20000,
                    80000,
                )
            )

        else:
            # Roughly 60% deposits and 40% withdrawals.
            do_deposit = (
                rng.random() < 0.60
            )

            # Avoid withdrawing the account too close to zero.
            if balance < Decimal("10000.00"):
                do_deposit = True

            if do_deposit:
                transaction_type = "DEPOSIT"

                amount = money(
                    rng.randint(
                        1000,
                        25000,
                    )
                )

            else:
                transaction_type = "WITHDRAWAL"

                maximum_withdrawal = min(
                    Decimal("15000.00"),
                    balance
                    - Decimal("5000.00"),
                )

                if (
                    maximum_withdrawal
                    < Decimal("500.00")
                ):
                    transaction_type = "DEPOSIT"

                    amount = money(
                        rng.randint(
                            1000,
                            10000,
                        )
                    )

                else:
                    amount = money(
                        rng.randint(
                            500,
                            int(
                                maximum_withdrawal
                            ),
                        )
                    )

        balance_before = balance

        if transaction_type == "DEPOSIT":
            balance = money(
                balance + amount
            )
        else:
            balance = money(
                balance - amount
            )

        transactions.append(
            {
                "transaction_id":
                    transaction_id,

                "account_id":
                    account_id,

                "performed_by":
                    performed_by,

                "transaction_type":
                    transaction_type,

                "amount":
                    amount,

                "balance_before":
                    balance_before,

                "balance_after":
                    balance,

                "reference_number":
                    unique_reference(
                        transaction_id
                    ),

                "description":
                    (
                        "Savings "
                        f"{transaction_type.lower()}"
                    ),

                "transaction_time":
                    transaction_time,
            }
        )

        transaction_id += 1

    return (
        transactions,
        balance,
        transaction_id,
    )


def build_loan_schedule(
    account_id: int,
    installment_id_start: int,
    principal: Decimal,
    annual_rate: Decimal,
    tenure_months: int,
    repayment_start_date: date,
    paid_installments: int,
):
    """Generate a mathematically consistent Loan schedule."""

    installment_rows = []

    installment_id = (
        installment_id_start
    )

    emi = calculate_emi(
        principal=principal,
        annual_interest_rate=annual_rate,
        tenure_months=tenure_months,
    )

    monthly_rate = (
        annual_rate
        / Decimal("1200")
    )

    outstanding_balance = principal

    principal_repaid = Decimal("0.00")

    for installment_number in range(
        1,
        tenure_months + 1,
    ):
        due_date = add_months(
            repayment_start_date,
            installment_number - 1,
        )

        interest_due = money(
            outstanding_balance
            * monthly_rate
        )

        principal_due = money(
            emi - interest_due
        )

        if (
            installment_number
            == tenure_months
        ):
            principal_due = money(
                outstanding_balance
            )

            amount_due = money(
                principal_due
                + interest_due
            )

        else:
            amount_due = emi

        is_paid = (
            installment_number
            <= paid_installments
        )

        if is_paid:
            amount_paid = amount_due

            installment_status = (
                "PAID"
            )

            paid_date = min(
                due_date,
                date.today(),
            )

            paid_at = (
                date_to_utc_datetime(
                    paid_date,
                    hour=9,
                    minute=30,
                )
            )

            principal_repaid = money(
                principal_repaid
                + principal_due
            )

        else:
            amount_paid = Decimal(
                "0.00"
            )

            paid_at = None

            if due_date < date.today():
                installment_status = (
                    "OVERDUE"
                )
            else:
                installment_status = (
                    "PENDING"
                )

        installment_rows.append(
            {
                "installment_id":
                    installment_id,

                "account_id":
                    account_id,

                "installment_number":
                    installment_number,

                "due_date":
                    due_date,

                "amount_due":
                    amount_due,

                "principal_due":
                    principal_due,

                "interest_due":
                    interest_due,

                "amount_paid":
                    amount_paid,

                "installment_status":
                    installment_status,

                "paid_at":
                    paid_at,
            }
        )

        outstanding_balance = money(
            outstanding_balance
            - principal_due
        )

        installment_id += 1

    outstanding_principal = money(
        principal
        - principal_repaid
    )

    return (
        installment_rows,
        outstanding_principal,
        installment_id,
    )


def build_loan_transactions(
    account_id: int,
    transaction_id_start: int,
    performed_by: int,
    installment_rows: list[dict],
    count: int,
):
    """Create Loan repayment transactions from paid installments."""

    transactions = []

    transaction_id = (
        transaction_id_start
    )

    paid_rows = [
        row
        for row in installment_rows
        if row[
            "installment_status"
        ] == "PAID"
    ]

    usable_rows = paid_rows[
        :count
    ]

    for row in usable_rows:
        transaction_time = (
            row["paid_at"]
            or date_to_utc_datetime(
                row["due_date"],
                hour=9,
                minute=30,
            )
        )

        transactions.append(
            {
                "transaction_id":
                    transaction_id,

                "account_id":
                    account_id,

                "performed_by":
                    performed_by,

                "transaction_type":
                    "LOAN_REPAYMENT",

                "amount":
                    row["amount_due"],

                # Loan balances are not being used as the
                # outstanding principal in Pennywise.
                "balance_before":
                    Decimal("0.00"),

                "balance_after":
                    Decimal("0.00"),

                "reference_number":
                    unique_reference(
                        transaction_id
                    ),

                "description":
                    (
                        "Loan installment "
                        f"{row['installment_number']} repayment"
                    ),

                "transaction_time":
                    transaction_time,
            }
        )

        transaction_id += 1

    return (
        transactions,
        transaction_id,
    )


def insert_batch(
    db,
    customer_rows,
    address_rows,
    account_rows,
    savings_profile_rows,
    loan_profile_rows,
    installment_rows,
    transaction_rows,
) -> None:
    """Insert one dependency-safe synthetic customer batch."""

    if customer_rows:
        db.execute(
            insert(Customer),
            customer_rows,
        )

    if address_rows:
        db.execute(
            insert(CustomerAddress),
            address_rows,
        )

    if account_rows:
        db.execute(
            insert(Account),
            account_rows,
        )

    if savings_profile_rows:
        db.execute(
            insert(SavingsProfile),
            savings_profile_rows,
        )

    if loan_profile_rows:
        db.execute(
            insert(LoanProfile),
            loan_profile_rows,
        )

    if installment_rows:
        db.execute(
            insert(LoanInstallment),
            installment_rows,
        )

    if transaction_rows:
        db.execute(
            insert(AccountTransaction),
            transaction_rows,
        )

    db.commit()

def clear_batch(
    customer_rows,
    address_rows,
    account_rows,
    savings_profile_rows,
    loan_profile_rows,
    installment_rows,
    transaction_rows,
) -> None:
    """Release completed batch rows from memory."""

    customer_rows.clear()
    address_rows.clear()
    account_rows.clear()
    savings_profile_rows.clear()
    loan_profile_rows.clear()
    installment_rows.clear()
    transaction_rows.clear()

def generate_email(
    rng: random.Random,
    customer_id: int,
    first_name: str,
    last_name: str,
) -> str:
    """Generate a realistic-looking unique synthetic email."""

    domain = rng.choice(
        EMAIL_DOMAINS
    )

    style = rng.randint(
        1,
        4,
    )

    first = first_name.lower()
    last = last_name.lower()

    if style == 1:
        username = (
            f"{first}.{last}"
            f"{customer_id}"
        )

    elif style == 2:
        username = (
            f"{first}{last}"
            f"{customer_id}"
        )

    elif style == 3:
        username = (
            f"{first}.{last[0]}"
            f"{customer_id}"
        )

    else:
        username = (
            f"{first[0]}{last}"
            f"{customer_id}"
        )

    return (
        f"{username}@{domain}"
    )

def generate_address(
    rng: random.Random,
) -> tuple[str, str | None]:
    """Generate varied but entirely synthetic Indian-style address lines."""

    style = rng.randint(
        1,
        5,
    )

    house_number = rng.randint(
        1,
        999,
    )

    street = rng.choice(
        STREET_NAMES
    )

    locality = rng.choice(
        LOCALITY_NAMES
    )

    if style == 1:
        address_line_1 = (
            f"{house_number}, {street}"
        )

        address_line_2 = (
            f"{locality}"
        )

    elif style == 2:
        apartment = rng.choice(
            BUILDING_NAMES
        )

        flat_number = (
            f"{rng.randint(1, 20)}"
            f"{chr(rng.randint(65, 70))}"
        )

        address_line_1 = (
            f"Flat {flat_number}, "
            f"{apartment}"
        )

        address_line_2 = (
            f"{locality}, {street}"
        )

    elif style == 3:
        address_line_1 = (
            f"House {house_number}, "
            f"{locality}"
        )

        address_line_2 = (
            f"Near {rng.choice(['Central Market', 'City Park', 'Community Centre', 'Main Junction'])}"
        )

    elif style == 4:
        address_line_1 = (
            f"{house_number}/{rng.randint(1, 20)}, "
            f"{street}"
        )

        address_line_2 = (
            f"Phase {rng.randint(1, 4)}, "
            f"{locality}"
        )

    else:
        apartment = rng.choice(
            BUILDING_NAMES
        )

        address_line_1 = (
            f"{house_number}, "
            f"{apartment}"
        )

        address_line_2 = (
            f"{locality}"
        )

    return (
        address_line_1,
        address_line_2,
    )

def seed_dataset(
    customer_count: int,
    transactions_per_customer: int,
    random_seed: int,
    batch_size: int,
) -> None:
    """Generate and insert a synthetic Pennywise dataset."""

    if batch_size <= 0:
        raise ValueError(
            "Batch size must be greater than zero."
        )

    if customer_count <= 0:
        raise ValueError(
            "Customer count must be greater than zero."
        )

    if transactions_per_customer < 10:
        raise ValueError(
            "Use at least 10 transactions per customer."
        )

    rng = random.Random(
        random_seed
    )

    db = SessionLocal()

    try:
        admin_id = db.execute(
            select(
                Admin.admin_id
            )
            .order_by(
                Admin.admin_id.asc()
            )
            .limit(1)
        ).scalar_one_or_none()

        if admin_id is None:
            raise RuntimeError(
                "No admin exists. Create an admin before seeding."
            )

        city_ids = list(
            db.execute(
                select(
                    City.city_id
                )
                .where(
                    func.length(
                        City.postal_code
                    ) == 6
                )
            ).scalars().all()
        )

        if not city_ids:
            raise RuntimeError(
                "No usable India location records found."
            )

        # Begin after existing test records so this first
        # validation run does not destroy anything.
        customer_id = (
            get_max_id(
                db,
                Customer,
                Customer.customer_id,
            )
            + 1
        )

        address_id = (
            get_max_id(
                db,
                CustomerAddress,
                CustomerAddress.address_id,
            )
            + 1
        )

        account_id = (
            get_max_id(
                db,
                Account,
                Account.account_id,
            )
            + 1
        )

        installment_id = (
            get_max_id(
                db,
                LoanInstallment,
                LoanInstallment.installment_id,
            )
            + 1
        )

        transaction_id = (
            get_max_id(
                db,
                AccountTransaction,
                AccountTransaction.transaction_id,
            )
            + 1
        )

        customer_rows = []
        address_rows = []
        account_rows = []
        savings_profile_rows = []
        loan_profile_rows = []
        installment_rows = []
        transaction_rows = []

        savings_transaction_count = (
            transactions_per_customer
            - 5
        )

        loan_transaction_count = 5

        today = date.today()

        print()
        print(
            "========================================"
        )
        print(
            "PENNYWISE SYNTHETIC DATA GENERATOR"
        )
        print(
            "========================================"
        )
        print(
            f"Customers: {customer_count:,}"
        )
        print(
            "Accounts/customer: 2"
        )
        print(
            "Transactions/customer: "
            f"{transactions_per_customer:,}"
        )
        print(
            f"Random seed: {random_seed}"
        )
        print()

        for customer_index in range(
            customer_count
        ):
            current_customer_id = (
                customer_id
                + customer_index
            )

            first_name = rng.choice(
                FIRST_NAMES
            )

            last_name = rng.choice(
                LAST_NAMES
            )

            gender = rng.choice(
                GENDERS
            )

            dob = random_date_between(
                rng,
                date(
                    today.year - 65,
                    1,
                    1,
                ),
                date(
                    today.year - 21,
                    12,
                    31,
                ),
            )

            created_date = (
                today
                - timedelta(
                    days=rng.randint(
                        365,
                        730,
                    )
                )
            )

            created_at = (
                date_to_utc_datetime(
                    created_date,
                    hour=8,
                    minute=0,
                )
            )

            email = generate_email(
                rng=rng,
                customer_id=current_customer_id,
                first_name=first_name,
                last_name=last_name,
            )
            mobile = (
                f"9"
                f"{current_customer_id:09d}"
            )

            customer_rows.append(
                {
                    "customer_id":
                        current_customer_id,

                    "first_name":
                        first_name,

                    "last_name":
                        last_name,

                    "date_of_birth":
                        dob,

                    "email":
                        email,

                    "mobile":
                        mobile,

                    "marital_status":
                        rng.choice(
                            MARITAL_STATUSES
                        ),

                    "gender":
                        gender,

                    "created_at":
                        created_at,

                    "updated_at":
                        created_at,
                }
            )

            address_line_1, address_line_2 = (
                generate_address(
                    rng
                )
            )

            address_rows.append(
                {
                    "address_id":
                        address_id,

                    "customer_id":
                        current_customer_id,

                    "city_id":
                        rng.choice(
                            city_ids
                        ),

                    "address_type":
                        "CURRENT",

                    "address_line_1":
                        address_line_1,

                    "address_line_2":
                        address_line_2,

                    "is_primary":
                        True,
                }
            )

            address_id += 1

            # -------------------------------------------------
            # Savings Account
            # -------------------------------------------------

            savings_account_id = (
                account_id
            )

            account_id += 1

            opened_date = (
                created_date
                + timedelta(
                    days=rng.randint(
                        0,
                        30,
                    )
                )
            )

            savings_transactions, savings_balance, transaction_id = (
                build_savings_transactions(
                    rng=rng,
                    account_id=(
                        savings_account_id
                    ),
                    transaction_id_start=(
                        transaction_id
                    ),
                    performed_by=(
                        admin_id
                    ),
                    opened_date=(
                        opened_date
                    ),
                    count=(
                        savings_transaction_count
                    ),
                )
            )

            transaction_rows.extend(
                savings_transactions
            )

            savings_status = rng.choices(
                [
                    "ACTIVE",
                    "FROZEN",
                    "CLOSED",
                ],
                weights=[
                    94,
                    4,
                    2,
                ],
                k=1,
            )[0]

            account_rows.append(
                {
                    "account_id":
                        savings_account_id,

                    "customer_id":
                        current_customer_id,

                    "account_number":
                        unique_account_number(
                            savings_account_id
                        ),

                    "account_type":
                        "SAVINGS",

                    "account_status":
                        savings_status,

                    "current_balance":
                        savings_balance,

                    "opened_at":
                        date_to_utc_datetime(
                            opened_date,
                            hour=8,
                            minute=30,
                        ),

                    "closed_at":
                        (
                            date_to_utc_datetime(
                                today
                                - timedelta(
                                    days=5
                                ),
                                hour=9,
                            )
                            if savings_status
                            == "CLOSED"
                            else None
                        ),
                }
            )

            savings_profile_rows.append(
                {
                    "account_id":
                        savings_account_id,

                    "minimum_balance":
                        Decimal(
                            "5000.00"
                        ),

                    "daily_withdrawal_limit":
                        Decimal(
                            "50000.00"
                        ),
                }
            )

            # -------------------------------------------------
            # Loan Account
            # -------------------------------------------------

            loan_account_id = (
                account_id
            )

            account_id += 1

            principal = money(
                rng.choice(
                    [
                        100000,
                        150000,
                        200000,
                        300000,
                        500000,
                        750000,
                        1000000,
                    ]
                )
            )

            annual_rate = Decimal(
                str(
                    rng.choice(
                        [
                            8.0,
                            8.5,
                            9.0,
                            9.5,
                            10.0,
                            10.5,
                            11.0,
                        ]
                    )
                )
            )

            tenure_months = rng.choice(
                [
                    12,
                    24,
                    36,
                    48,
                    60,
                ]
            )

            loan_open_date = (
                today
                - timedelta(
                    days=rng.randint(
                        180,
                        365,
                    )
                )
            )

            repayment_start_date = (
                add_months(
                    loan_open_date,
                    1,
                )
            )

            # Five paid installments provide exactly five
            # Loan repayment transactions/customer.
            paid_installments = min(
                loan_transaction_count,
                tenure_months,
            )

            new_installments, outstanding_principal, installment_id = (
                build_loan_schedule(
                    account_id=(
                        loan_account_id
                    ),
                    installment_id_start=(
                        installment_id
                    ),
                    principal=principal,
                    annual_rate=(
                        annual_rate
                    ),
                    tenure_months=(
                        tenure_months
                    ),
                    repayment_start_date=(
                        repayment_start_date
                    ),
                    paid_installments=(
                        paid_installments
                    ),
                )
            )

            installment_rows.extend(
                new_installments
            )

            loan_transactions, transaction_id = (
                build_loan_transactions(
                    account_id=(
                        loan_account_id
                    ),
                    transaction_id_start=(
                        transaction_id
                    ),
                    performed_by=(
                        admin_id
                    ),
                    installment_rows=(
                        new_installments
                    ),
                    count=(
                        loan_transaction_count
                    ),
                )
            )

            transaction_rows.extend(
                loan_transactions
            )

            account_rows.append(
                {
                    "account_id":
                        loan_account_id,

                    "customer_id":
                        current_customer_id,

                    "account_number":
                        unique_account_number(
                            loan_account_id
                        ),

                    "account_type":
                        "LOAN",

                    "account_status":
                        "ACTIVE",

                    "current_balance":
                        Decimal(
                            "0.00"
                        ),

                    "opened_at":
                        date_to_utc_datetime(
                            loan_open_date,
                            hour=8,
                            minute=30,
                        ),

                    "closed_at":
                        None,
                }
            )

            loan_profile_rows.append(
                {
                    "account_id":
                        loan_account_id,

                    "principal_amount":
                        principal,

                    "interest_rate":
                        annual_rate,

                    "tenure_months":
                        tenure_months,

                    "outstanding_principal":
                        outstanding_principal,

                    "repayment_start_date":
                        repayment_start_date,
                }
            )

            generated_count = (
                customer_index + 1
            )

            if (
                generated_count % batch_size == 0
                or generated_count == customer_count
            ):
                batch_transaction_count = len(
                    transaction_rows
                )

                batch_installment_count = len(
                    installment_rows
                )

                insert_batch(
                    db=db,
                    customer_rows=customer_rows,
                    address_rows=address_rows,
                    account_rows=account_rows,
                    savings_profile_rows=savings_profile_rows,
                    loan_profile_rows=loan_profile_rows,
                    installment_rows=installment_rows,
                    transaction_rows=transaction_rows,
                )

                print(
                    f"Inserted {generated_count:,}/"
                    f"{customer_count:,} customers "
                    f"| Transactions in batch: "
                    f"{batch_transaction_count:,} "
                    f"| Installments in batch: "
                    f"{batch_installment_count:,}"
                )

                clear_batch(
                    customer_rows=customer_rows,
                    address_rows=address_rows,
                    account_rows=account_rows,
                    savings_profile_rows=savings_profile_rows,
                    loan_profile_rows=loan_profile_rows,
                    installment_rows=installment_rows,
                    transaction_rows=transaction_rows,
                )

        print()
        print(
            "========================================"
        )
        print(
            "SEED COMPLETED"
        )
        print(
            "========================================"
        )

        print(
            f"Customers inserted: "
            f"{customer_count:,}"
        )

        print(
            f"Accounts inserted: "
            f"{customer_count * 2:,}"
        )

        print(
            f"Expected transactions: "
            f"{customer_count * transactions_per_customer:,}"
        )

        print()
        print(
            "[OK] Synthetic dataset generated in batches."
        )


    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


def parse_args():
    """Parse command-line arguments."""

    parser = argparse.ArgumentParser(
        description=(
            "Generate Pennywise banking data."
        )
    )

    parser.add_argument(
        "--customers",
        type=int,
        default=100,
        help="Number of customers to create.",
    )

    parser.add_argument(
        "--transactions",
        type=int,
        default=30,
        help=(
            "Minimum transactions per customer. "
            "Five are Loan repayments."
        ),
    )

    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Deterministic random seed.",
    )

    parser.add_argument(
        "--batch-size",
        type=int,
        default=500,
        help="Number of customers generated per database batch.",
    )

    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    seed_dataset(
        customer_count=args.customers,
        transactions_per_customer=args.transactions,
        random_seed=args.seed,
        batch_size=args.batch_size,
    )