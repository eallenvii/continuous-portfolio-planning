import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from server_python.database import Base, get_db
from server_python.main import app


SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

_test_db: Session = None


def override_get_db():
    global _test_db
    try:
        yield _test_db
    finally:
        pass


@pytest.fixture(scope="function")
def db_session():
    global _test_db
    Base.metadata.create_all(bind=engine)
    _test_db = TestingSessionLocal()
    try:
        yield _test_db
    finally:
        _test_db.close()
        _test_db = None
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
