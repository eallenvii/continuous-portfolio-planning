import os
import secrets
from fastapi import FastAPI, Depends, HTTPException, status, Request, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from server_python.database import get_db, engine, Base
from server_python import models
from server_python import schemas
from server_python.auth import (
    get_current_user, get_current_user_optional, create_user, authenticate_user,
    get_user_by_email, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
)
from server_python.logger import get_logger, log_request, log_response, log_error

logger = get_logger("api")

Base.metadata.create_all(bind=engine)
logger.info("Database tables created/verified")

app = FastAPI(title="Portfolio FlowOps API")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.debug(f"REQUEST: {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        logger.debug(f"RESPONSE: {request.method} {request.url.path} -> {response.status_code}")
        return response
    except Exception as e:
        log_error(logger, e, f"{request.method} {request.url.path}")
        raise


@app.post("/api/auth/signup", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def signup(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    logger.info(f"Signup attempt for email: {user_data.email}")
    try:
        existing_user = get_user_by_email(db, user_data.email)
        if existing_user:
            logger.warning(f"Signup failed: email already exists: {user_data.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        user = create_user(
            db=db,
            email=user_data.email,
            password=user_data.password,
            first_name=user_data.first_name,
            last_name=user_data.last_name
        )
        logger.info(f"User created successfully: id={user.id}, email={user.email}")
        return user
    except HTTPException:
        raise
    except Exception as e:
        log_error(logger, e, "signup")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/auth/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    logger.info(f"Login attempt for email: {credentials.email}")
    try:
        user = authenticate_user(db, credentials.email, credentials.password)
        if not user:
            logger.warning(f"Login failed: invalid credentials for {credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        logger.info(f"Login successful for user: id={user.id}, email={user.email}")
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        log_error(logger, e, "login")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/auth/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@app.post("/api/auth/logout")
def logout(current_user: models.User = Depends(get_current_user)):
    return {"message": "Successfully logged out"}


@app.get("/api/teams", response_model=List[schemas.Team])
def get_teams(db: Session = Depends(get_db)):
    return db.query(models.Team).all()


@app.post("/api/teams", response_model=schemas.Team)
def create_team(team: schemas.TeamCreate, db: Session = Depends(get_db)):
    db_team = models.Team(**team.model_dump())
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team


@app.get("/api/teams/{team_id}", response_model=schemas.Team)
def get_team(team_id: int, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


@app.patch("/api/teams/{team_id}", response_model=schemas.Team)
def update_team(team_id: int, team_update: schemas.TeamUpdate, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    update_data = team_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(team, field, value)
    
    team.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(team)
    return team


@app.delete("/api/teams/{team_id}")
def delete_team(team_id: int, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    db.delete(team)
    db.commit()
    return {"message": "Team deleted"}


@app.get("/api/teams/{team_id}/size-mappings", response_model=List[schemas.SizeMapping])
def get_size_mappings(team_id: int, db: Session = Depends(get_db)):
    return db.query(models.SizeMapping).filter(models.SizeMapping.team_id == team_id).all()


@app.put("/api/teams/{team_id}/size-mappings", response_model=List[schemas.SizeMapping])
def update_size_mappings(team_id: int, mappings: List[schemas.SizeMappingCreate], db: Session = Depends(get_db)):
    db.query(models.SizeMapping).filter(models.SizeMapping.team_id == team_id).delete()
    
    new_mappings = []
    for mapping in mappings:
        db_mapping = models.SizeMapping(team_id=team_id, **mapping.model_dump())
        db.add(db_mapping)
        new_mappings.append(db_mapping)
    
    db.commit()
    for m in new_mappings:
        db.refresh(m)
    return new_mappings


@app.get("/api/teams/{team_id}/epics", response_model=List[schemas.Epic])
def get_epics(team_id: int, db: Session = Depends(get_db)):
    return db.query(models.Epic).filter(models.Epic.team_id == team_id).order_by(models.Epic.priority).all()


@app.post("/api/teams/{team_id}/epics", response_model=schemas.Epic)
def create_epic(team_id: int, epic: schemas.EpicCreate, db: Session = Depends(get_db)):
    db_epic = models.Epic(team_id=team_id, **epic.model_dump())
    db.add(db_epic)
    db.commit()
    db.refresh(db_epic)
    return db_epic


@app.patch("/api/epics/{epic_id}", response_model=schemas.Epic)
def update_epic(epic_id: int, epic_update: schemas.EpicUpdate, db: Session = Depends(get_db)):
    epic = db.query(models.Epic).filter(models.Epic.id == epic_id).first()
    if not epic:
        raise HTTPException(status_code=404, detail="Epic not found")
    
    update_data = epic_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(epic, field, value)
    
    epic.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(epic)
    return epic


@app.delete("/api/epics/{epic_id}")
def delete_epic(epic_id: int, db: Session = Depends(get_db)):
    epic = db.query(models.Epic).filter(models.Epic.id == epic_id).first()
    if not epic:
        raise HTTPException(status_code=404, detail="Epic not found")
    db.delete(epic)
    db.commit()
    return {"message": "Epic deleted"}


@app.put("/api/teams/{team_id}/epics/reorder")
def reorder_epics(team_id: int, request: schemas.ReorderRequest, db: Session = Depends(get_db)):
    for idx, epic_id in enumerate(request.epic_ids):
        epic = db.query(models.Epic).filter(models.Epic.id == epic_id, models.Epic.team_id == team_id).first()
        if epic:
            epic.priority = idx
    db.commit()
    return {"message": "Epics reordered"}


@app.get("/api/teams/{team_id}/jira/config", response_model=schemas.JiraConfig)
def get_jira_config(team_id: int, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    config = db.query(models.IntegrationConfig).filter(
        models.IntegrationConfig.team_id == team_id,
        models.IntegrationConfig.integration_type == "jira"
    ).first()
    
    from server_python.jira_service import jira_service
    
    if config:
        return schemas.JiraConfig(
            project_key=config.config.get("project_key"),
            default_issue_type=config.config.get("default_issue_type", "Epic"),
            size_field=config.config.get("size_field"),
            sync_enabled=config.config.get("sync_enabled", False),
            is_configured=jira_service.is_configured
        )
    
    return schemas.JiraConfig(is_configured=jira_service.is_configured)


@app.put("/api/teams/{team_id}/jira/config", response_model=schemas.JiraConfig)
def save_jira_config(team_id: int, config_data: schemas.JiraConfigCreate, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    config = db.query(models.IntegrationConfig).filter(
        models.IntegrationConfig.team_id == team_id,
        models.IntegrationConfig.integration_type == "jira"
    ).first()
    
    config_dict = config_data.model_dump()
    
    if config:
        config.config = config_dict
    else:
        config = models.IntegrationConfig(
            team_id=team_id,
            integration_type="jira",
            config=config_dict,
            is_active=True
        )
        db.add(config)
    
    db.commit()
    db.refresh(config)
    
    from server_python.jira_service import jira_service
    
    return schemas.JiraConfig(
        **config_dict,
        is_configured=jira_service.is_configured
    )


@app.get("/api/teams/{team_id}/jira/projects", response_model=List[schemas.JiraProject])
async def get_jira_projects(team_id: int, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    from server_python.jira_service import jira_service
    
    if not jira_service.is_configured:
        raise HTTPException(status_code=503, detail="Jira not configured")
    
    return await jira_service.get_projects()


@app.get("/api/teams/{team_id}/jira/issues", response_model=List[schemas.JiraIssue])
async def get_jira_issues(
    team_id: int,
    project_key: str,
    issue_type: str = "Epic",
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    from server_python.jira_service import jira_service
    
    if not jira_service.is_configured:
        raise HTTPException(status_code=503, detail="Jira not configured")
    
    return await jira_service.get_issues(project_key, issue_type)


@app.post("/api/teams/{team_id}/jira/import", response_model=schemas.JiraImportResponse)
async def import_jira_issues(
    team_id: int,
    import_request: schemas.JiraImportRequest,
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    from server_python.jira_service import jira_service
    
    if not jira_service.is_configured:
        raise HTTPException(status_code=503, detail="Jira not configured")
    
    issues = await jira_service.get_issues(
        import_request.project_key,
        import_request.issue_type,
        import_request.jql
    )
    
    size_mappings = db.query(models.SizeMapping).filter(
        models.SizeMapping.team_id == team_id
    ).order_by(models.SizeMapping.points).all()
    
    created_epics = []
    for issue in issues:
        size = map_points_to_size(issue.story_points, size_mappings)
        
        epic = models.Epic(
            team_id=team_id,
            external_id=issue.key,
            title=issue.summary,
            description=issue.description or "",
            original_size=size,
            current_size=size,
            status="backlog",
            source="Jira",
            priority=len(created_epics)
        )
        db.add(epic)
        db.commit()
        db.refresh(epic)
        created_epics.append(epic)
    
    return schemas.JiraImportResponse(
        imported_count=len(created_epics),
        epics=created_epics
    )


def map_points_to_size(story_points: int | None, size_mappings: list) -> str:
    """Map story points to closest T-shirt size"""
    if not story_points or not size_mappings:
        return "M"
    
    closest = None
    min_diff = float('inf')
    
    for mapping in size_mappings:
        diff = abs(mapping.points - story_points)
        if diff < min_diff:
            min_diff = diff
            closest = mapping
    
    return closest.size if closest else "M"


@app.post("/api/teams/{team_id}/jira/map-points", response_model=schemas.MapPointsResponse)
def map_story_points(team_id: int, request: schemas.MapPointsRequest, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    size_mappings = db.query(models.SizeMapping).filter(
        models.SizeMapping.team_id == team_id
    ).order_by(models.SizeMapping.points).all()
    
    if not size_mappings:
        return schemas.MapPointsResponse(size="M", points=request.story_points, matched=False)
    
    exact_match = None
    closest = None
    min_diff = float('inf')
    
    for mapping in size_mappings:
        if mapping.points == request.story_points:
            exact_match = mapping
            break
        diff = abs(mapping.points - request.story_points)
        if diff < min_diff:
            min_diff = diff
            closest = mapping
    
    if exact_match:
        return schemas.MapPointsResponse(
            size=exact_match.size,
            points=exact_match.points,
            matched=True
        )
    
    return schemas.MapPointsResponse(
        size=closest.size,
        points=closest.points,
        matched=False
    )


@app.get("/api/teams/{team_id}/trello/config", response_model=schemas.TrelloConfig)
def get_trello_config(team_id: int, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    config = db.query(models.IntegrationConfig).filter(
        models.IntegrationConfig.team_id == team_id,
        models.IntegrationConfig.integration_type == "trello"
    ).first()
    
    from server_python.trello_service import trello_service
    
    if config:
        return schemas.TrelloConfig(
            board_id=config.config.get("board_id"),
            epic_label=config.config.get("epic_label", "Epic"),
            size_label_prefix=config.config.get("size_label_prefix", ""),
            sync_enabled=config.config.get("sync_enabled", False),
            is_configured=trello_service.is_configured
        )
    
    return schemas.TrelloConfig(is_configured=trello_service.is_configured)


@app.put("/api/teams/{team_id}/trello/config", response_model=schemas.TrelloConfig)
def save_trello_config(team_id: int, config_data: schemas.TrelloConfigCreate, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    config = db.query(models.IntegrationConfig).filter(
        models.IntegrationConfig.team_id == team_id,
        models.IntegrationConfig.integration_type == "trello"
    ).first()
    
    config_dict = config_data.model_dump()
    
    if config:
        config.config = config_dict
    else:
        config = models.IntegrationConfig(
            team_id=team_id,
            integration_type="trello",
            config=config_dict,
            is_active=True
        )
        db.add(config)
    
    db.commit()
    db.refresh(config)
    
    from server_python.trello_service import trello_service
    
    return schemas.TrelloConfig(
        **config_dict,
        is_configured=trello_service.is_configured
    )


@app.get("/api/teams/{team_id}/trello/boards", response_model=List[schemas.TrelloBoard])
async def get_trello_boards(team_id: int, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    from server_python.trello_service import trello_service
    
    if not trello_service.is_configured:
        raise HTTPException(status_code=503, detail="Trello not configured")
    
    boards = await trello_service.get_boards()
    return [schemas.TrelloBoard(id=b.id, name=b.name) for b in boards]


@app.get("/api/teams/{team_id}/trello/lists", response_model=List[schemas.TrelloList])
async def get_trello_lists(team_id: int, board_id: str, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    from server_python.trello_service import trello_service
    
    if not trello_service.is_configured:
        raise HTTPException(status_code=503, detail="Trello not configured")
    
    lists = await trello_service.get_lists(board_id)
    return [schemas.TrelloList(id=l.id, name=l.name) for l in lists]


@app.post("/api/teams/{team_id}/trello/import", response_model=schemas.TrelloImportResponse)
async def import_trello_cards(
    team_id: int,
    import_request: schemas.TrelloImportRequest,
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    from server_python.trello_service import trello_service
    
    if not trello_service.is_configured:
        raise HTTPException(status_code=503, detail="Trello not configured")
    
    cards = await trello_service.get_cards(
        import_request.board_id,
        import_request.list_id,
        import_request.filter_label
    )
    
    created_epics = []
    for card in cards:
        size = card.size_label or "M"
        
        epic = models.Epic(
            team_id=team_id,
            external_id=card.id,
            title=card.name,
            description=card.desc,
            original_size=size,
            current_size=size,
            status="backlog",
            source="Trello",
            priority=len(created_epics)
        )
        db.add(epic)
        db.commit()
        db.refresh(epic)
        created_epics.append(epic)
    
    return schemas.TrelloImportResponse(
        imported_count=len(created_epics),
        epics=created_epics
    )


def create_demo_team_data(db: Session) -> models.Team:
    """Create a new team with demo data for a session."""
    team = models.Team(
        name="Rocket Squad",
        avatar="https://api.dicebear.com/7.x/bottts/svg?seed=rocket",
        engineer_count=5,
        avg_points_per_engineer=8,
        sprint_length_weeks=2,
        sprints_in_increment=6
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    
    size_mappings_data = [
        {"size": "2-XS", "points": 1, "confidence": 95, "anchor_description": "Trivial change, config update"},
        {"size": "XS", "points": 2, "confidence": 90, "anchor_description": "Simple bug fix or minor enhancement"},
        {"size": "S", "points": 5, "confidence": 85, "anchor_description": "Small feature, well-understood"},
        {"size": "M", "points": 8, "confidence": 75, "anchor_description": "Medium feature, some unknowns"},
        {"size": "L", "points": 13, "confidence": 65, "anchor_description": "Large feature, multiple components"},
        {"size": "XL", "points": 21, "confidence": 50, "anchor_description": "Very large, significant complexity"},
        {"size": "2-XL", "points": 34, "confidence": 35, "anchor_description": "Epic-sized, consider breaking down"},
        {"size": "3-XL", "points": 55, "confidence": 20, "anchor_description": "Too large, must be decomposed"}
    ]
    
    for mapping_data in size_mappings_data:
        mapping = models.SizeMapping(team_id=team.id, **mapping_data)
        db.add(mapping)
    
    epics_data = [
        {"title": "User Authentication System", "description": "Implement OAuth2 login with Google and GitHub", "original_size": "L", "current_size": "L", "source": "Jira", "priority": 0},
        {"title": "Dashboard Redesign", "description": "Modernize the main dashboard with new charts", "original_size": "M", "current_size": "M", "source": "Trello", "priority": 1},
        {"title": "API Rate Limiting", "description": "Add rate limiting to prevent abuse", "original_size": "S", "current_size": "S", "source": "Jira", "priority": 2},
        {"title": "Mobile Responsive Layout", "description": "Make all pages mobile-friendly", "original_size": "L", "current_size": "L", "source": "Template", "priority": 3},
        {"title": "Search Functionality", "description": "Implement full-text search across all content", "original_size": "XL", "current_size": "XL", "source": "Jira", "priority": 4},
        {"title": "Email Notifications", "description": "Set up transactional email system", "original_size": "M", "current_size": "M", "source": "Trello", "priority": 5},
        {"title": "Data Export Feature", "description": "Allow users to export their data as CSV/JSON", "original_size": "S", "current_size": "S", "source": "Template", "priority": 6},
        {"title": "Performance Optimization", "description": "Improve page load times by 50%", "original_size": "L", "current_size": "L", "source": "Jira", "priority": 7},
    ]
    
    for epic_data in epics_data:
        epic = models.Epic(team_id=team.id, status="backlog", **epic_data)
        db.add(epic)
    
    db.commit()
    return team


def cleanup_stale_demo_sessions(db: Session, hours: int = 24):
    """Remove demo sessions older than the specified hours."""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    stale_sessions = db.query(models.DemoSession).filter(
        models.DemoSession.last_accessed < cutoff
    ).all()
    
    for session in stale_sessions:
        db.query(models.Team).filter(models.Team.id == session.team_id).delete()
    
    db.query(models.DemoSession).filter(
        models.DemoSession.last_accessed < cutoff
    ).delete()
    db.commit()


def get_demo_session(
    x_demo_session: Optional[str] = Header(None, alias="X-Demo-Session"),
    db: Session = Depends(get_db)
) -> Optional[models.DemoSession]:
    """Get demo session from header if it exists."""
    if not x_demo_session:
        return None
    
    session = db.query(models.DemoSession).filter(
        models.DemoSession.session_token == x_demo_session
    ).first()
    
    if session:
        session.last_accessed = datetime.utcnow()
        db.commit()
    
    return session


@app.post("/api/demo/session", response_model=schemas.DemoSessionResponse)
def create_demo_session(db: Session = Depends(get_db)):
    """Create a new demo session with isolated data."""
    logger.info("Creating new demo session")
    
    cleanup_stale_demo_sessions(db)
    
    team = create_demo_team_data(db)
    
    session_token = secrets.token_urlsafe(32)
    demo_session = models.DemoSession(
        session_token=session_token,
        team_id=team.id
    )
    db.add(demo_session)
    db.commit()
    db.refresh(demo_session)
    
    logger.info(f"Demo session created: token={session_token[:8]}..., team_id={team.id}")
    return schemas.DemoSessionResponse(session_token=session_token, team=team)


@app.get("/api/demo/session", response_model=schemas.DemoSessionResponse)
def get_current_demo_session(
    demo_session: Optional[models.DemoSession] = Depends(get_demo_session),
    db: Session = Depends(get_db)
):
    """Get the current demo session's team data."""
    if not demo_session:
        raise HTTPException(status_code=404, detail="No active demo session")
    
    team = db.query(models.Team).filter(models.Team.id == demo_session.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Demo team not found")
    
    return schemas.DemoSessionResponse(session_token=demo_session.session_token, team=team)


@app.delete("/api/demo/session")
def delete_demo_session(
    demo_session: Optional[models.DemoSession] = Depends(get_demo_session),
    db: Session = Depends(get_db)
):
    """Delete the current demo session and its data."""
    if not demo_session:
        raise HTTPException(status_code=404, detail="No active demo session")
    
    db.query(models.Team).filter(models.Team.id == demo_session.team_id).delete()
    db.query(models.DemoSession).filter(models.DemoSession.id == demo_session.id).delete()
    db.commit()
    
    logger.info(f"Demo session deleted: token={demo_session.session_token[:8]}...")
    return {"message": "Demo session deleted"}


@app.get("/api/demo/teams", response_model=List[schemas.Team])
def get_demo_teams(
    demo_session: Optional[models.DemoSession] = Depends(get_demo_session),
    db: Session = Depends(get_db)
):
    """Get teams scoped to the demo session."""
    if not demo_session:
        raise HTTPException(status_code=401, detail="Demo session required")
    
    teams = db.query(models.Team).filter(models.Team.id == demo_session.team_id).all()
    return teams


@app.get("/api/demo/teams/{team_id}", response_model=schemas.Team)
def get_demo_team(
    team_id: int,
    demo_session: Optional[models.DemoSession] = Depends(get_demo_session),
    db: Session = Depends(get_db)
):
    """Get a specific team in the demo session."""
    if not demo_session:
        raise HTTPException(status_code=401, detail="Demo session required")
    
    if team_id != demo_session.team_id:
        raise HTTPException(status_code=403, detail="Access denied to this team")
    
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    return team


@app.patch("/api/demo/teams/{team_id}", response_model=schemas.Team)
def update_demo_team(
    team_id: int,
    team_update: schemas.TeamUpdate,
    demo_session: Optional[models.DemoSession] = Depends(get_demo_session),
    db: Session = Depends(get_db)
):
    """Update a team in the demo session."""
    if not demo_session:
        raise HTTPException(status_code=401, detail="Demo session required")
    
    if team_id != demo_session.team_id:
        raise HTTPException(status_code=403, detail="Access denied to this team")
    
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    update_data = team_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(team, key, value)
    team.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(team)
    return team


@app.get("/api/demo/teams/{team_id}/epics", response_model=List[schemas.Epic])
def get_demo_epics(
    team_id: int,
    demo_session: Optional[models.DemoSession] = Depends(get_demo_session),
    db: Session = Depends(get_db)
):
    """Get epics for a team in the demo session."""
    if not demo_session:
        raise HTTPException(status_code=401, detail="Demo session required")
    
    if team_id != demo_session.team_id:
        raise HTTPException(status_code=403, detail="Access denied to this team")
    
    epics = db.query(models.Epic).filter(
        models.Epic.team_id == team_id
    ).order_by(models.Epic.priority).all()
    return epics


@app.post("/api/demo/teams/{team_id}/epics", response_model=schemas.Epic, status_code=status.HTTP_201_CREATED)
def create_demo_epic(
    team_id: int,
    epic_data: schemas.EpicCreate,
    demo_session: Optional[models.DemoSession] = Depends(get_demo_session),
    db: Session = Depends(get_db)
):
    """Create an epic in the demo session."""
    if not demo_session:
        raise HTTPException(status_code=401, detail="Demo session required")
    
    if team_id != demo_session.team_id:
        raise HTTPException(status_code=403, detail="Access denied to this team")
    
    max_priority = db.query(models.Epic).filter(
        models.Epic.team_id == team_id
    ).count()
    
    epic_dict = epic_data.model_dump(exclude={'priority'})
    epic = models.Epic(
        team_id=team_id,
        priority=max_priority,
        **epic_dict
    )
    db.add(epic)
    db.commit()
    db.refresh(epic)
    return epic


@app.patch("/api/demo/epics/{epic_id}", response_model=schemas.Epic)
def update_demo_epic(
    epic_id: int,
    epic_update: schemas.EpicUpdate,
    demo_session: Optional[models.DemoSession] = Depends(get_demo_session),
    db: Session = Depends(get_db)
):
    """Update an epic in the demo session."""
    if not demo_session:
        raise HTTPException(status_code=401, detail="Demo session required")
    
    epic = db.query(models.Epic).filter(models.Epic.id == epic_id).first()
    if not epic:
        raise HTTPException(status_code=404, detail="Epic not found")
    
    if epic.team_id != demo_session.team_id:
        raise HTTPException(status_code=403, detail="Access denied to this epic")
    
    update_data = epic_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(epic, key, value)
    epic.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(epic)
    return epic


@app.delete("/api/demo/epics/{epic_id}")
def delete_demo_epic(
    epic_id: int,
    demo_session: Optional[models.DemoSession] = Depends(get_demo_session),
    db: Session = Depends(get_db)
):
    """Delete an epic in the demo session."""
    if not demo_session:
        raise HTTPException(status_code=401, detail="Demo session required")
    
    epic = db.query(models.Epic).filter(models.Epic.id == epic_id).first()
    if not epic:
        raise HTTPException(status_code=404, detail="Epic not found")
    
    if epic.team_id != demo_session.team_id:
        raise HTTPException(status_code=403, detail="Access denied to this epic")
    
    db.delete(epic)
    db.commit()
    return {"message": "Epic deleted"}


@app.put("/api/demo/teams/{team_id}/epics/reorder", response_model=List[schemas.Epic])
def reorder_demo_epics(
    team_id: int,
    reorder: schemas.ReorderRequest,
    demo_session: Optional[models.DemoSession] = Depends(get_demo_session),
    db: Session = Depends(get_db)
):
    """Reorder epics in the demo session."""
    if not demo_session:
        raise HTTPException(status_code=401, detail="Demo session required")
    
    if team_id != demo_session.team_id:
        raise HTTPException(status_code=403, detail="Access denied to this team")
    
    for i, epic_id in enumerate(reorder.epic_ids):
        epic = db.query(models.Epic).filter(
            models.Epic.id == epic_id,
            models.Epic.team_id == team_id
        ).first()
        if epic:
            epic.priority = i
    
    db.commit()
    
    epics = db.query(models.Epic).filter(
        models.Epic.team_id == team_id
    ).order_by(models.Epic.priority).all()
    return epics


@app.get("/api/demo/teams/{team_id}/size-mappings", response_model=List[schemas.SizeMapping])
def get_demo_size_mappings(
    team_id: int,
    demo_session: Optional[models.DemoSession] = Depends(get_demo_session),
    db: Session = Depends(get_db)
):
    """Get size mappings for a team in the demo session."""
    if not demo_session:
        raise HTTPException(status_code=401, detail="Demo session required")
    
    if team_id != demo_session.team_id:
        raise HTTPException(status_code=403, detail="Access denied to this team")
    
    mappings = db.query(models.SizeMapping).filter(
        models.SizeMapping.team_id == team_id
    ).all()
    return mappings


@app.put("/api/demo/teams/{team_id}/size-mappings", response_model=List[schemas.SizeMapping])
def update_demo_size_mappings(
    team_id: int,
    mappings: List[schemas.SizeMappingCreate],
    demo_session: Optional[models.DemoSession] = Depends(get_demo_session),
    db: Session = Depends(get_db)
):
    """Update size mappings for a team in the demo session."""
    if not demo_session:
        raise HTTPException(status_code=401, detail="Demo session required")
    
    if team_id != demo_session.team_id:
        raise HTTPException(status_code=403, detail="Access denied to this team")
    
    db.query(models.SizeMapping).filter(models.SizeMapping.team_id == team_id).delete()
    
    new_mappings = []
    for mapping_data in mappings:
        mapping = models.SizeMapping(team_id=team_id, **mapping_data.model_dump())
        db.add(mapping)
        new_mappings.append(mapping)
    
    db.commit()
    
    for mapping in new_mappings:
        db.refresh(mapping)
    
    return new_mappings


@app.post("/api/reset-demo", response_model=schemas.ResetDemoResponse)
def reset_demo(db: Session = Depends(get_db)):
    """Legacy reset-demo endpoint - clears all teams (non-session mode)."""
    db.query(models.Team).delete()
    db.commit()
    
    team = create_demo_team_data(db)
    
    return {"team_id": team.id, "message": "Demo data reset successfully"}


if os.path.exists("dist"):
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404)
        return FileResponse("dist/index.html")
