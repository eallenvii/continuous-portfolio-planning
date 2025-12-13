import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTeamSchema, insertEpicSchema, insertSizeMappingSchema,
  insertPlanningSnapshotSchema, insertIntegrationConfigSchema,
  type Team, type Epic
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ===== TEAMS =====
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team" });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const parsed = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(parsed);
      res.status(201).json(team);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create team" });
    }
  });

  app.patch("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const team = await storage.updateTeam(id, req.body);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to update team" });
    }
  });

  app.delete("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTeam(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete team" });
    }
  });

  // ===== SIZE MAPPINGS =====
  app.get("/api/teams/:teamId/size-mappings", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const mappings = await storage.getSizeMappingsByTeamId(teamId);
      res.json(mappings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch size mappings" });
    }
  });

  app.post("/api/teams/:teamId/size-mappings", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const parsed = insertSizeMappingSchema.parse({ ...req.body, teamId });
      const mapping = await storage.createSizeMapping(parsed);
      res.status(201).json(mapping);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create size mapping" });
    }
  });

  app.patch("/api/size-mappings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mapping = await storage.updateSizeMapping(id, req.body);
      if (!mapping) {
        return res.status(404).json({ error: "Size mapping not found" });
      }
      res.json(mapping);
    } catch (error) {
      res.status(500).json({ error: "Failed to update size mapping" });
    }
  });

  // Bulk update size mappings for a team
  app.put("/api/teams/:teamId/size-mappings", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const mappings = req.body as Array<{ size: string; points: number; confidence: number; anchorDescription: string }>;
      
      // Delete existing mappings and recreate
      await storage.deleteSizeMappingsByTeamId(teamId);
      const created: any[] = [];
      for (const mapping of mappings) {
        const parsed = insertSizeMappingSchema.parse({ ...mapping, teamId });
        const createdMapping = await storage.createSizeMapping(parsed);
        created.push(createdMapping);
      }
      res.json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update size mappings" });
    }
  });

  // ===== EPICS =====
  app.get("/api/teams/:teamId/epics", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const epics = await storage.getEpicsByTeamId(teamId);
      res.json(epics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch epics" });
    }
  });

  app.post("/api/teams/:teamId/epics", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const parsed = insertEpicSchema.parse({ ...req.body, teamId });
      const epic = await storage.createEpic(parsed);
      res.status(201).json(epic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create epic" });
    }
  });

  app.patch("/api/epics/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const epic = await storage.updateEpic(id, req.body);
      if (!epic) {
        return res.status(404).json({ error: "Epic not found" });
      }
      res.json(epic);
    } catch (error) {
      res.status(500).json({ error: "Failed to update epic" });
    }
  });

  app.delete("/api/epics/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEpic(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete epic" });
    }
  });

  // Reorder epics
  app.post("/api/teams/:teamId/epics/reorder", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { epicIds } = req.body as { epicIds: number[] };
      await storage.reorderEpics(teamId, epicIds);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reorder epics" });
    }
  });

  // ===== PLANNING SNAPSHOTS =====
  app.get("/api/teams/:teamId/snapshots", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const snapshots = await storage.getSnapshotsByTeamId(teamId);
      res.json(snapshots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch snapshots" });
    }
  });

  app.post("/api/teams/:teamId/snapshots", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const parsed = insertPlanningSnapshotSchema.parse({ ...req.body, teamId });
      const snapshot = await storage.createSnapshot(parsed);
      res.status(201).json(snapshot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create snapshot" });
    }
  });

  app.delete("/api/snapshots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSnapshot(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete snapshot" });
    }
  });

  // ===== INTEGRATION CONFIGS =====
  app.get("/api/teams/:teamId/integrations", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const configs = await storage.getIntegrationConfigsByTeamId(teamId);
      res.json(configs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch integration configs" });
    }
  });

  app.post("/api/teams/:teamId/integrations", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const parsed = insertIntegrationConfigSchema.parse({ ...req.body, teamId });
      const config = await storage.createIntegrationConfig(parsed);
      res.status(201).json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create integration config" });
    }
  });

  app.patch("/api/integrations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const config = await storage.updateIntegrationConfig(id, req.body);
      if (!config) {
        return res.status(404).json({ error: "Integration config not found" });
      }
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to update integration config" });
    }
  });

  app.delete("/api/integrations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteIntegrationConfig(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete integration config" });
    }
  });

  // ===== SEED/DEMO DATA =====
  app.post("/api/demo/reset", async (req, res) => {
    try {
      // Create a demo team with default settings
      const team = await storage.createTeam({
        name: "Rocket Squad",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rocket",
        engineerCount: 6,
        avgPointsPerEngineer: 8,
        sprintLengthWeeks: 2,
        sprintsInIncrement: 6,
      });

      // Create default size mappings
      const sizeMappingData = [
        { size: '2-XS' as const, points: 3, confidence: 95, anchorDescription: '1 FTE @ 1 week' },
        { size: 'XS' as const, points: 8, confidence: 90, anchorDescription: '1 FTE @ 2 weeks' },
        { size: 'S' as const, points: 20, confidence: 85, anchorDescription: '2 FTEs @ 1 sprint' },
        { size: 'M' as const, points: 40, confidence: 80, anchorDescription: 'Full team @ 1 sprint' },
        { size: 'L' as const, points: 100, confidence: 70, anchorDescription: 'Multi-sprint feature' },
        { size: 'XL' as const, points: 250, confidence: 60, anchorDescription: 'Quarterly initiative' },
        { size: '2-XL' as const, points: 500, confidence: 40, anchorDescription: 'Multi-quarter initiative' },
        { size: '3-XL' as const, points: 1000, confidence: 20, anchorDescription: 'Yearly initiative' },
      ];

      for (const mapping of sizeMappingData) {
        await storage.createSizeMapping({ ...mapping, teamId: team.id });
      }

      // Create demo epics
      const epicData = [
        { title: 'SSO Implementation', description: 'Integrate with Okta', originalSize: 'M' as const, currentSize: 'M' as const, source: 'Jira' as const, priority: 0 },
        { title: 'Mobile App Refactor', description: 'Convert to React Native', originalSize: 'XL' as const, currentSize: 'XL' as const, source: 'Jira' as const, priority: 1 },
        { title: 'User Dashboard', description: 'New analytics widgets', originalSize: 'S' as const, currentSize: 'S' as const, source: 'Trello' as const, priority: 2 },
        { title: 'Email Notifications', description: 'SendGrid integration', originalSize: 'XS' as const, currentSize: 'XS' as const, source: 'Jira' as const, priority: 3 },
        { title: 'Performance Audit', description: 'Lighthouse score improvement', originalSize: '2-XS' as const, currentSize: '2-XS' as const, source: 'Template' as const, priority: 4, isTemplate: true },
        { title: 'Infrastructure Migration', description: 'Move to AWS', originalSize: 'L' as const, currentSize: 'L' as const, source: 'Jira' as const, priority: 5 },
        { title: 'Admin Panel V2', description: 'Internal tools update', originalSize: 'M' as const, currentSize: 'M' as const, source: 'Trello' as const, priority: 6 },
      ];

      for (const epic of epicData) {
        await storage.createEpic({ ...epic, teamId: team.id });
      }

      res.json({ message: "Demo data created successfully", teamId: team.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to create demo data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
