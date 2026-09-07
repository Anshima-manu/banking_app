"""API routes for location and postal-code lookup."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models.admin import Admin
from app.models.location import City, Country, State
from app.schemas.location import LocationResponse


router = APIRouter()


@router.get(
    "/postal-code/{postal_code}",
    response_model=LocationResponse,
)
def get_location_by_postal_code(
    postal_code: str,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    """Return city, state and country details for a postal code."""

    result = db.execute(
        select(
            City.city_id,
            City.city_name,
            City.postal_code,
            State.state_name,
            Country.country_name,
        )
        .join(
            State,
            City.state_id == State.state_id,
        )
        .join(
            Country,
            State.country_id == Country.country_id,
        )
        .where(
            City.postal_code == postal_code
        )
    ).first()

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Postal code not found.",
        )

    return LocationResponse(
        city_id=result.city_id,
        city_name=result.city_name,
        postal_code=result.postal_code,
        state_name=result.state_name,
        country_name=result.country_name,
    )