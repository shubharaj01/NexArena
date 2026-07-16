"""
Pytest configuration for the SmartStadium API test suite.

Two things are done here, before the application is imported, so that the
tests are deterministic and never touch the real project database or make
outbound network calls:

1. DATABASE_URL is pointed at a disposable temp SQLite file instead of the
   production ``smartstadium.db``.
2. OPENAI_API_KEY is cleared so every service falls back to its built-in,
   deterministic offline behaviour (the same code path used whenever no key
   is configured, e.g. in local/dev environments).
"""
import os
import sys
import tempfile

os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mktemp(suffix='.db')}"
os.environ["OPENAI_API_KEY"] = ""

# Make sure "app" (the package under nexarena/app) is importable regardless
# of the directory pytest is invoked from.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client():
    """A TestClient that triggers FastAPI startup events (FAQ seeding)."""
    with TestClient(app) as test_client:
        yield test_client
