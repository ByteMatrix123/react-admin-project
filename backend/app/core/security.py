"""
Security utilities for authentication and authorization.
"""

from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(
    subject: str | Any, expires_delta: timedelta | None = None
) -> str:
    """Create JWT access token."""
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(
        to_encode, settings.secret_key, algorithm=settings.algorithm
    )
    return encoded_jwt


def create_refresh_token(
    subject: str | Any, expires_delta: timedelta | None = None
) -> str:
    """Create JWT refresh token."""
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)

    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(
        to_encode, settings.secret_key, algorithm=settings.algorithm
    )
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> str | None:
    """Verify JWT token and return subject."""
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )

        # Check token type
        if payload.get("type") != token_type:
            return None

        # Check expiration
        exp = payload.get("exp")
        if exp is None or datetime.now(UTC) > datetime.fromtimestamp(exp, tz=UTC):
            return None

        subject: str = payload.get("sub")
        return subject
    except JWTError:
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)


def generate_password_reset_token(email: str) -> str:
    """Generate password reset token."""
    delta = timedelta(hours=24)  # Token valid for 24 hours
    now = datetime.now(UTC)
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email, "type": "password_reset"},
        settings.secret_key,
        algorithm=settings.algorithm,
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> str | None:
    """Verify password reset token and return email."""
    try:
        decoded_token = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )

        # Check token type
        if decoded_token.get("type") != "password_reset":
            return None

        return decoded_token.get("sub")
    except JWTError:
        return None


def generate_email_verification_token(email: str) -> str:
    """Generate email verification token."""
    delta = timedelta(hours=48)  # Token valid for 48 hours
    now = datetime.now(UTC)
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email, "type": "email_verification"},
        settings.secret_key,
        algorithm=settings.algorithm,
    )
    return encoded_jwt


def verify_email_verification_token(token: str) -> str | None:
    """Verify email verification token and return email."""
    try:
        decoded_token = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )

        # Check token type
        if decoded_token.get("type") != "email_verification":
            return None

        return decoded_token.get("sub")
    except JWTError:
        return None
