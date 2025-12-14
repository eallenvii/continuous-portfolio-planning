import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("API module", () => {
  describe("getTeams", () => {
    it("fetches teams from the API", async () => {
      const mockTeams = [
        { id: 1, name: "Team A", avatar: "avatar.png" },
        { id: 2, name: "Team B", avatar: "avatar2.png" },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeams),
      });

      const { getTeams } = await import("./api");
      const teams = await getTeams();
      
      expect(mockFetch).toHaveBeenCalledWith("/api/teams");
      expect(teams).toEqual(mockTeams);
    });
  });

  describe("getTeam", () => {
    it("fetches a single team by ID", async () => {
      const mockTeam = { id: 1, name: "Team A", avatar: "avatar.png" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeam),
      });

      const { getTeam } = await import("./api");
      const team = await getTeam(1);
      
      expect(mockFetch).toHaveBeenCalledWith("/api/teams/1");
      expect(team).toEqual(mockTeam);
    });
  });

  describe("createEpic", () => {
    it("posts a new epic to the API", async () => {
      const mockEpic = {
        id: 1,
        title: "New Epic",
        original_size: "M",
        current_size: "M",
        source: "Jira",
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEpic),
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
      expect(result).toEqual(mockEpic);
    });
  });
});
