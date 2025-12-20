import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("API module", () => {
  describe("getTeams", () => {
    it("fetches teams from the API and transforms snake_case to camelCase", async () => {
      const apiResponse = [
        { id: 1, name: "Team A", avatar: "avatar.png", engineer_count: 5, avg_points_per_engineer: 8, sprint_length_weeks: 2, sprints_in_increment: 6 },
        { id: 2, name: "Team B", avatar: "avatar2.png", engineer_count: 4, avg_points_per_engineer: 10, sprint_length_weeks: 2, sprints_in_increment: 5 },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apiResponse),
      });

      const { getTeams } = await import("./api");
      const teams = await getTeams();
      
      expect(mockFetch).toHaveBeenCalledWith("/api/teams");
      expect(teams[0].engineerCount).toBe(5);
      expect(teams[0].avgPointsPerEngineer).toBe(8);
      expect(teams[1].sprintsInIncrement).toBe(5);
    });
  });

  describe("getTeam", () => {
    it("fetches a single team by ID and transforms snake_case to camelCase", async () => {
      const apiResponse = { id: 1, name: "Team A", avatar: "avatar.png", engineer_count: 6, avg_points_per_engineer: 8, sprint_length_weeks: 2, sprints_in_increment: 6 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apiResponse),
      });

      const { getTeam } = await import("./api");
      const team = await getTeam(1);
      
      expect(mockFetch).toHaveBeenCalledWith("/api/teams/1");
      expect(team.engineerCount).toBe(6);
      expect(team.avgPointsPerEngineer).toBe(8);
      expect(team.sprintsInIncrement).toBe(6);
    });
  });

  describe("createEpic", () => {
    it("posts a new epic to the API and transforms response", async () => {
      const apiResponse = {
        id: 1,
        title: "New Epic",
        description: "",
        original_size: "M",
        current_size: "M",
        status: "backlog",
        source: "Jira",
        priority: 0,
        is_template: false,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apiResponse),
      });

      const { createEpic } = await import("./api");
      const epicData = {
        title: "New Epic",
        originalSize: "M",
        currentSize: "M",
        source: "Jira",
      };
      const result = await createEpic(1, epicData as any);
      
      expect(mockFetch).toHaveBeenCalledWith("/api/teams/1/epics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.any(String),
      });
      expect(result.originalSize).toBe("M");
      expect(result.currentSize).toBe("M");
      expect(result.isTemplate).toBe(false);
    });
  });
});
