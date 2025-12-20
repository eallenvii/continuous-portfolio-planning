import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import os


class TestJiraServiceConfiguration:
    """Tests for Jira service configuration supporting Cloud and Data Center"""

    def test_jira_cloud_configuration(self):
        """Jira Cloud uses email + API token authentication"""
        with patch.dict(os.environ, {
            "JIRA_BASE_URL": "https://mycompany.atlassian.net",
            "JIRA_EMAIL": "user@example.com",
            "JIRA_API_TOKEN": "token123",
            "JIRA_DEPLOYMENT_TYPE": "cloud"
        }):
            from server_python.jira_service import JiraService
            service = JiraService()
            
            assert service.is_configured
            assert service.deployment_type == "cloud"
            assert service.base_url == "https://mycompany.atlassian.net"

    def test_jira_datacenter_configuration(self):
        """Jira Data Center uses personal access token (PAT) authentication"""
        with patch.dict(os.environ, {
            "JIRA_BASE_URL": "https://jira.mycompany.com",
            "JIRA_PAT": "personal_access_token_123",
            "JIRA_DEPLOYMENT_TYPE": "datacenter"
        }):
            from server_python.jira_service import JiraService
            service = JiraService()
            
            assert service.is_configured
            assert service.deployment_type == "datacenter"

    def test_jira_datacenter_basic_auth(self):
        """Jira Data Center also supports username + password"""
        with patch.dict(os.environ, {
            "JIRA_BASE_URL": "https://jira.mycompany.com",
            "JIRA_USERNAME": "jirauser",
            "JIRA_PASSWORD": "password123",
            "JIRA_DEPLOYMENT_TYPE": "datacenter"
        }):
            from server_python.jira_service import JiraService
            service = JiraService()
            
            assert service.is_configured
            assert service.deployment_type == "datacenter"

    def test_jira_not_configured_without_credentials(self):
        """Service reports not configured when credentials missing"""
        with patch.dict(os.environ, {}, clear=True):
            from server_python.jira_service import JiraService
            service = JiraService()
            
            assert not service.is_configured


class TestJiraCloudAPI:
    """Tests for Jira Cloud API interactions"""

    @pytest.mark.asyncio
    async def test_cloud_get_projects(self):
        """Cloud API uses /rest/api/3/project endpoint"""
        with patch.dict(os.environ, {
            "JIRA_BASE_URL": "https://mycompany.atlassian.net",
            "JIRA_EMAIL": "user@example.com",
            "JIRA_API_TOKEN": "token123",
            "JIRA_DEPLOYMENT_TYPE": "cloud"
        }):
            from server_python.jira_service import JiraService
            service = JiraService()
            
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = [
                {"key": "PROJ1", "name": "Project One"},
                {"key": "PROJ2", "name": "Project Two"}
            ]
            
            with patch("httpx.AsyncClient") as mock_client:
                mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
                projects = await service.get_projects()
            
            assert len(projects) == 2
            assert projects[0].key == "PROJ1"

    @pytest.mark.asyncio
    async def test_cloud_get_issues_with_jql(self):
        """Cloud API supports JQL queries"""
        with patch.dict(os.environ, {
            "JIRA_BASE_URL": "https://mycompany.atlassian.net",
            "JIRA_EMAIL": "user@example.com",
            "JIRA_API_TOKEN": "token123",
            "JIRA_DEPLOYMENT_TYPE": "cloud"
        }):
            from server_python.jira_service import JiraService
            service = JiraService()
            
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "issues": [
                    {
                        "key": "PROJ-1",
                        "fields": {
                            "summary": "Test Epic",
                            "issuetype": {"name": "Epic"},
                            "customfield_10016": 5
                        }
                    }
                ]
            }
            
            with patch("httpx.AsyncClient") as mock_client:
                mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
                issues = await service.get_issues("PROJ", jql="project = PROJ AND type = Epic")
            
            assert len(issues) == 1
            assert issues[0].key == "PROJ-1"


class TestJiraDataCenterAPI:
    """Tests for Jira Data Center API interactions"""

    @pytest.mark.asyncio
    async def test_datacenter_get_projects(self):
        """Data Center API uses /rest/api/2/project endpoint"""
        with patch.dict(os.environ, {
            "JIRA_BASE_URL": "https://jira.mycompany.com",
            "JIRA_PAT": "pat_token_123",
            "JIRA_DEPLOYMENT_TYPE": "datacenter"
        }):
            from server_python.jira_service import JiraService
            service = JiraService()
            
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = [
                {"key": "DC1", "name": "Data Center Project"}
            ]
            
            with patch("httpx.AsyncClient") as mock_client:
                mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
                projects = await service.get_projects()
            
            assert len(projects) == 1
            assert projects[0].key == "DC1"

    @pytest.mark.asyncio
    async def test_datacenter_uses_bearer_token_for_pat(self):
        """Data Center with PAT uses Bearer token authentication"""
        with patch.dict(os.environ, {
            "JIRA_BASE_URL": "https://jira.mycompany.com",
            "JIRA_PAT": "pat_token_123",
            "JIRA_DEPLOYMENT_TYPE": "datacenter"
        }):
            from server_python.jira_service import JiraService
            service = JiraService()
            
            headers = service.get_auth_headers()
            assert "Authorization" in headers
            assert headers["Authorization"] == "Bearer pat_token_123"
