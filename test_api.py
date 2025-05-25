#!/usr/bin/env python3
"""
Simple API test script to verify the backend is working correctly.
"""
import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint."""
    print("🔍 Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Health check passed: {data['status']}")
        return True
    else:
        print(f"❌ Health check failed: {response.status_code}")
        return False

def test_login():
    """Test login endpoint."""
    print("🔍 Testing login endpoint...")
    login_data = {
        "username": "admin",
        "password": "Admin123!"
    }
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Login successful for user: {data['user']['username']}")
        return data['access_token']
    else:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return None

def test_users_list(token):
    """Test users list endpoint."""
    print("🔍 Testing users list endpoint...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/users/", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Users list retrieved: {data['total']} users found")
        for user in data['items']:
            roles = [role['name'] for role in user['roles']]
            print(f"   - {user['username']} ({user['full_name']}) - Roles: {', '.join(roles)}")
        return True
    else:
        print(f"❌ Users list failed: {response.status_code} - {response.text}")
        return False

def test_user_profile(token):
    """Test user profile endpoint."""
    print("🔍 Testing user profile endpoint...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/users/me/profile", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Profile retrieved for: {data['username']} ({data['full_name']})")
        return True
    else:
        print(f"❌ Profile retrieval failed: {response.status_code} - {response.text}")
        return False

def main():
    """Run all tests."""
    print("🚀 Starting API tests...\n")
    
    # Test health
    if not test_health():
        sys.exit(1)
    print()
    
    # Test login
    token = test_login()
    if not token:
        sys.exit(1)
    print()
    
    # Test users list
    if not test_users_list(token):
        sys.exit(1)
    print()
    
    # Test user profile
    if not test_user_profile(token):
        sys.exit(1)
    print()
    
    print("🎉 All tests passed! The backend is working correctly.")
    print(f"📖 API Documentation: {BASE_URL}/docs")
    print(f"🔗 Health Check: {BASE_URL}/health")

if __name__ == "__main__":
    main() 
