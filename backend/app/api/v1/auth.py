"""API routes for administrator authentication."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models.admin import Admin
from app.schemas.auth import (
    AdminResponse,
    LoginRequest,
    TokenResponse,
)
from app.services.auth_service import login_admin


router = APIRouter()

#POST /api/v1/auth/login
'''json contains username and password, response contains 
access_token and token_type'''

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Authenticate an administrator and return an access token."""

    token = login_admin(
        db=db,
        username=request.username,
        password=request.password,
    )

    return TokenResponse(
        access_token=token,
    )

#GET /api/v1/auth/me
'''request must contain Authorization: Bearer <token>
and response contains admin_id, username, email, admin_status'''

@router.get(
    "/me",
    response_model=AdminResponse,
)
def get_me(
    current_admin: Admin = Depends(get_current_admin),
) -> Admin:
    """Return the currently authenticated administrator."""

    return current_admin