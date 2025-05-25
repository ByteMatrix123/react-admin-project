"""
FastAPI main application.
"""

import logging
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.auth import router as auth_router
from app.api.files import router as files_router
from app.api.permissions import router as permissions_router
from app.api.roles import router as roles_router
from app.api.users import router as users_router
from app.core.config import settings
from app.core.redis import close_redis, init_redis
from app.schemas.common import HealthCheck

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting up...")
    await init_redis()
    logger.info("Redis initialized")

    yield

    # Shutdown
    logger.info("Shutting down...")
    await close_redis()
    logger.info("Redis closed")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Enterprise Admin System Backend API",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware
if not settings.debug:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", "*.yourdomain.com"],
    )


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.debug else "An unexpected error occurred",
        },
    )


# Health check endpoint
@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint."""
    from app.core.database import get_async_session
    from app.core.redis import get_redis

    # Check database connection
    db_status = "disconnected"
    try:
        async for db in get_async_session():
            result = await db.execute(text("SELECT 1"))
            if result:
                db_status = "connected"
            break
    except Exception:
        logger.exception("Database health check failed")
        db_status = "disconnected"

    # Check Redis connection
    redis_status = "disconnected"
    try:
        redis = await get_redis()
        if redis:
            await redis.ping()
            redis_status = "connected"
    except Exception:
        logger.exception("Redis health check failed")

    overall_status = "healthy" if db_status == "connected" and redis_status == "connected" else "unhealthy"

    return HealthCheck(
        status=overall_status,
        timestamp=datetime.now(UTC).isoformat(),
        version=settings.app_version,
        database=db_status,
        redis=redis_status,
    )


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "docs": "/docs"
        if settings.debug
        else "Documentation not available in production",
    }


# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(roles_router, prefix="/api/roles", tags=["Roles"])
app.include_router(permissions_router, prefix="/api/permissions", tags=["Permissions"])
app.include_router(files_router, prefix="/api/files", tags=["Files"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
