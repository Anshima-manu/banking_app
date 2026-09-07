"""Business logic for administrator authentication."""

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import AdminStatus
from app.core.security import create_access_token, verify_password
from app.models.admin import Admin


def authenticate_admin(
    db: Session,
    username: str,
    password: str,
) -> Admin:
    """Authenticate an active administrator using username and password."""

    admin = db.execute(
        select(Admin).where(Admin.username == username)
    ).scalar_one_or_none()

    # Use the same response for unknown users and incorrect passwords.
    if admin is None or not verify_password(
        password,
        admin.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )

    if admin.admin_status != AdminStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator account is not active.",
        )

    admin.last_login_at = datetime.now(timezone.utc).replace(
        tzinfo=None
    )

    db.commit()
    db.refresh(admin)

    return admin


def login_admin(
    db: Session,
    username: str,
    password: str,
) -> str:
    """Authenticate an administrator and return an access token."""

    admin = authenticate_admin(
        db=db,
        username=username,
        password=password,
    )

    return create_access_token(
        admin_id=admin.admin_id,
        username=admin.username,
    )