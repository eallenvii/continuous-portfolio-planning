from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    id: int
    profile_image_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class TeamMemberBase(BaseModel):
    role: str = "member"


class TeamMemberCreate(TeamMemberBase):
    user_id: int
    team_id: int


class TeamMember(TeamMemberBase):
    id: int
    user_id: int
    team_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SizeMappingBase(BaseModel):
    size: str
    points: int
    confidence: int
    anchor_description: str


class SizeMappingCreate(SizeMappingBase):
    pass


class SizeMapping(SizeMappingBase):
    id: int
    team_id: int

    class Config:
        from_attributes = True


class TeamBase(BaseModel):
    name: str
    avatar: str
    engineer_count: int = 5
    avg_points_per_engineer: int = 8
    sprint_length_weeks: int = 2
    sprints_in_increment: int = 6


class TeamCreate(TeamBase):
    pass


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    engineer_count: Optional[int] = None
    avg_points_per_engineer: Optional[int] = None
    sprint_length_weeks: Optional[int] = None
    sprints_in_increment: Optional[int] = None


class Team(TeamBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EpicBase(BaseModel):
    title: str
    description: str = ""
    original_size: str
    current_size: str
    status: str = "backlog"
    source: str
    is_template: bool = False
    priority: int = 0


class EpicCreate(EpicBase):
    external_id: Optional[str] = None


class EpicUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    original_size: Optional[str] = None
    current_size: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None
    is_template: Optional[bool] = None
    priority: Optional[int] = None
    external_id: Optional[str] = None


class Epic(EpicBase):
    id: int
    team_id: int
    external_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReorderRequest(BaseModel):
    epic_ids: List[int]


class ResetDemoResponse(BaseModel):
    team_id: int
    message: str


class JiraConfigBase(BaseModel):
    project_key: Optional[str] = None
    default_issue_type: str = "Epic"
    size_field: Optional[str] = None
    sync_enabled: bool = False


class JiraConfigCreate(JiraConfigBase):
    pass


class JiraConfig(JiraConfigBase):
    is_configured: bool = False

    class Config:
        from_attributes = True


class JiraProject(BaseModel):
    key: str
    name: str


class JiraIssue(BaseModel):
    key: str
    summary: str
    issue_type: str
    story_points: Optional[int] = None
    description: Optional[str] = None


class JiraImportRequest(BaseModel):
    project_key: str
    issue_type: str = "Epic"
    jql: Optional[str] = None


class JiraImportResponse(BaseModel):
    imported_count: int
    epics: List[Epic]


class MapPointsRequest(BaseModel):
    story_points: int


class MapPointsResponse(BaseModel):
    size: str
    points: int
    matched: bool = True


class TrelloConfigBase(BaseModel):
    board_id: Optional[str] = None
    epic_label: str = "Epic"
    size_label_prefix: str = ""
    sync_enabled: bool = False


class TrelloConfigCreate(TrelloConfigBase):
    pass


class TrelloConfig(TrelloConfigBase):
    is_configured: bool = False

    class Config:
        from_attributes = True


class TrelloBoard(BaseModel):
    id: str
    name: str


class TrelloList(BaseModel):
    id: str
    name: str


class TrelloCard(BaseModel):
    id: str
    name: str
    desc: str = ""
    labels: List[str] = []
    size_label: Optional[str] = None


class TrelloImportRequest(BaseModel):
    board_id: str
    list_id: Optional[str] = None
    filter_label: Optional[str] = None


class TrelloImportResponse(BaseModel):
    imported_count: int
    epics: List[Epic]


class DemoSessionCreate(BaseModel):
    pass


class DemoSession(BaseModel):
    session_token: str
    team_id: int
    created_at: datetime
    last_accessed: datetime

    class Config:
        from_attributes = True


class DemoSessionResponse(BaseModel):
    session_token: str
    team: Team
