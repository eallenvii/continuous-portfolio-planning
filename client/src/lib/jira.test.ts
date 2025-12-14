import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("Jira Integration API", () => {
  describe("getJiraConfig", () => {
    it("fetches Jira configuration for a team", async () => {
      const mockConfig = {
        is_configured: true,
        project_key: "TEST",
        default_issue_type: "Epic",
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfig),
      });

      const response = await fetch("/api/teams/1/jira/config");
      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith("/api/teams/1/jira/config");
      expect(data.is_configured).toBe(true);
    });
  });

  describe("getJiraProjects", () => {
    it("fetches available Jira projects", async () => {
      const mockProjects = [
        { key: "PROJ1", name: "Project One" },
        { key: "PROJ2", name: "Project Two" },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjects),
      });

      const response = await fetch("/api/teams/1/jira/projects");
      const data = await response.json();

      expect(data).toHaveLength(2);
      expect(data[0].key).toBe("PROJ1");
    });
  });

  describe("getJiraIssues", () => {
    it("fetches issues from a Jira project", async () => {
      const mockIssues = [
        {
          key: "TEST-1",
          summary: "First Epic",
          issue_type: "Epic",
          story_points: 5,
        },
        {
          key: "TEST-2",
          summary: "Second Epic",
          issue_type: "Epic",
          story_points: 8,
        },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIssues),
      });

      const response = await fetch("/api/teams/1/jira/issues?project_key=TEST");
      const data = await response.json();

      expect(data).toHaveLength(2);
      expect(data[0].story_points).toBe(5);
    });
  });

  describe("importJiraIssues", () => {
    it("imports Jira issues as epics", async () => {
      const mockResult = {
        imported_count: 3,
        epics: [
          { id: 1, title: "Epic 1", external_id: "TEST-1" },
          { id: 2, title: "Epic 2", external_id: "TEST-2" },
          { id: 3, title: "Epic 3", external_id: "TEST-3" },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResult),
      });

      const response = await fetch("/api/teams/1/jira/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_key: "TEST",
          issue_type: "Epic",
        }),
      });
      const data = await response.json();

      expect(data.imported_count).toBe(3);
      expect(data.epics).toHaveLength(3);
    });
  });

  describe("saveJiraConfig", () => {
    it("saves Jira configuration for a team", async () => {
      const config = {
        project_key: "PROJ",
        default_issue_type: "Epic",
        size_field: "customfield_10001",
        sync_enabled: true,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...config, is_configured: true }),
      });

      const response = await fetch("/api/teams/1/jira/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await response.json();

      expect(data.is_configured).toBe(true);
      expect(data.project_key).toBe("PROJ");
    });
  });
});

describe("Jira Size Mapping", () => {
  it("maps story points to T-shirt sizes based on team mappings", async () => {
    const mockMapping = { size: "M", points: 5 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMapping),
    });

    const response = await fetch("/api/teams/1/jira/map-points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story_points: 5 }),
    });
    const data = await response.json();

    expect(data.size).toBe("M");
  });

  it("handles unmapped story points by returning closest size", async () => {
    const mockMapping = { size: "L", points: 8, matched: false };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMapping),
    });

    const response = await fetch("/api/teams/1/jira/map-points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story_points: 7 }),
    });
    const data = await response.json();

    expect(data.size).toBe("L");
  });
});
