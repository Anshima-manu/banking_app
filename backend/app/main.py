"""Main FastAPI application for the banking admin portal."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
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