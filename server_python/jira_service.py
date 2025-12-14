import os
import httpx
from typing import List, Optional
from server_python import schemas


class JiraService:
    """Service for interacting with Jira API"""

    def __init__(self):
        self.base_url = os.getenv("JIRA_BASE_URL", "")
        self.email = os.getenv("JIRA_EMAIL", "")
        self.api_token = os.getenv("JIRA_API_TOKEN", "")

    @property
    def is_configured(self) -> bool:
        return bool(self.base_url and self.email and self.api_token)

    @property
    def auth(self) -> tuple:
        return (self.email, self.api_token)

    async def get_projects(self) -> List[schemas.JiraProject]:
        """Fetch all accessible Jira projects"""
        if not self.is_configured:
            return []

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/rest/api/3/project",
                auth=self.auth,
                headers={"Accept": "application/json"}
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
        """Fetch issues from a Jira project"""
        if not self.is_configured:
            return []

        query = jql or f"project = {project_key} AND type = {issue_type}"

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/rest/api/3/search",
                auth=self.auth,
                headers={"Accept": "application/json"},
                params={
                    "jql": query,
                    "maxResults": 100,
                    "fields": "summary,issuetype,description,customfield_10016"
                }
            )
            if response.status_code != 200:
                return []

            data = response.json()
            issues = []
            for issue in data.get("issues", []):
                fields = issue.get("fields", {})
                issues.append(schemas.JiraIssue(
                    key=issue["key"],
                    summary=fields.get("summary", ""),
                    issue_type=fields.get("issuetype", {}).get("name", "Unknown"),
                    story_points=fields.get("customfield_10016"),
                    description=self._extract_description(fields.get("description"))
                ))
            return issues

    def _extract_description(self, desc) -> str:
        """Extract plain text from Atlassian Document Format"""
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
