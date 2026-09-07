"""FastAPI dependencies shared across protected API routes."""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.enums import AdminStatus
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.admin import Admin


# Extracts the Bearer token from protected requests.
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
)


def get_current_admin(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Admin:
    """Return the active administrator represented by a valid JWT."""

    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)

    if payload is None:
        raise credentials_error

    admin_id = payload.get("sub")

    if admin_id is None:
        raise credentials_error

    try:
        admin_id = int(admin_id)
    except (TypeError, ValueError):
        raise credentials_error

    admin = db.get(
        Admin,
        admin_id,
    )

    if admin is None:
        raise credentials_error

    if admin.admin_status != AdminStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator account is not active.",
        )

    return admin