"""Main FastAPI application for the banking admin portal."""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.session import SessionLocal
from app.services.loan_service import process_due_installments


async def run_due_installment_job():
    """Run the daily auto-debit job when a system admin is configured."""

    while True:
        if settings.system_admin_id is not None:
            db = SessionLocal()
            try:
                process_due_installments(
                    db=db,
                    admin_id=settings.system_admin_id,
                )
            except Exception:
                db.rollback()
            finally:
                db.close()

        await asyncio.sleep(24 * 60 * 60)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    job = asyncio.create_task(run_due_installment_job())
    try:
        yield
    finally:
        job.cancel()
        await asyncio.gather(job, return_exceptions=True)


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
)


# Allows the React application to call the backend during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# All application APIs are versioned under /api/v1.
app.include_router(
    api_router,
    prefix="/api/v1",
)


@app.get("/health")
def health_check():
    """Return a simple status response for backend availability."""

    return {
        "status": "healthy",
        "application": settings.app_name,
    }