"""Creates the initial administrator for local development."""

import sys
from pathlib import Path

from sqlalchemy import select

# Allows the script to import the backend app package.
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.enums import AdminStatus
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.admin import Admin

#local development login credentials
ADMIN_USERNAME = "admin"
ADMIN_EMAIL = "admin@bank.local"
ADMIN_PASSWORD = "Admin@12345"


def seed_admin() -> None:
    """Create the initial admin if the username does not already exist."""

    db = SessionLocal()

    try:
        existing_admin = db.execute(
            select(Admin).where(
                Admin.username == ADMIN_USERNAME
            )
        ).scalar_one_or_none()

        if existing_admin:
            print("Admin already exists.")
            return

        admin = Admin(
            username=ADMIN_USERNAME,
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            admin_status=AdminStatus.ACTIVE.value,
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print(
            f"Admin created successfully with ID {admin.admin_id}."
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()