from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from server_python.database import Base

T_SHIRT_SIZES = ['2-XS', 'XS', 'S', 'M', 'L', 'XL', '2-XL', '3-XL']
EPIC_STATUSES = ['backlog', 'in-progress', 'completed']
EPIC_SOURCES = ['Jira', 'Trello', 'Template']


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    avatar = Column(Text, nullable=False)
    engineer_count = Column(Integer, nullable=False, default=5)
    avg_points_per_engineer = Column(Integer, nullable=False, default=8)
    sprint_length_weeks = Column(Integer, nullable=False, default=2)
    sprints_in_increment = Column(Integer, nullable=False, default=6)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    size_mappings = relationship("SizeMapping", back_populates="team", cascade="all, delete-orphan")
    epics = relationship("Epic", back_populates="team", cascade="all, delete-orphan")
    planning_snapshots = relationship("PlanningSnapshot", back_populates="team", cascade="all, delete-orphan")
    integration_configs = relationship("IntegrationConfig", back_populates="team", cascade="all, delete-orphan")


class SizeMapping(Base):
    __tablename__ = "size_mappings"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    size = Column(Text, nullable=False)
    points = Column(Integer, nullable=False)
    confidence = Column(Integer, nullable=False)
    anchor_description = Column(Text, nullable=False)

    team = relationship("Team", back_populates="size_mappings")


class Epic(Base):
    __tablename__ = "epics"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    external_id = Column(Text, nullable=True)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=False, default="")
    original_size = Column(Text, nullable=False)
    current_size = Column(Text, nullable=False)
    status = Column(Text, nullable=False, default="backlog")
    source = Column(Text, nullable=False)
    is_template = Column(Boolean, default=False)
    priority = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    team = relationship("Team", back_populates="epics")


class PlanningSnapshot(Base):
    __tablename__ = "planning_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    planning_increment = Column(Text, nullable=False)
    snapshot_data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    team = relationship("Team", back_populates="planning_snapshots")


class IntegrationConfig(Base):
    __tablename__ = "integration_configs"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    integration_type = Column(Text, nullable=False)
    config = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    team = relationship("Team", back_populates="integration_configs")
