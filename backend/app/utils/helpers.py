"""
Helper utility functions.
"""

import hashlib
import secrets
import string
from pathlib import Path


def generate_random_string(length: int = 32, include_symbols: bool = False) -> str:
    """Generate a random string."""
    characters = string.ascii_letters + string.digits
    if include_symbols:
        characters += "!@#$%^&*"

    return "".join(secrets.choice(characters) for _ in range(length))


def generate_uuid_string() -> str:
    """Generate a UUID-like string."""
    import uuid

    return str(uuid.uuid4())


def hash_file(file_path: Path) -> str:
    """Generate SHA256 hash of a file."""
    sha256_hash = hashlib.sha256()

    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256_hash.update(chunk)

    return sha256_hash.hexdigest()


def hash_string(text: str) -> str:
    """Generate SHA256 hash of a string."""
    return hashlib.sha256(text.encode()).hexdigest()


def get_file_extension(filename: str) -> str | None:
    """Get file extension from filename."""
    if "." not in filename:
        return None

    return filename.rsplit(".", 1)[1].lower()


def get_file_name_without_extension(filename: str) -> str:
    """Get filename without extension."""
    if "." not in filename:
        return filename

    return filename.rsplit(".", 1)[0]


def ensure_directory_exists(directory: Path) -> None:
    """Ensure directory exists, create if it doesn't."""
    directory.mkdir(parents=True, exist_ok=True)


def safe_filename(filename: str) -> str:
    """Make filename safe for filesystem."""
    import re

    # Remove or replace unsafe characters
    safe_name = re.sub(r'[<>:"/\\|?*]', "_", filename)

    # Remove leading/trailing spaces and dots
    safe_name = safe_name.strip(" .")

    # Ensure it's not empty
    if not safe_name:
        safe_name = "unnamed_file"

    return safe_name


def chunks(lst: list, chunk_size: int):
    """Yield successive chunks from list."""
    for i in range(0, len(lst), chunk_size):
        yield lst[i : i + chunk_size]


def flatten_dict(d: dict, parent_key: str = "", sep: str = ".") -> dict:
    """Flatten nested dictionary."""
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)


def deep_merge_dicts(dict1: dict, dict2: dict) -> dict:
    """Deep merge two dictionaries."""
    result = dict1.copy()

    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge_dicts(result[key], value)
        else:
            result[key] = value

    return result


def is_valid_url(url: str) -> bool:
    """Check if string is a valid URL."""
    import re

    url_pattern = re.compile(
        r"^https?://"  # http:// or https://
        r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|"  # domain...
        r"localhost|"  # localhost...
        r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"  # ...or ip
        r"(?::\d+)?"  # optional port
        r"(?:/?|[/?]\S+)$",
        re.IGNORECASE,
    )

    return url_pattern.match(url) is not None
