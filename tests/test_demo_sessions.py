import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from server_python.main import app
from server_python.database import Base, get_db
from server_python import models

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


class TestDemoSessions:
    def test_create_demo_session(self, client):
        response = client.post("/api/demo/session")
        assert response.status_code == 200
        data = response.json()
        assert "session_token" in data
        assert "team" in data
        assert data["team"]["name"] == "Rocket Squad"
        assert len(data["session_token"]) > 20

    def test_demo_sessions_are_isolated(self, client):
        response1 = client.post("/api/demo/session")
        response2 = client.post("/api/demo/session")
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        session1 = response1.json()
        session2 = response2.json()
        
        assert session1["session_token"] != session2["session_token"]
        assert session1["team"]["id"] != session2["team"]["id"]

    def test_get_demo_session(self, client):
        create_response = client.post("/api/demo/session")
        session = create_response.json()
        token = session["session_token"]
        
        get_response = client.get(
            "/api/demo/session",
            headers={"X-Demo-Session": token}
        )
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["team"]["id"] == session["team"]["id"]

    def test_get_demo_session_without_token(self, client):
        response = client.get("/api/demo/session")
        assert response.status_code == 404

    def test_get_demo_teams(self, client):
        create_response = client.post("/api/demo/session")
        session = create_response.json()
        token = session["session_token"]
        team_id = session["team"]["id"]
        
        teams_response = client.get(
            "/api/demo/teams",
            headers={"X-Demo-Session": token}
        )
        assert teams_response.status_code == 200
        teams = teams_response.json()
        assert len(teams) == 1
        assert teams[0]["id"] == team_id

    def test_get_demo_teams_without_token(self, client):
        response = client.get("/api/demo/teams")
        assert response.status_code == 401

    def test_update_demo_team(self, client):
        create_response = client.post("/api/demo/session")
        session = create_response.json()
        token = session["session_token"]
        team_id = session["team"]["id"]
        
        update_response = client.patch(
            f"/api/demo/teams/{team_id}",
            headers={"X-Demo-Session": token},
            json={"name": "Updated Team Name"}
        )
        assert update_response.status_code == 200
        assert update_response.json()["name"] == "Updated Team Name"

    def test_cannot_access_other_session_team(self, client):
        session1_response = client.post("/api/demo/session")
        session2_response = client.post("/api/demo/session")
        
        session1 = session1_response.json()
        session2 = session2_response.json()
        
        response = client.get(
            f"/api/demo/teams/{session2['team']['id']}",
            headers={"X-Demo-Session": session1["session_token"]}
        )
        assert response.status_code == 403

    def test_get_demo_epics(self, client):
        create_response = client.post("/api/demo/session")
        session = create_response.json()
        token = session["session_token"]
        team_id = session["team"]["id"]
        
        epics_response = client.get(
            f"/api/demo/teams/{team_id}/epics",
            headers={"X-Demo-Session": token}
        )
        assert epics_response.status_code == 200
        epics = epics_response.json()
        assert len(epics) == 8

    def test_create_demo_epic(self, client):
        create_response = client.post("/api/demo/session")
        session = create_response.json()
        token = session["session_token"]
        team_id = session["team"]["id"]
        
        epic_response = client.post(
            f"/api/demo/teams/{team_id}/epics",
            headers={"X-Demo-Session": token},
            json={
                "title": "New Epic",
                "description": "Test description",
                "original_size": "M",
                "current_size": "M",
                "source": "Template"
            }
        )
        assert epic_response.status_code == 201
        assert epic_response.json()["title"] == "New Epic"

    def test_demo_size_mappings(self, client):
        create_response = client.post("/api/demo/session")
        session = create_response.json()
        token = session["session_token"]
        team_id = session["team"]["id"]
        
        mappings_response = client.get(
            f"/api/demo/teams/{team_id}/size-mappings",
            headers={"X-Demo-Session": token}
        )
        assert mappings_response.status_code == 200
        mappings = mappings_response.json()
        assert len(mappings) == 8
        sizes = [m["size"] for m in mappings]
        assert "S" in sizes
        assert "M" in sizes
        assert "L" in sizes

    def test_delete_demo_session(self, client):
        create_response = client.post("/api/demo/session")
        session = create_response.json()
        token = session["session_token"]
        
        delete_response = client.delete(
            "/api/demo/session",
            headers={"X-Demo-Session": token}
        )
        assert delete_response.status_code == 200
        
        get_response = client.get(
            "/api/demo/session",
            headers={"X-Demo-Session": token}
        )
        assert get_response.status_code == 404
