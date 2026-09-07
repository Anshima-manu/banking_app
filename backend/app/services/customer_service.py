"""Business logic for customer and address management."""

from fastapi import HTTPException, status
from sqlalchemy import or_, select, func
from sqlalchemy.orm import Session
from decimal import Decimal
from math import ceil

from app.core.enums import AccountStatus, AccountType
from app.models.account import Account, LoanProfile, SavingsProfile
from app.models.customer import Customer, CustomerAddress
from app.schemas.customer import AddressCreate, AddressUpdate, CustomerCreate, CustomerUpdate
from app.services.account_service import generate_account_number
from app.services.loan_service import generate_installment_schedule

def create_customer(
    db: Session,
    data: CustomerCreate,
) -> Customer:
    """Create a customer, addresses, and initial account atomically."""

    existing_customer = db.execute(
        select(Customer).where(
            Customer.email == data.email
        )
    ).scalar_one_or_none()

    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A customer with this email already exists.",
        )

    account_data = data.account

    if account_data.account_type == AccountType.SAVINGS:
        if account_data.savings_profile is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Savings profile is required.",
            )

        if account_data.loan_profile is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Loan profile is not allowed for a savings account.",
            )

    if account_data.account_type == AccountType.LOAN:
        if account_data.loan_profile is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Loan profile is required.",
            )

        if account_data.savings_profile is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Savings profile is not allowed for a loan account.",
            )

    try:
        customer = Customer(
            first_name=data.first_name,
            last_name=data.last_name,
            date_of_birth=data.date_of_birth,
            email=str(data.email),
            mobile=data.mobile,
            marital_status=data.marital_status,
            gender=data.gender,
        )

        db.add(customer)
        db.flush()

        for address_data in data.addresses:
            address = CustomerAddress(
                customer_id=customer.customer_id,
                city_id=address_data.city_id,
                address_type=address_data.address_type.value,
                address_line_1=address_data.address_line_1,
                address_line_2=address_data.address_line_2,
                is_primary=address_data.is_primary,
            )

            db.add(address)

        account = Account(
            customer_id=customer.customer_id,
            account_number=generate_account_number(db),
            account_type=account_data.account_type.value,
            account_status=AccountStatus.ACTIVE.value,
            current_balance=(
                account_data.opening_balance
                if account_data.account_type == AccountType.SAVINGS
                else Decimal("0.00")
            ),
        )

        db.add(account)
        db.flush()

        if account_data.account_type == AccountType.SAVINGS:
            savings_data = account_data.savings_profile

            savings_profile = SavingsProfile(
                account_id=account.account_id,
                minimum_balance=savings_data.minimum_balance,
                daily_withdrawal_limit=(
                    savings_data.daily_withdrawal_limit
                ),
            )

            db.add(savings_profile)

        elif account_data.account_type == AccountType.LOAN:
            loan_data = account_data.loan_profile

            if loan_data is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, detail="Loan profile is required."
                )

            loan_profile = LoanProfile(
                account_id=account.account_id,
                principal_amount=loan_data.principal_amount,
                interest_rate=loan_data.interest_rate,
                tenure_months=loan_data.tenure_months,
                outstanding_principal=(
                    loan_data.principal_amount
                ),
                repayment_start_date=(
                    loan_data.repayment_start_date
                ),
            )

            db.add(loan_profile)
            db.flush()
            generate_installment_schedule(
                db=db,
                account_id=account.account_id,
            )

        db.commit()
        db.refresh(customer)

        return customer

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise

def get_customer(
    db: Session,
    customer_id: int,
) -> Customer:
    """Return a customer by ID or raise a 404 error."""

    customer = db.get(
        Customer,
        customer_id,
    )

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    return customer


