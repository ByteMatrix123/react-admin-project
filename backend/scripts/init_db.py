"""
Database initialization script.
"""

import asyncio

from app.core.database import AsyncSessionLocal, async_engine
from app.core.security import get_password_hash
from app.models.base import BaseModel
from app.models.user import Permission, Role, User


async def create_tables():
    """Create all database tables."""
    async with async_engine.begin() as conn:
        await conn.run_sync(BaseModel.metadata.create_all)
    print("✅ Database tables created successfully")


async def create_default_permissions():
    """Create default permissions."""
    async with AsyncSessionLocal() as session:
        # Define default permissions
        permissions_data = [
            # User permissions
            {
                "name": "user:create",
                "display_name": "Create User",
                "resource": "user",
                "action": "create",
            },
            {
                "name": "user:read",
                "display_name": "Read User",
                "resource": "user",
                "action": "read",
            },
            {
                "name": "user:update",
                "display_name": "Update User",
                "resource": "user",
                "action": "update",
            },
            {
                "name": "user:delete",
                "display_name": "Delete User",
                "resource": "user",
                "action": "delete",
            },
            # Role permissions
            {
                "name": "role:create",
                "display_name": "Create Role",
                "resource": "role",
                "action": "create",
            },
            {
                "name": "role:read",
                "display_name": "Read Role",
                "resource": "role",
                "action": "read",
            },
            {
                "name": "role:update",
                "display_name": "Update Role",
                "resource": "role",
                "action": "update",
            },
            {
                "name": "role:delete",
                "display_name": "Delete Role",
                "resource": "role",
                "action": "delete",
            },
            # Permission permissions
            {
                "name": "permission:create",
                "display_name": "Create Permission",
                "resource": "permission",
                "action": "create",
            },
            {
                "name": "permission:read",
                "display_name": "Read Permission",
                "resource": "permission",
                "action": "read",
            },
            {
                "name": "permission:update",
                "display_name": "Update Permission",
                "resource": "permission",
                "action": "update",
            },
            {
                "name": "permission:delete",
                "display_name": "Delete Permission",
                "resource": "permission",
                "action": "delete",
            },
            # System permissions
            {
                "name": "system:admin",
                "display_name": "System Admin",
                "resource": "system",
                "action": "admin",
            },
            {
                "name": "system:monitor",
                "display_name": "System Monitor",
                "resource": "system",
                "action": "monitor",
            },
        ]

        for perm_data in permissions_data:
            permission = Permission(**perm_data)
            session.add(permission)

        await session.commit()
        print("✅ Default permissions created successfully")


async def create_default_roles():
    """Create default roles."""
    async with AsyncSessionLocal() as session:
        # Create Super Admin role
        super_admin_role = Role(
            name="super_admin",
            display_name="Super Administrator",
            description="Full system access with all permissions",
            is_system=True,
        )
        session.add(super_admin_role)

        # Create Admin role
        admin_role = Role(
            name="admin",
            display_name="Administrator",
            description="Administrative access to most system features",
            is_system=True,
        )
        session.add(admin_role)

        # Create User role
        user_role = Role(
            name="user",
            display_name="User",
            description="Basic user access",
            is_system=True,
        )
        session.add(user_role)

        await session.commit()
        print("✅ Default roles created successfully")


async def assign_permissions_to_roles():
    """Assign permissions to default roles."""
    async with AsyncSessionLocal() as session:
        # Get all permissions
        from sqlalchemy import select

        permissions_result = await session.execute(select(Permission))
        all_permissions = permissions_result.scalars().all()

        # Get roles
        roles_result = await session.execute(select(Role))
        roles = {role.name: role for role in roles_result.scalars().all()}

        # Assign all permissions to super_admin
        if "super_admin" in roles:
            roles["super_admin"].permissions.extend(all_permissions)

        # Assign specific permissions to admin
        if "admin" in roles:
            admin_permissions = [p for p in all_permissions if p.name != "system:admin"]
            roles["admin"].permissions.extend(admin_permissions)

        # Assign basic permissions to user
        if "user" in roles:
            user_permissions = [
                p
                for p in all_permissions
                if p.resource == "user" and p.action == "read"
            ]
            roles["user"].permissions.extend(user_permissions)

        await session.commit()
        print("✅ Permissions assigned to roles successfully")


async def create_super_admin_user():
    """Create default super admin user."""
    async with AsyncSessionLocal() as session:
        # Check if super admin already exists
        from sqlalchemy import select

        result = await session.execute(select(User).where(User.username == "admin"))
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print("⚠️  Super admin user already exists")
            return

        # Get super admin role
        role_result = await session.execute(
            select(Role).where(Role.name == "super_admin")
        )
        super_admin_role = role_result.scalar_one_or_none()

        # Create super admin user
        super_admin = User(
            username="admin",
            email="admin@enterprise.com",
            hashed_password=get_password_hash("Admin123!"),
            full_name="System Administrator",
            is_active=True,
            is_verified=True,
            is_superuser=True,
            department="IT",
            position="System Administrator",
        )

        if super_admin_role:
            super_admin.roles.append(super_admin_role)

        session.add(super_admin)
        await session.commit()

        print("✅ Super admin user created successfully")
        print("   Username: admin")
        print("   Password: Admin123!")
        print("   Email: admin@enterprise.com")


async def create_demo_users():
    """Create demo users for testing."""
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select

        # Get roles
        roles_result = await session.execute(select(Role))
        roles = {role.name: role for role in roles_result.scalars().all()}

        demo_users = [
            {
                "username": "john_doe",
                "email": "john.doe@enterprise.com",
                "password": "User123!",
                "full_name": "John Doe",
                "first_name": "John",
                "last_name": "Doe",
                "department": "Engineering",
                "position": "Software Engineer",
                "role": "user",
            },
            {
                "username": "jane_smith",
                "email": "jane.smith@enterprise.com",
                "password": "Admin123!",
                "full_name": "Jane Smith",
                "first_name": "Jane",
                "last_name": "Smith",
                "department": "HR",
                "position": "HR Manager",
                "role": "admin",
            },
            {
                "username": "bob_wilson",
                "email": "bob.wilson@enterprise.com",
                "password": "User123!",
                "full_name": "Bob Wilson",
                "first_name": "Bob",
                "last_name": "Wilson",
                "department": "Marketing",
                "position": "Marketing Specialist",
                "role": "user",
            },
        ]

        for user_data in demo_users:
            # Check if user already exists
            result = await session.execute(
                select(User).where(User.username == user_data["username"])
            )
            existing_user = result.scalar_one_or_none()

            if existing_user:
                continue

            # Create user
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                department=user_data["department"],
                position=user_data["position"],
                is_active=True,
                is_verified=True,
            )

            # Assign role
            role_name = user_data["role"]
            if role_name in roles:
                user.roles.append(roles[role_name])

            session.add(user)

        await session.commit()
        print("✅ Demo users created successfully")


async def init_database():
    """Initialize database with default data."""
    print("🚀 Initializing database...")

    try:
        await create_tables()
        await create_default_permissions()
        await create_default_roles()
        await assign_permissions_to_roles()
        await create_super_admin_user()
        await create_demo_users()

        print("🎉 Database initialization completed successfully!")

    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(init_database())
