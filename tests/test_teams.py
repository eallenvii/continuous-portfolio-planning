import pytest


class TestTeamsAPI:
    def test_get_teams_empty(self, client):
        response = client.get("/api/teams")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_team(self, client):
        team_data = {
            "name": "Test Team",
            "avatar": "https://example.com/avatar.png",
            "engineer_count": 5,
            "avg_points_per_engineer": 8,
            "sprint_length_weeks": 2,
            "sprints_in_increment": 6
        }
        response = client.post("/api/teams", json=team_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Team"
        assert data["engineer_count"] == 5
        assert "id" in data

    def test_get_team_by_id(self, client):
        team_data = {
            "name": "Fetch Team",
            "avatar": "https://example.com/avatar.png"
        }
        create_response = client.post("/api/teams", json=team_data)
        team_id = create_response.json()["id"]

        response = client.get(f"/api/teams/{team_id}")
        assert response.status_code == 200
        assert response.json()["name"] == "Fetch Team"

    def test_get_team_not_found(self, client):
        response = client.get("/api/teams/9999")
        assert response.status_code == 404

    def test_update_team(self, client):
        team_data = {
            "name": "Original Name",
            "avatar": "https://example.com/avatar.png"
        }
        create_response = client.post("/api/teams", json=team_data)
        team_id = create_response.json()["id"]

        update_data = {"name": "Updated Name", "engineer_count": 10}
        response = client.patch(f"/api/teams/{team_id}", json=update_data)
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"
        assert response.json()["engineer_count"] == 10

    def test_delete_team(self, client):
        team_data = {
            "name": "To Delete",
            "avatar": "https://example.com/avatar.png"
        }
        create_response = client.post("/api/teams", json=team_data)
        team_id = create_response.json()["id"]

        delete_response = client.delete(f"/api/teams/{team_id}")
        assert delete_response.status_code == 200

        get_response = client.get(f"/api/teams/{team_id}")
        assert get_response.status_code == 404


class TestSizeMappingsAPI:
    def test_get_size_mappings_empty(self, client):
        team_data = {"name": "Test", "avatar": "https://example.com/avatar.png"}
        create_response = client.post("/api/teams", json=team_data)
        team_id = create_response.json()["id"]

        response = client.get(f"/api/teams/{team_id}/size-mappings")
        assert response.status_code == 200
        assert response.json() == []

    def test_update_size_mappings(self, client):
        team_data = {"name": "Test", "avatar": "https://example.com/avatar.png"}
        create_response = client.post("/api/teams", json=team_data)
        team_id = create_response.json()["id"]

        mappings = [
            {"size": "S", "points": 3, "confidence": 90, "anchor_description": "Small task"},
            {"size": "M", "points": 5, "confidence": 80, "anchor_description": "Medium task"}
        ]
        response = client.put(f"/api/teams/{team_id}/size-mappings", json=mappings)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["size"] == "S"
        assert data[1]["size"] == "M"


class TestEpicsAPI:
    def test_get_epics_empty(self, client):
        team_data = {"name": "Test", "avatar": "https://example.com/avatar.png"}
        create_response = client.post("/api/teams", json=team_data)
        team_id = create_response.json()["id"]

        response = client.get(f"/api/teams/{team_id}/epics")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_epic(self, client):
        team_data = {"name": "Test", "avatar": "https://example.com/avatar.png"}
        create_response = client.post("/api/teams", json=team_data)
        team_id = create_response.json()["id"]

        epic_data = {
            "title": "Test Epic",
            "description": "Test description",
            "original_size": "M",
            "current_size": "M",
            "source": "Jira",
            "priority": 0
        }
        response = client.post(f"/api/teams/{team_id}/epics", json=epic_data)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Epic"
        assert data["team_id"] == team_id

    def test_update_epic(self, client):
        team_data = {"name": "Test", "avatar": "https://example.com/avatar.png"}
        create_response = client.post("/api/teams", json=team_data)
        team_id = create_response.json()["id"]

        epic_data = {
            "title": "Original Title",
            "original_size": "S",
            "current_size": "S",
            "source": "Template"
        }
        epic_response = client.post(f"/api/teams/{team_id}/epics", json=epic_data)
        epic_id = epic_response.json()["id"]

        update_data = {"title": "Updated Title", "current_size": "M"}
        response = client.patch(f"/api/epics/{epic_id}", json=update_data)
        assert response.status_code == 200
        assert response.json()["title"] == "Updated Title"
        assert response.json()["current_size"] == "M"

    def test_delete_epic(self, client):
        team_data = {"name": "Test", "avatar": "https://example.com/avatar.png"}
        create_response = client.post("/api/teams", json=team_data)
        team_id = create_response.json()["id"]

        epic_data = {
            "title": "To Delete",
            "original_size": "L",
            "current_size": "L",
            "source": "Jira"
        }
        epic_response = client.post(f"/api/teams/{team_id}/epics", json=epic_data)
        epic_id = epic_response.json()["id"]

        delete_response = client.delete(f"/api/epics/{epic_id}")
        assert delete_response.status_code == 200

    def test_reorder_epics(self, client):
        team_data = {"name": "Test", "avatar": "https://example.com/avatar.png"}
        create_response = client.post("/api/teams", json=team_data)
        team_id = create_response.json()["id"]

        epic1 = client.post(f"/api/teams/{team_id}/epics", json={
            "title": "Epic 1", "original_size": "S", "current_size": "S", "source": "Template", "priority": 0
        }).json()
        epic2 = client.post(f"/api/teams/{team_id}/epics", json={
            "title": "Epic 2", "original_size": "M", "current_size": "M", "source": "Template", "priority": 1
        }).json()

        reorder_response = client.put(
            f"/api/teams/{team_id}/epics/reorder",
            json={"epic_ids": [epic2["id"], epic1["id"]]}
        )
        assert reorder_response.status_code == 200


class TestResetDemo:
    def test_reset_demo(self, client):
        response = client.post("/api/reset-demo")
        assert response.status_code == 200
        data = response.json()
        assert "team_id" in data
        assert data["message"] == "Demo data reset successfully"

        teams_response = client.get("/api/teams")
        teams = teams_response.json()
        assert len(teams) == 1
        assert teams[0]["name"] == "Rocket Squad"