def search_customers(
    db: Session,
    customer_id: int | None = None,
    first_name: str | None = None,
    last_name: str | None = None,
    email: str | None = None,
    mobile: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 10,
) -> dict:
    """Search customers using specific filters or general search."""

    query = select(Customer)
    filters = []

    if search:
        value = search.strip()

        search_conditions = [
            Customer.first_name.ilike(f"%{value}%"),
            Customer.last_name.ilike(f"%{value}%"),
            Customer.email.ilike(f"%{value}%"),
            Customer.mobile.ilike(f"%{value}%"),
        ]

        if value.isdigit():
            search_conditions.append(
                Customer.customer_id == int(value)
            )

        filters.append(or_(*search_conditions))

    else:
        if customer_id is not None:
            filters.append(Customer.customer_id == customer_id)

        if first_name:
            filters.append(
                Customer.first_name.ilike(f"%{first_name.strip()}%")
            )

        if last_name:
            filters.append(
                Customer.last_name.ilike(f"%{last_name.strip()}%")
            )

        if email:
            filters.append(
                Customer.email.ilike(f"%{email.strip()}%")
            )

        if mobile:
            filters.append(
                Customer.mobile.ilike(f"%{mobile.strip()}%")
            )

    if filters:
        query = query.where(*filters)

    total = db.scalar(
        select(func.count())
        .select_from(Customer)
        .where(*filters)
    ) or 0

    customers = db.execute(
        query
        .order_by(
            Customer.first_name.asc(),
            Customer.last_name.asc(),
            Customer.customer_id.asc(),
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()

    return {
        "items": list(customers),
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": ceil(total / page_size) if total else 0,
    }


def update_customer(
    db: Session,
    customer_id: int,
    data: CustomerUpdate,
) -> Customer:
    """Update only the customer fields provided in the request."""

    customer = get_customer(
        db,
        customer_id,
    )

    changes = data.model_dump(
        exclude_unset=True,
    )

    # Avoid duplicate email addresses when email changes.
    if "email" in changes:
        email = str(changes["email"])

        duplicate = db.execute(
            select(Customer).where(
                Customer.email == email,
                Customer.customer_id != customer_id,
            )
        ).scalar_one_or_none()

        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A customer with this email already exists.",
            )

        changes["email"] = email

    try:
        for field, value in changes.items():
            setattr(
                customer,
                field,
                value,
            )

        db.commit()
        db.refresh(customer)

        return customer

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise

def get_customer_addresses(
    db: Session,
    customer_id: int,
):
    """Return all addresses belonging to a customer."""

    get_customer(
        db=db,
        customer_id=customer_id,
    )

    addresses = db.execute(
        select(CustomerAddress)
        .where(
            CustomerAddress.customer_id == customer_id
        )
        .order_by(
            CustomerAddress.is_primary.desc(),
            CustomerAddress.address_id.asc(),
        )
    ).scalars().all()

    return list(addresses)


def create_customer_address(
    db: Session,
    customer_id: int,
    data: AddressCreate,
) -> CustomerAddress:
    """Create an address for an existing customer."""

    get_customer(
        db=db,
        customer_id=customer_id,
    )

    duplicate_type = db.execute(
        select(CustomerAddress).where(
            CustomerAddress.customer_id == customer_id,
            CustomerAddress.address_type == data.address_type.value,
        )
    ).scalar_one_or_none()

    if duplicate_type:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Customer already has an address of this type.",
        )

    try:
        # Keep only one primary address per customer.
        if data.is_primary:
            existing_primary_addresses = db.execute(
                select(CustomerAddress).where(
                    CustomerAddress.customer_id == customer_id,
                    CustomerAddress.is_primary.is_(True),
                )
            ).scalars().all()

            for address in existing_primary_addresses:
                address.is_primary = False

        address = CustomerAddress(
            customer_id=customer_id,
            city_id=data.city_id,
            address_type=data.address_type.value,
            address_line_1=data.address_line_1,
            address_line_2=data.address_line_2,
            is_primary=data.is_primary,
        )

        db.add(address)
        db.commit()
        db.refresh(address)

        return address

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


def update_customer_address(
    db: Session,
    customer_id: int,
    address_id: int,
    data: AddressUpdate,
) -> CustomerAddress:
    """Update an address belonging to a customer."""

    get_customer(
        db=db,
        customer_id=customer_id,
    )

    address = db.execute(
        select(CustomerAddress).where(
            CustomerAddress.address_id == address_id,
            CustomerAddress.customer_id == customer_id,
        )
    ).scalar_one_or_none()

    if address is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer address not found.",
        )

    changes = data.model_dump(
        exclude_unset=True,
    )

    if "address_type" in changes:
        new_type = changes["address_type"].value

        duplicate_type = db.execute(
            select(CustomerAddress).where(
                CustomerAddress.customer_id == customer_id,
                CustomerAddress.address_type == new_type,
                CustomerAddress.address_id != address_id,
            )
        ).scalar_one_or_none()

        if duplicate_type:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Customer already has an address of this type.",
            )

        changes["address_type"] = new_type

    try:
        # Promoting this address removes primary status from others.
        if changes.get("is_primary") is True:
            other_primary_addresses = db.execute(
                select(CustomerAddress).where(
                    CustomerAddress.customer_id == customer_id,
                    CustomerAddress.address_id != address_id,
                    CustomerAddress.is_primary.is_(True),
                )
            ).scalars().all()

            for other_address in other_primary_addresses:
                other_address.is_primary = False

        for field, value in changes.items():
            setattr(
                address,
                field,
                value,
            )

        db.commit()
        db.refresh(address)

        return address

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


def delete_customer_address(
    db: Session,
    customer_id: int,
    address_id: int,
) -> None:
    """Remove an address belonging to a customer."""

    get_customer(
        db=db,
        customer_id=customer_id,
    )

    address = db.execute(
        select(CustomerAddress).where(
            CustomerAddress.address_id == address_id,
            CustomerAddress.customer_id == customer_id,
        )
    ).scalar_one_or_none()

    if address is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer address not found.",
        )

    try:
        db.delete(address)
        db.commit()

    except Exception:
        db.rollback()
