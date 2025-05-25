#!/usr/bin/env python3
"""
Test runner script for the enterprise admin system.
"""

import os
import subprocess
import sys
from pathlib import Path


def run_command(cmd: str, description: str) -> bool:
    """Run a command and return success status."""
    print(f"\n🔄 {description}")
    print(f"Running: {cmd}")

    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=False)

    if result.returncode == 0:
        print(f"✅ {description} - SUCCESS")
        if result.stdout:
            print(result.stdout)
        return True
    else:
        print(f"❌ {description} - FAILED")
        if result.stderr:
            print("STDERR:", result.stderr)
        if result.stdout:
            print("STDOUT:", result.stdout)
        return False


def main():
    """Main test runner."""
    print("🧪 Enterprise Admin System - Test Runner")
    print("=" * 50)

    # Change to backend directory
    backend_dir = Path(__file__).parent.parent
    os.chdir(backend_dir)
    print(f"Working directory: {os.getcwd()}")

    # Test commands
    tests = [
        ("python -m pytest tests/test_simple.py -v", "Simple Infrastructure Tests"),
        ("python -m pytest tests/test_simple.py::TestSimple::test_health_endpoint -v", "Health Endpoint Test"),
        ("python -m pytest tests/test_simple.py::TestSimple::test_root_endpoint -v", "Root Endpoint Test"),
    ]

    success_count = 0
    total_count = len(tests)

    for cmd, description in tests:
        if run_command(cmd, description):
            success_count += 1

    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print(f"✅ Passed: {success_count}/{total_count}")
    print(f"❌ Failed: {total_count - success_count}/{total_count}")

    if success_count == total_count:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed!")
        return 1


if __name__ == "__main__":
    sys.exit(main())
