"""
Admin Account Creation Script for Ideal SkillSet
------------------------------------------------
Creates an administrator account in MongoDB collection `User_data` with bcrypt password hashing.

Usage:
    cd backend
    python scripts/create_admin.py
"""

import sys
import os
import getpass
from datetime import datetime, timezone

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.security import hash_password
from app.database.connection import mongo_manager


def create_admin():
    print("=" * 60)
    print(" Ideal SkillSet — Administrator Account Creation")
    print("=" * 60)
    print(f"Target Database   : {settings.DATABASE_NAME}")
    print(f"Target Collection : User_data\n")

    # 1. Connect to MongoDB
    db = mongo_manager.connect()
    if db is None:
        print("[ERROR] Could not connect to MongoDB. Please ensure MongoDB is running at:")
        print(f"        {settings.MONGODB_URI}")
        sys.exit(1)

    user_col = mongo_manager.user_data

    # 2. Gather inputs
    name = input("Enter Admin Full Name : ").strip()
    if not name:
        print("[ERROR] Name cannot be empty.")
        sys.exit(1)

    email = input("Enter Admin Email     : ").strip().lower()
    if not email or "@" not in email:
        print("[ERROR] Please provide a valid email address.")
        sys.exit(1)

    password = getpass.getpass("Enter Admin Password  : ")
    if len(password) < 8:
        print("[ERROR] Admin password must be at least 8 characters long.")
        sys.exit(1)

    confirm_password = getpass.getpass("Confirm Admin Password: ")
    if password != confirm_password:
        print("[ERROR] Passwords do not match.")
        sys.exit(1)

    # 3. Check for existing account
    existing = user_col.find_one({"email": email})
    now = datetime.now(timezone.utc)

    if existing:
        if existing.get("role") == "admin":
            print(f"\n[INFO] An admin account with email '{email}' already exists.")
            update = input("Do you want to update this admin's password? (y/N): ").strip().lower()
            if update == "y":
                pwd_hash = hash_password(password)
                user_col.update_one(
                    {"email": email},
                    {"$set": {"password_hash": pwd_hash, "updated_at": now}}
                )
                print(f"[SUCCESS] Password updated for admin '{email}'.")
            else:
                print("[CANCELLED] No changes made.")
            return
        else:
            print(f"\n[INFO] A user account with email '{email}' already exists.")
            promote = input("Do you want to promote this user to 'admin' and update their password? (y/N): ").strip().lower()
            if promote == "y":
                pwd_hash = hash_password(password)
                user_col.update_one(
                    {"email": email},
                    {"$set": {"role": "admin", "password_hash": pwd_hash, "name": name, "updated_at": now}}
                )
                print(f"[SUCCESS] User '{email}' has been promoted to administrator!")
            else:
                print("[CANCELLED] No changes made.")
            return

    # 4. Insert new Admin document
    pwd_hash = hash_password(password)
    admin_doc = {
        "name": name,
        "email": email,
        "password_hash": pwd_hash,
        "role": "admin",
        "created_at": now,
        "updated_at": now,
    }

    result = user_col.insert_one(admin_doc)
    print("\n" + "=" * 60)
    print(f"[SUCCESS] Administrator created successfully!")
    print(f"          Document ID : {result.inserted_id}")
    print(f"          Admin Name  : {name}")
    print(f"          Admin Email : {email}")
    print(f"          Role        : admin")
    print("=" * 60)


if __name__ == "__main__":
    try:
        create_admin()
    finally:
        mongo_manager.close()

