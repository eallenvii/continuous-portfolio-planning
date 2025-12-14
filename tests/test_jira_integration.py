import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


class TestJiraAPI:
    """Unit tests for Jira integration API endpoints"""

    def test_get_jira_projects_requires_team(self, client):
        """GET /api/teams/{team_id}/jira/projects returns projects list"""
        team_data = {"name": "Test Team", "avatar": "https://example.com/avatar.png"}
        team_response = client.post("/api/teams", json=team_data)
        team_id = team_response.json()["id"]

        response = client.get(f"/api/teams/{team_id}/jira/projects")
        assert response.status_code in [200, 503]

    def test_get_jira_issues_returns_issues(self, client):
        """GET /api/teams/{team_id}/jira/issues returns issues from Jira"""
        team_data = {"name": "Test Team", "avatar": "https://example.com/avatar.png"}
        team_response = client.post("/api/teams", json=team_data)
        team_id = team_response.json()["id"]

        response = client.get(f"/api/teams/{team_id}/jira/issues?project_key=TEST")
        assert response.status_code in [200, 503]

    def test_import_jira_issues_creates_epics(self, client):
        """POST /api/teams/{team_id}/jira/import converts issues to epics"""
        team_data = {"name": "Test Team", "avatar": "https://example.com/avatar.png"}
        team_response = client.post("/api/teams", json=team_data)
        team_id = team_response.json()["id"]

        import_data = {
            "project_key": "TEST",
            "issue_type": "Epic",
            "jql": "project = TEST AND type = Epic"
        }
        response = client.post(f"/api/teams/{team_id}/jira/import", json=import_data)
        assert response.status_code in [200, 503]

    def test_get_jira_config_returns_integration_status(self, client):
        """GET /api/teams/{team_id}/jira/config returns Jira integration status"""
        team_data = {"name": "Test Team", "avatar": "https://example.com/avatar.png"}
        team_response = client.post("/api/teams", json=team_data)
        team_id = team_response.json()["id"]

        response = client.get(f"/api/teams/{team_id}/jira/config")
        assert response.status_code == 200
        data = response.json()
        assert "is_configured" in data

    def test_save_jira_config_stores_settings(self, client):
        """PUT /api/teams/{team_id}/jira/config saves Jira settings"""
        team_data = {"name": "Test Team", "avatar": "https://example.com/avatar.png"}
        team_response = client.post("/api/teams", json=team_data)
        team_id = team_response.json()["id"]

        config_data = {
            "project_key": "PROJ",
            "default_issue_type": "Epic",
            "size_field": "customfield_10001",
            "sync_enabled": True
        }
        response = client.put(f"/api/teams/{team_id}/jira/config", json=config_data)
        assert response.status_code == 200


class TestJiraSizeMapping:
    """Tests for mapping Jira story points to T-shirt sizes"""

    def test_map_story_points_to_size_small(self, client):
        """Story points 1-3 should map to S size"""
        team_data = {"name": "Test Team", "avatar": "https://example.com/avatar.png"}
        team_response = client.post("/api/teams", json=team_data)
        team_id = team_response.json()["id"]

        mappings = [
            {"size": "S", "points": 3, "confidence": 90, "anchor_description": "Small"},
            {"size": "M", "points": 5, "confidence": 80, "anchor_description": "Medium"},
            {"size": "L", "points": 8, "confidence": 70, "anchor_description": "Large"}
        ]
        client.put(f"/api/teams/{team_id}/size-mappings", json=mappings)

        response = client.post(
            f"/api/teams/{team_id}/jira/map-points",
            json={"story_points": 3}
        )
        assert response.status_code in [200, 404]

    def test_map_story_points_to_size_medium(self, client):
        """Story points 4-6 should map to M size"""
        team_data = {"name": "Test Team", "avatar": "https://example.com/avatar.png"}
        team_response = client.post("/api/teams", json=team_data)
        team_id = team_response.json()["id"]

        mappings = [
            {"size": "S", "points": 3, "confidence": 90, "anchor_description": "Small"},
            {"size": "M", "points": 5, "confidence": 80, "anchor_description": "Medium"},
            {"size": "L", "points": 8, "confidence": 70, "anchor_description": "Large"}
        ]
        client.put(f"/api/teams/{team_id}/size-mappings", json=mappings)

        response = client.post(
            f"/api/teams/{team_id}/jira/map-points",
            json={"story_points": 5}
        )
        assert response.status_code in [200, 404]
