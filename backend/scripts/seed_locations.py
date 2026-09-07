"""Seeds basic location data for local development."""

import sys
from pathlib import Path

from sqlalchemy import select

# Allows this standalone script to import the backend app package.
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal
from app.models.location import City, Country, State


def seed_locations() -> None:
    """Create sample country, state, and city records if absent."""

    db = SessionLocal()

    try:
        country = db.execute(
            select(Country).where(
                Country.country_name == "India"
            )
        ).scalar_one_or_none()

        if country is None:
            country = Country(
                country_name="India",
            )

            db.add(country)
            db.flush()

        state = db.execute(
            select(State).where(
                State.country_id == country.country_id,
                State.state_name == "Karnataka",
            )
        ).scalar_one_or_none()

        if state is None:
            state = State(
                country_id=country.country_id,
                state_name="Karnataka",
            )

            db.add(state)
            db.flush()

        locations = [
            ("Bengaluru", "560001"),
            ("Mysuru", "570001"),
            ("Mangaluru", "575001"),
        ]

        for city_name, postal_code in locations:
            existing_city = db.execute(
                select(City).where(
                    City.state_id == state.state_id,
                    City.city_name == city_name,
                    City.postal_code == postal_code,
                )
            ).scalar_one_or_none()

            if existing_city is None:
                db.add(
                    City(
                        state_id=state.state_id,
                        city_name=city_name,
                        postal_code=postal_code,
                    )
                )

        db.commit()

        print("Location data seeded successfully.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_locations()