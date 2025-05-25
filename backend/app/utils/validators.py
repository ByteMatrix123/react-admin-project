"""
Validation utility functions.
"""

import re


def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password(password: str) -> tuple[bool, str | None]:
    """
    Validate password strength.
    
    Returns:
        tuple: (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"

    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"

    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"

    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"

    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"

    return True, None


def validate_phone(phone: str) -> bool:
    """Validate phone number format."""
    # Remove all non-digit characters
    digits_only = re.sub(r'\D', '', phone)

    # Check if it's a valid length (10-15 digits)
    return 10 <= len(digits_only) <= 15


def validate_username(username: str) -> tuple[bool, str | None]:
    """
    Validate username format.
    
    Returns:
        tuple: (is_valid, error_message)
    """
    if len(username) < 3:
        return False, "Username must be at least 3 characters long"

    if len(username) > 30:
        return False, "Username must be no more than 30 characters long"

    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        return False, "Username can only contain letters, numbers, underscores, and hyphens"

    if username.startswith('_') or username.startswith('-'):
        return False, "Username cannot start with underscore or hyphen"

    return True, None


def validate_file_extension(filename: str, allowed_extensions: list[str]) -> bool:
    """Validate file extension."""
    if '.' not in filename:
        return False

    extension = filename.rsplit('.', 1)[1].lower()
    return extension in [ext.lower() for ext in allowed_extensions]


def validate_file_size(file_size: int, max_size: int) -> bool:
    """Validate file size."""
    return file_size <= max_size
