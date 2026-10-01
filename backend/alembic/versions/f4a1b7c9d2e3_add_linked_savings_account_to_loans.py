"""add linked savings account to loan profiles

Revision ID: f4a1b7c9d2e3
Revises: dd79edea31a4
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f4a1b7c9d2e3"
down_revision: Union[str, Sequence[str], None] = "dd79edea31a4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "loan_profiles",
        sa.Column("linked_savings_account_id", sa.BigInteger(), nullable=True),
    )
    op.create_index(
        "ix_loan_profiles_linked_savings_account_id",
        "loan_profiles",
        ["linked_savings_account_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_loan_profiles_linked_savings_account_id",
        "loan_profiles",
        "accounts",
        ["linked_savings_account_id"],
        ["account_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_loan_profiles_linked_savings_account_id",
        "loan_profiles",
        type_="foreignkey",
    )
    op.drop_index(
        "ix_loan_profiles_linked_savings_account_id",
        table_name="loan_profiles",
    )
    op.drop_column("loan_profiles", "linked_savings_account_id")