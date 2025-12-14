import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from server_python.database import get_db, engine, Base
from server_python import models
from server_python import schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Continuous Portfolio Planning API")


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


@app.post("/api/reset-demo", response_model=schemas.ResetDemoResponse)
def reset_demo(db: Session = Depends(get_db)):
    db.query(models.Team).delete()
    db.commit()
    
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
    
    return {"team_id": team.id, "message": "Demo data reset successfully"}


if os.path.exists("dist"):
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404)
        return FileResponse("dist/index.html")
