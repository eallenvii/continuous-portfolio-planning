import os
import httpx
from typing import List, Optional, Dict, Any
from server_python import schemas


class JiraService:
    """Service for interacting with Jira API - supports Cloud and Data Center"""

    def __init__(self):
        self.base_url = os.getenv("JIRA_BASE_URL", "").rstrip("/")
        self.deployment_type = os.getenv("JIRA_DEPLOYMENT_TYPE", "cloud").lower()
        
        # Cloud credentials
        self.email = os.getenv("JIRA_EMAIL", "")
        self.api_token = os.getenv("JIRA_API_TOKEN", "")
        
        # Data Center credentials
        self.pat = os.getenv("JIRA_PAT", "")
        self.username = os.getenv("JIRA_USERNAME", "")
        self.password = os.getenv("JIRA_PASSWORD", "")

    @property
    def is_configured(self) -> bool:
        if not self.base_url:
            return False
        
        if self.deployment_type == "cloud":
            return bool(self.email and self.api_token)
        else:
            return bool(self.pat or (self.username and self.password))

    @property
    def api_version(self) -> str:
        return "3" if self.deployment_type == "cloud" else "2"

    def get_auth_headers(self) -> Dict[str, str]:
        headers = {"Accept": "application/json", "Content-Type": "application/json"}
        
        if self.deployment_type == "datacenter" and self.pat:
            headers["Authorization"] = f"Bearer {self.pat}"
        
        return headers

    def get_auth(self) -> Optional[tuple]:
        if self.deployment_type == "cloud":
            return (self.email, self.api_token)
        elif self.username and self.password:
            return (self.username, self.password)
        return None

    async def get_projects(self) -> List[schemas.JiraProject]:
        if not self.is_configured:
            return []

        url = f"{self.base_url}/rest/api/{self.api_version}/project"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                auth=self.get_auth(),
                headers=self.get_auth_headers()
            )
            if response.status_code != 200:
                return []

            projects = response.json()
            return [
                schemas.JiraProject(key=p["key"], name=p["name"])
                for p in projects
            ]

    async def get_issues(
        self,
        project_key: str,
        issue_type: str = "Epic",
        jql: Optional[str] = None
    ) -> List[schemas.JiraIssue]:
        if not self.is_configured:
            return []

        query = jql or f"project = {project_key} AND type = {issue_type}"
        url = f"{self.base_url}/rest/api/{self.api_version}/search"
        
        story_points_field = "customfield_10016" if self.deployment_type == "cloud" else "customfield_10002"

        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                auth=self.get_auth(),
                headers=self.get_auth_headers(),
                params={
                    "jql": query,
                    "maxResults": 100,
                    "fields": f"summary,issuetype,description,{story_points_field}"
                }
            )
            if response.status_code != 200:
                return []

            data = response.json()
            issues = []
            for issue in data.get("issues", []):
                fields = issue.get("fields", {})
                story_points = fields.get(story_points_field) or fields.get("customfield_10016")
                issues.append(schemas.JiraIssue(
                    key=issue["key"],
                    summary=fields.get("summary", ""),
                    issue_type=fields.get("issuetype", {}).get("name", "Unknown"),
                    story_points=int(story_points) if story_points else None,
                    description=self._extract_description(fields.get("description"))
                ))
            return issues

    def _extract_description(self, desc) -> str:
        if not desc:
            return ""
        if isinstance(desc, str):
            return desc
        if isinstance(desc, dict) and "content" in desc:
            texts = []
            for block in desc.get("content", []):
                if block.get("type") == "paragraph":
                    for item in block.get("content", []):
                        if item.get("type") == "text":
                            texts.append(item.get("text", ""))
            return " ".join(texts)
        return ""


jira_service = JiraService()
