from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

'''SQLAlchemy models which will later become tables'''
'''its for storing master location data'''
'''creates conceptual structure'''

class Country(Base):
    __tablename__ = "countries"

    country_id: Mapped[int] = mapped_column(
        primary_key = True,
        autoincrement = True,
    )
    country_name: Mapped[str]= mapped_column(
        String(100),
        nullable = False,
        unique = True,
    )

class State(Base):
    __tablename__ = "states"
    state_id: Mapped[int] = mapped_column(
        primary_key = True,
        autoincrement = True,
    )

    country_id: Mapped[int] = mapped_column(
        ForeignKey("countries.country_id"),
        nullable = False,
        index = True,
    )

    state_name: Mapped[str] = mapped_column(
        String(100),
        nullable = False,
    )

    __table_args__ = (
        UniqueConstraint(
            "country_id",
            "state_name",
            name = "uq_state_country_name",
        ),
    )

class City(Base):
    __tablename__ = "cities"
    city_id: Mapped[int] = mapped_column(
        primary_key = True,
        autoincrement = True,
    )

    state_id: Mapped[int] = mapped_column(
        ForeignKey("states.state_id"),
        nullable = False,
        index = True,
    )
    city_name: Mapped[str] = mapped_column(
        String(100),
        nullable = False,
    )

    postal_code: Mapped[str] = mapped_column(
        String(20),
        nullable = False,
        index = True,
    )

    __table_args__ = (
        UniqueConstraint(
            "state_id",
            "city_name",
            "postal_code",
            name = "uq_city_state_postal",
        ),
    )