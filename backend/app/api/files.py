"""
File upload and management API endpoints.
"""

from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.utils.helpers import generate_uuid_string, safe_filename
from app.utils.validators import validate_file_extension, validate_file_size

router = APIRouter()

# Ensure upload directory exists
UPLOAD_DIR = Path(settings.upload_dir)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a file."""
    # Validate file extension
    if not validate_file_extension(file.filename, settings.allowed_extensions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(settings.allowed_extensions)}"
        )

    # Read file content to check size
    content = await file.read()
    file_size = len(content)

    # Validate file size
    if not validate_file_size(file_size, settings.max_file_size):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {settings.max_file_size} bytes"
        )

    # Generate unique filename
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
    unique_filename = f"{generate_uuid_string()}.{file_extension}" if file_extension else generate_uuid_string()

    # Save file
    file_path = UPLOAD_DIR / unique_filename

    try:
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        return {
            "filename": unique_filename,
            "original_filename": file.filename,
            "size": file_size,
            "content_type": file.content_type,
            "url": f"/api/files/{unique_filename}",
        }

    except Exception:
        # Clean up file if something went wrong
        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save file"
        )


@router.post("/upload-multiple")
async def upload_multiple_files(
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload multiple files."""
    if len(files) > 10:  # Limit to 10 files at once
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many files. Maximum 10 files allowed"
        )

    uploaded_files = []
    failed_files = []

    for file in files:
        try:
            # Validate file extension
            if not validate_file_extension(file.filename, settings.allowed_extensions):
                failed_files.append({
                    "filename": file.filename,
                    "error": f"File type not allowed. Allowed types: {', '.join(settings.allowed_extensions)}"
                })
                continue

            # Read file content to check size
            content = await file.read()
            file_size = len(content)

            # Validate file size
            if not validate_file_size(file_size, settings.max_file_size):
                failed_files.append({
                    "filename": file.filename,
                    "error": f"File too large. Maximum size: {settings.max_file_size} bytes"
                })
                continue

            # Generate unique filename
            file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
            unique_filename = f"{generate_uuid_string()}.{file_extension}" if file_extension else generate_uuid_string()

            # Save file
            file_path = UPLOAD_DIR / unique_filename

            with open(file_path, "wb") as buffer:
                buffer.write(content)

            uploaded_files.append({
                "filename": unique_filename,
                "original_filename": file.filename,
                "size": file_size,
                "content_type": file.content_type,
                "url": f"/api/files/{unique_filename}",
            })

        except Exception:
            failed_files.append({
                "filename": file.filename,
                "error": "Failed to save file"
            })

    return {
        "uploaded_files": uploaded_files,
        "failed_files": failed_files,
        "total_uploaded": len(uploaded_files),
        "total_failed": len(failed_files),
    }


@router.get("/{filename}")
async def download_file(
    filename: str,
    current_user: User = Depends(get_current_user),
):
    """Download a file."""
    # Sanitize filename
    safe_name = safe_filename(filename)
    file_path = UPLOAD_DIR / safe_name

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    return FileResponse(
        path=file_path,
        filename=safe_name,
        media_type='application/octet-stream'
    )


@router.delete("/{filename}")
async def delete_file(
    filename: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a file."""
    # Sanitize filename
    safe_name = safe_filename(filename)
    file_path = UPLOAD_DIR / safe_name

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    try:
        file_path.unlink()
        return {"message": "File deleted successfully"}

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete file"
        )


@router.get("/")
async def list_files(
    current_user: User = Depends(get_current_user),
):
    """List all uploaded files."""
    files = []

    for file_path in UPLOAD_DIR.iterdir():
        if file_path.is_file():
            stat = file_path.stat()
            files.append({
                "filename": file_path.name,
                "size": stat.st_size,
                "created_at": stat.st_ctime,
                "modified_at": stat.st_mtime,
                "url": f"/api/files/{file_path.name}",
            })

    return {
        "files": files,
        "total": len(files),
    }
