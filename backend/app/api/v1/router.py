"""Central router for version 1 of the banking API."""

from fastapi import APIRouter

from app.api.v1 import (
    accounts,
    auth,
    customers,
    dashboard,
    loans,
    locations,
    reports,
    transactions,
)


api_router = APIRouter()


api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"],
)

api_router.include_router(
    customers.router,
    prefix="/customers",
    tags=["Customers"],
)

api_router.include_router(
    locations.router,
    prefix="/locations",
    tags=["Locations"],
)

api_router.include_router(
    dashboard.router,
    prefix="/dashboard",
    tags=["Dashboard"],
)

api_router.include_router(
    loans.router,
    tags=["Loans"],
)

api_router.include_router(
    reports.router,
    prefix="/reports",
    tags=["Reports"],
)

api_router.include_router(
    accounts.router,
    tags=["Accounts"],
)

api_router.include_router(
    transactions.router,
    tags=["Transactions"],
)