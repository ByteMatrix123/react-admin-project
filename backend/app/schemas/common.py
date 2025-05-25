"""
Common Pydantic schemas.
"""

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class Message(BaseModel):
    """Generic message response."""

    message: str


class ErrorResponse(BaseModel):
    """Error response schema."""

    error: str
    detail: str | None = None
    code: str | None = None


class PaginationInfo(BaseModel):
    """Pagination information."""

    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    total: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response schema."""

    items: list[T]
    pagination: PaginationInfo

    @classmethod
    def create(
        cls, items: list[T], total: int, page: int, size: int
    ) -> "PaginatedResponse[T]":
        """Create paginated response."""
        total_pages = (total + size - 1) // size  # Ceiling division
        has_next = page < total_pages
        has_prev = page > 1

        pagination = PaginationInfo(
            page=page,
            page_size=size,
            total=total,
            total_pages=total_pages,
            has_next=has_next,
            has_prev=has_prev
        )

        return cls(items=items, pagination=pagination)


class HealthCheck(BaseModel):
    """Health check response."""

    status: str = "healthy"
    timestamp: str
    version: str
    database: str = "connected"
    redis: str = "connected"
