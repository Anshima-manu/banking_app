"""Pydantic schemas for location lookup responses."""

from pydantic import BaseModel


class LocationResponse(BaseModel):
    """Represents location details resolved from a postal code."""

    city_id: int
    city_name: str
    postal_code: str
    state_name: str
    country_name: str