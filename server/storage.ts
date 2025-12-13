import { 
  type Team, type InsertTeam,
  type SizeMapping, type InsertSizeMapping,
  type Epic, type InsertEpic,
  type PlanningSnapshot, type InsertPlanningSnapshot,
  type IntegrationConfig, type InsertIntegrationConfig,
  teams, sizeMappings, epics, planningSnapshots, integrationConfigs
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Teams
  getTeam(id: number): Promise<Team | undefined>;
  getAllTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<void>;

  // Size Mappings
  getSizeMappingsByTeamId(teamId: number): Promise<SizeMapping[]>;
  createSizeMapping(mapping: InsertSizeMapping): Promise<SizeMapping>;
  updateSizeMapping(id: number, mapping: Partial<InsertSizeMapping>): Promise<SizeMapping | undefined>;
  deleteSizeMappingsByTeamId(teamId: number): Promise<void>;

  // Epics
  getEpicsByTeamId(teamId: number): Promise<Epic[]>;
  getEpic(id: number): Promise<Epic | undefined>;
  createEpic(epic: InsertEpic): Promise<Epic>;
  updateEpic(id: number, epic: Partial<InsertEpic>): Promise<Epic | undefined>;
  deleteEpic(id: number): Promise<void>;
  reorderEpics(teamId: number, epicIds: number[]): Promise<void>;

  // Planning Snapshots
  getSnapshotsByTeamId(teamId: number): Promise<PlanningSnapshot[]>;
  createSnapshot(snapshot: InsertPlanningSnapshot): Promise<PlanningSnapshot>;
  deleteSnapshot(id: number): Promise<void>;

  // Integration Configs
  getIntegrationConfigsByTeamId(teamId: number): Promise<IntegrationConfig[]>;
  createIntegrationConfig(config: InsertIntegrationConfig): Promise<IntegrationConfig>;
  updateIntegrationConfig(id: number, config: Partial<InsertIntegrationConfig>): Promise<IntegrationConfig | undefined>;
  deleteIntegrationConfig(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Teams
  async getTeam(id: number): Promise<Team | undefined> {
    const result = await db.select().from(teams).where(eq(teams.id, id));
    return result[0];
  }

  async getAllTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const result = await db.insert(teams).values(team).returning();
    return result[0];
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined> {
    const result = await db
      .update(teams)
      .set({ ...team, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return result[0];
  }

  async deleteTeam(id: number): Promise<void> {
    await db.delete(teams).where(eq(teams.id, id));
  }

  // Size Mappings
  async getSizeMappingsByTeamId(teamId: number): Promise<SizeMapping[]> {
    return await db.select().from(sizeMappings).where(eq(sizeMappings.teamId, teamId));
  }

  async createSizeMapping(mapping: InsertSizeMapping): Promise<SizeMapping> {
    const result = await db.insert(sizeMappings).values(mapping).returning();
    return result[0];
  }

  async updateSizeMapping(id: number, mapping: Partial<InsertSizeMapping>): Promise<SizeMapping | undefined> {
    const result = await db
      .update(sizeMappings)
      .set(mapping)
      .where(eq(sizeMappings.id, id))
      .returning();
    return result[0];
  }

  async deleteSizeMappingsByTeamId(teamId: number): Promise<void> {
    await db.delete(sizeMappings).where(eq(sizeMappings.teamId, teamId));
  }

  // Epics
  async getEpicsByTeamId(teamId: number): Promise<Epic[]> {
    return await db.select().from(epics).where(eq(epics.teamId, teamId)).orderBy(epics.priority);
  }

  async getEpic(id: number): Promise<Epic | undefined> {
    const result = await db.select().from(epics).where(eq(epics.id, id));
    return result[0];
  }

  async createEpic(epic: InsertEpic): Promise<Epic> {
    const result = await db.insert(epics).values(epic).returning();
    return result[0];
  }

  async updateEpic(id: number, epic: Partial<InsertEpic>): Promise<Epic | undefined> {
    const result = await db
      .update(epics)
      .set({ ...epic, updatedAt: new Date() })
      .where(eq(epics.id, id))
      .returning();
    return result[0];
  }

  async deleteEpic(id: number): Promise<void> {
    await db.delete(epics).where(eq(epics.id, id));
  }

  async reorderEpics(teamId: number, epicIds: number[]): Promise<void> {
    await db.transaction(async (tx: typeof db) => {
      for (let i = 0; i < epicIds.length; i++) {
        await tx
          .update(epics)
          .set({ priority: i })
          .where(and(eq(epics.id, epicIds[i]), eq(epics.teamId, teamId)));
      }
    });
  }

  // Planning Snapshots
  async getSnapshotsByTeamId(teamId: number): Promise<PlanningSnapshot[]> {
    return await db.select().from(planningSnapshots).where(eq(planningSnapshots.teamId, teamId)).orderBy(desc(planningSnapshots.createdAt));
  }

  async createSnapshot(snapshot: InsertPlanningSnapshot): Promise<PlanningSnapshot> {
    const result = await db.insert(planningSnapshots).values(snapshot).returning();
    return result[0];
  }

  async deleteSnapshot(id: number): Promise<void> {
    await db.delete(planningSnapshots).where(eq(planningSnapshots.id, id));
  }

  // Integration Configs
  async getIntegrationConfigsByTeamId(teamId: number): Promise<IntegrationConfig[]> {
    return await db.select().from(integrationConfigs).where(eq(integrationConfigs.teamId, teamId));
  }

  async createIntegrationConfig(config: InsertIntegrationConfig): Promise<IntegrationConfig> {
    const result = await db.insert(integrationConfigs).values(config).returning();
    return result[0];
  }

  async updateIntegrationConfig(id: number, config: Partial<InsertIntegrationConfig>): Promise<IntegrationConfig | undefined> {
    const result = await db
      .update(integrationConfigs)
      .set(config)
      .where(eq(integrationConfigs.id, id))
      .returning();
    return result[0];
  }

  async deleteIntegrationConfig(id: number): Promise<void> {
    await db.delete(integrationConfigs).where(eq(integrationConfigs.id, id));
  }
}

export const storage = new DatabaseStorage();
