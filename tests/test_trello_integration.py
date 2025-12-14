import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import os


class TestTrelloServiceConfiguration:
    """Tests for Trello service configuration"""

    def test_trello_configuration_with_key_and_token(self):
        """Trello uses API key + token authentication"""
        with patch.dict(os.environ, {
            "TRELLO_API_KEY": "api_key_123",
            "TRELLO_TOKEN": "token_456"
        }):
            from server_python.trello_service import TrelloService
            service = TrelloService()
            
            assert service.is_configured
            assert service.api_key == "api_key_123"

    def test_trello_not_configured_without_credentials(self):
        """Service reports not configured when credentials missing"""
        with patch.dict(os.environ, {}, clear=True):
            from server_python.trello_service import TrelloService
            service = TrelloService()
            
            assert not service.is_configured


class TestTrelloAPI:
    """Tests for Trello API interactions"""

    @pytest.mark.asyncio
    async def test_get_boards(self):
        """Fetch all accessible Trello boards"""
        with patch.dict(os.environ, {
            "TRELLO_API_KEY": "api_key_123",
            "TRELLO_TOKEN": "token_456"
        }):
            from server_python.trello_service import TrelloService
            service = TrelloService()
            
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = [
                {"id": "board1", "name": "Product Backlog"},
                {"id": "board2", "name": "Sprint Board"}
            ]
            
            with patch("httpx.AsyncClient") as mock_client:
                mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
                boards = await service.get_boards()
            
            assert len(boards) == 2
            assert boards[0].name == "Product Backlog"

    @pytest.mark.asyncio
    async def test_get_cards_from_board(self):
        """Fetch cards from a Trello board"""
        with patch.dict(os.environ, {
            "TRELLO_API_KEY": "api_key_123",
            "TRELLO_TOKEN": "token_456"
        }):
            from server_python.trello_service import TrelloService
            service = TrelloService()
            
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = [
                {
                    "id": "card1",
                    "name": "Implement feature X",
                    "desc": "Description of feature X",
                    "labels": [{"name": "Epic"}, {"name": "M"}]
                },
                {
                    "id": "card2",
                    "name": "Fix bug Y",
                    "desc": "Bug description",
                    "labels": [{"name": "S"}]
                }
            ]
            
            with patch("httpx.AsyncClient") as mock_client:
                mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
                cards = await service.get_cards("board1")
            
            assert len(cards) == 2
            assert cards[0].name == "Implement feature X"

    @pytest.mark.asyncio
    async def test_get_lists_from_board(self):
        """Fetch lists from a Trello board"""
        with patch.dict(os.environ, {
            "TRELLO_API_KEY": "api_key_123",
            "TRELLO_TOKEN": "token_456"
        }):
            from server_python.trello_service import TrelloService
            service = TrelloService()
            
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = [
                {"id": "list1", "name": "Backlog"},
                {"id": "list2", "name": "In Progress"},
                {"id": "list3", "name": "Done"}
            ]
            
            with patch("httpx.AsyncClient") as mock_client:
                mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
                lists = await service.get_lists("board1")
            
            assert len(lists) == 3


class TestTrelloEndpoints:
    """Tests for Trello API endpoints in FastAPI"""

    def test_get_trello_config(self, client):
        """GET /api/teams/{team_id}/trello/config returns config status"""
        team_data = {"name": "Test Team", "avatar": "https://example.com/avatar.png"}
        team_response = client.post("/api/teams", json=team_data)
        team_id = team_response.json()["id"]

        response = client.get(f"/api/teams/{team_id}/trello/config")
        assert response.status_code == 200
        data = response.json()
        assert "is_configured" in data

    def test_save_trello_config(self, client):
        """PUT /api/teams/{team_id}/trello/config saves settings"""
        team_data = {"name": "Test Team", "avatar": "https://example.com/avatar.png"}
        team_response = client.post("/api/teams", json=team_data)
        team_id = team_response.json()["id"]

        config_data = {
            "board_id": "abc123",
            "epic_label": "Epic",
            "size_label_prefix": "",
            "sync_enabled": True
        }
        response = client.put(f"/api/teams/{team_id}/trello/config", json=config_data)
        assert response.status_code == 200

    def test_get_trello_boards(self, client):
        """GET /api/teams/{team_id}/trello/boards returns boards list"""
        team_data = {"name": "Test Team", "avatar": "https://example.com/avatar.png"}
        team_response = client.post("/api/teams", json=team_data)
        team_id = team_response.json()["id"]

        response = client.get(f"/api/teams/{team_id}/trello/boards")
        assert response.status_code in [200, 503]

    def test_import_trello_cards(self, client):
        """POST /api/teams/{team_id}/trello/import imports cards as epics"""
        team_data = {"name": "Test Team", "avatar": "https://example.com/avatar.png"}
        team_response = client.post("/api/teams", json=team_data)
        team_id = team_response.json()["id"]

        import_data = {
            "board_id": "abc123",
            "list_id": "list456",
            "filter_label": "Epic"
        }
        response = client.post(f"/api/teams/{team_id}/trello/import", json=import_data)
        assert response.status_code in [200, 503]
