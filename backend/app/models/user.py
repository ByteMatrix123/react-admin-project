"""
User, Role, and Permission models.
"""
from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, 
    String, Text, Table, UniqueConstraint
)
from sqlalchemy.orm import relationship

from .base import BaseModel


# Association tables for many-to-many relationships
user_role_table = Table(
    'user_roles',
    BaseModel.metadata,
    Column('user_id', Integer, ForeignKey('user.id'), primary_key=True),
    Column('role_id', Integer, ForeignKey('role.id'), primary_key=True),
    Column('created_at', DateTime, default=datetime.utcnow),
)

role_permission_table = Table(
    'role_permissions',
    BaseModel.metadata,
    Column('role_id', Integer, ForeignKey('role.id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permission.id'), primary_key=True),
    Column('created_at', DateTime, default=datetime.utcnow),
)


class User(BaseModel):
    """User model."""
    
    __tablename__ = "user"
    
    # Basic Information
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Profile Information
    full_name = Column(String(100), nullable=True)
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=True)
    phone = Column(String(20), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    
    # Work Information
    department = Column(String(100), nullable=True)
    position = Column(String(100), nullable=True)
    employee_id = Column(String(50), nullable=True, unique=True)
    
    # Personal Information
    birthday = Column(DateTime, nullable=True)
    location = Column(String(200), nullable=True)
    bio = Column(Text, nullable=True)
    
    # Status and Settings
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    
    # Authentication
    last_login = Column(DateTime, nullable=True)
    password_changed_at = Column(DateTime, default=datetime.utcnow)
    
    # Settings
    language = Column(String(10), default="zh-CN", nullable=False)
    timezone = Column(String(50), default="Asia/Shanghai", nullable=False)
    theme = Column(String(20), default="light", nullable=False)
    
    # Notification Settings
    email_notifications = Column(Boolean, default=True, nullable=False)
    browser_notifications = Column(Boolean, default=True, nullable=False)
    mobile_notifications = Column(Boolean, default=True, nullable=False)
    
    # Privacy Settings
    show_online_status = Column(Boolean, default=True, nullable=False)
    allow_data_collection = Column(Boolean, default=False, nullable=False)
    
    # Security Settings
    two_factor_enabled = Column(Boolean, default=False, nullable=False)
    session_timeout = Column(Integer, default=60, nullable=False)  # minutes
    
    # Relationships
    roles = relationship(
        "Role",
        secondary=user_role_table,
        back_populates="users",
        lazy="selectin"
    )
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"
    
    @property
    def display_name(self) -> str:
        """Get display name for user."""
        if self.full_name:
            return self.full_name
        elif self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        else:
            return self.username
    
    def has_permission(self, permission_name: str) -> bool:
        """Check if user has specific permission."""
        for role in self.roles:
            for permission in role.permissions:
                if permission.name == permission_name:
                    return True
        return False
    
    def has_role(self, role_name: str) -> bool:
        """Check if user has specific role."""
        return any(role.name == role_name for role in self.roles)


class Role(BaseModel):
    """Role model."""
    
    __tablename__ = "role"
    
    name = Column(String(50), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_system = Column(Boolean, default=False, nullable=False)  # System roles cannot be deleted
    
    # Relationships
    users = relationship(
        "User",
        secondary=user_role_table,
        back_populates="roles"
    )
    permissions = relationship(
        "Permission",
        secondary=role_permission_table,
        back_populates="roles",
        lazy="selectin"
    )
    
    def __repr__(self) -> str:
        return f"<Role(id={self.id}, name='{self.name}')>"


class Permission(BaseModel):
    """Permission model."""
    
    __tablename__ = "permission"
    
    name = Column(String(100), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    resource = Column(String(50), nullable=False)  # e.g., 'user', 'role', 'permission'
    action = Column(String(50), nullable=False)    # e.g., 'create', 'read', 'update', 'delete'
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    roles = relationship(
        "Role",
        secondary=role_permission_table,
        back_populates="permissions"
    )
    
    __table_args__ = (
        UniqueConstraint('resource', 'action', name='_resource_action_uc'),
    )
    
    def __repr__(self) -> str:
        return f"<Permission(id={self.id}, name='{self.name}')>"


# Legacy association models (for explicit relationship management if needed)
class UserRole(BaseModel):
    """User-Role association model."""
    
    __tablename__ = "user_role"
    
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    role_id = Column(Integer, ForeignKey('role.id'), nullable=False)
    assigned_by = Column(Integer, ForeignKey('user.id'), nullable=True)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        UniqueConstraint('user_id', 'role_id', name='_user_role_uc'),
    )


class RolePermission(BaseModel):
    """Role-Permission association model."""
    
    __tablename__ = "role_permission"
    
    role_id = Column(Integer, ForeignKey('role.id'), nullable=False)
    permission_id = Column(Integer, ForeignKey('permission.id'), nullable=False)
    assigned_by = Column(Integer, ForeignKey('user.id'), nullable=True)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        UniqueConstraint('role_id', 'permission_id', name='_role_permission_uc'),
    ) 
