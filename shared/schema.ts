import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, serial, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const tShirtSizes = ['2-XS', 'XS', 'S', 'M', 'L', 'XL', '2-XL', '3-XL'] as const;
export const epicStatuses = ['backlog', 'in-progress', 'completed'] as const;
export const epicSources = ['Jira', 'Trello', 'Template'] as const;

// Teams Table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  avatar: text("avatar").notNull(),
  engineerCount: integer("engineer_count").notNull().default(5),
  avgPointsPerEngineer: integer("avg_points_per_engineer").notNull().default(8),
  sprintLengthWeeks: integer("sprint_length_weeks").notNull().default(2),
  sprintsInIncrement: integer("sprints_in_increment").notNull().default(6),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

// Size Mappings Table (many-to-one with teams)
export const sizeMappings = pgTable("size_mappings", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  size: text("size", { enum: tShirtSizes }).notNull(),
  points: integer("points").notNull(),
  confidence: integer("confidence").notNull(), // 0-100
  anchorDescription: text("anchor_description").notNull(),
});

export const insertSizeMappingSchema = createInsertSchema(sizeMappings).omit({
  id: true,
});

export type InsertSizeMapping = z.infer<typeof insertSizeMappingSchema>;
export type SizeMapping = typeof sizeMappings.$inferSelect;

// Epics Table
export const epics = pgTable("epics", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  externalId: text("external_id"), // Jira/Trello ID
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  originalSize: text("original_size", { enum: tShirtSizes }).notNull(),
  currentSize: text("current_size", { enum: tShirtSizes }).notNull(),
  status: text("status", { enum: epicStatuses }).notNull().default("backlog"),
  source: text("source", { enum: epicSources }).notNull(),
  isTemplate: boolean("is_template").default(false),
  priority: integer("priority").notNull().default(0), // For ordering
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEpicSchema = createInsertSchema(epics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEpic = z.infer<typeof insertEpicSchema>;
export type Epic = typeof epics.$inferSelect;

// Planning Snapshots (for "Above/Below the Line" saved states)
export const planningSnapshots = pgTable("planning_snapshots", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "Q3 2024 Final Plan"
  planningIncrement: text("planning_increment").notNull(), // e.g., "Q3 2024"
  snapshotData: jsonb("snapshot_data").notNull(), // Stores epic states, capacity, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlanningSnapshotSchema = createInsertSchema(planningSnapshots).omit({
  id: true,
  createdAt: true,
});

export type InsertPlanningSnapshot = z.infer<typeof insertPlanningSnapshotSchema>;
export type PlanningSnapshot = typeof planningSnapshots.$inferSelect;

// Integration Configurations (store Jira/Trello auth tokens per team)
export const integrationConfigs = pgTable("integration_configs", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  integrationType: text("integration_type").notNull(), // 'jira' or 'trello'
  config: jsonb("config").notNull(), // Stores API keys, project IDs, board IDs, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertIntegrationConfigSchema = createInsertSchema(integrationConfigs).omit({
  id: true,
  createdAt: true,
});

export type InsertIntegrationConfig = z.infer<typeof insertIntegrationConfigSchema>;
export type IntegrationConfig = typeof integrationConfigs.$inferSelect;
