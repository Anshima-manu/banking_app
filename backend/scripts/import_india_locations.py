"""Import Indian PIN-code location data into Pennywise.

Expected CSV columns:
    pincode
    district
    statename

Additional columns in the CSV are safely ignored.
"""

import csv
import re
import sys
from pathlib import Path

from sqlalchemy import select

# Allow imports from the backend application package when this
# script is executed directly from the backend directory.
BACKEND_ROOT = Path(__file__).resolve().parents[1]

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(
        0,
        str(BACKEND_ROOT),
    )


from app.db.session import SessionLocal
from app.models.location import City, Country, State


CSV_FILE = (
    BACKEND_ROOT
    / "data"
    / "all_india_pincode_directory.csv"
)

COUNTRY_NAME = "India"


def clean_text(value: str | None) -> str:
    """Normalize whitespace in location names."""

    if value is None:
        return ""

    value = str(value).strip()

    value = re.sub(
        r"\s+",
        " ",
        value,
    )

    return value


def normalize_name(value: str | None) -> str:
    """Normalize state and district names."""

    value = clean_text(value)

    if not value:
        return ""

    return value.title()


def normalize_pincode(value: str | None) -> str:
    """Return a valid six-digit Indian PIN code."""

    if value is None:
        return ""

    value = str(value).strip()

    # Some CSV readers may produce values such as 560001.0.
    if value.endswith(".0"):
        value = value[:-2]

    value = re.sub(
        r"\D",
        "",
        value,
    )

    if len(value) != 6:
        return ""

    return value


def get_or_create_country(
    db,
) -> Country:
    """Return India country row, creating it when necessary."""

    country = db.execute(
        select(Country).where(
            Country.country_name
            == COUNTRY_NAME
        )
    ).scalar_one_or_none()

    if country is not None:
        return country

    country = Country(
        country_name=COUNTRY_NAME,
    )

    db.add(country)
    db.flush()

    return country


def load_existing_states(
    db,
    country_id: int,
) -> dict[str, State]:
    """Load existing Indian states into an in-memory lookup."""

    states = db.execute(
        select(State).where(
            State.country_id == country_id
        )
    ).scalars().all()

    return {
        state.state_name.casefold():
            state
        for state in states
    }


def load_existing_cities(
    db,
) -> set[tuple[int, str, str]]:
    """Load existing city/PIN combinations for duplicate protection."""

    cities = db.execute(
        select(
            City.state_id,
            City.city_name,
            City.postal_code,
        )
    ).all()

    return {
        (
            row.state_id,
            row.city_name.casefold(),
            row.postal_code,
        )
        for row in cities
    }


def import_locations() -> None:
    """Import nationwide Indian location records from the CSV."""

    if not CSV_FILE.exists():
        raise FileNotFoundError(
            "\nCSV file not found:\n"
            f"{CSV_FILE}\n\n"
            "Place the postal dataset at:\n"
            "data/all_india_pincode_directory.csv"
        )

    db = SessionLocal()

    new_states = 0
    new_cities = 0
    skipped_invalid = 0
    skipped_duplicates = 0

    try:
        country = get_or_create_country(
            db
        )

        states_by_name = (
            load_existing_states(
                db,
                country.country_id,
            )
        )

        existing_cities = (
            load_existing_cities(
                db
            )
        )

        with CSV_FILE.open(
            "r",
            encoding="utf-8-sig",
            newline="",
        ) as csv_file:
            reader = csv.DictReader(
                csv_file
            )

            if not reader.fieldnames:
                raise ValueError(
                    "CSV file has no header row."
                )

            # Make header matching case-insensitive.
            field_lookup = {
                field.strip().lower():
                    field
                for field
                in reader.fieldnames
                if field
            }

            required_columns = {
                "pincode",
                "district",
                "statename",
            }

            missing_columns = (
                required_columns
                - set(
                    field_lookup.keys()
                )
            )

            if missing_columns:
                raise ValueError(
                    "CSV is missing required columns: "
                    + ", ".join(
                        sorted(
                            missing_columns
                        )
                    )
                )

            pincode_column = (
                field_lookup[
                    "pincode"
                ]
            )

            district_column = (
                field_lookup[
                    "district"
                ]
            )

            state_column = (
                field_lookup[
                    "statename"
                ]
            )

            for row_number, row in enumerate(
                reader,
                start=2,
            ):
                pincode = normalize_pincode(
                    row.get(
                        pincode_column
                    )
                )

                district_name = (
                    normalize_name(
                        row.get(
                            district_column
                        )
                    )
                )

                state_name = (
                    normalize_name(
                        row.get(
                            state_column
                        )
                    )
                )

                if (
                    not pincode
                    or not district_name
                    or not state_name
                ):
                    skipped_invalid += 1
                    continue

                state_key = (
                    state_name.casefold()
                )

                state = (
                    states_by_name.get(
                        state_key
                    )
                )

                if state is None:
                    state = State(
                        country_id=(
                            country.country_id
                        ),
                        state_name=(
                            state_name
                        ),
                    )

                    db.add(state)
                    db.flush()

                    states_by_name[
                        state_key
                    ] = state

                    new_states += 1

                city_key = (
                    state.state_id,
                    district_name.casefold(),
                    pincode,
                )

                if (
                    city_key
                    in existing_cities
                ):
                    skipped_duplicates += 1
                    continue

                city = City(
                    state_id=(
                        state.state_id
                    ),
                    city_name=(
                        district_name
                    ),
                    postal_code=(
                        pincode
                    ),
                )

                db.add(city)

                existing_cities.add(
                    city_key
                )

                new_cities += 1

                # Flush periodically instead of holding every
                # pending insert until the end.
                if new_cities % 1000 == 0:
                    db.flush()

                    print(
                        "Processed "
                        f"{new_cities:,} "
                        "new location records..."
                    )

        db.commit()

        print()
        print(
            "India location import completed."
        )
        print(
            f"New states: {new_states:,}"
        )
        print(
            "New district/PIN records: "
            f"{new_cities:,}"
        )
        print(
            "Duplicate postal-office rows skipped: "
            f"{skipped_duplicates:,}"
        )
        print(
            "Invalid rows skipped: "
            f"{skipped_invalid:,}"
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    import_locations()