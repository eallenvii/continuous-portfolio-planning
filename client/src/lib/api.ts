import { Team, Epic, SizeMapping, PlanningSnapshot, IntegrationConfig } from "@shared/schema";

const API_BASE = "/api";

// Teams
export async function getTeams(): Promise<Team[]> {
  const res = await fetch(`${API_BASE}/teams`);
  if (!res.ok) throw new Error("Failed to fetch teams");
  return res.json();
}

export async function getTeam(id: number): Promise<Team> {
  const res = await fetch(`${API_BASE}/teams/${id}`);
  if (!res.ok) throw new Error("Failed to fetch team");
  return res.json();
}

export async function updateTeam(id: number, data: Partial<Team>): Promise<Team> {
  const res = await fetch(`${API_BASE}/teams/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update team");
  return res.json();
}

// Size Mappings
export async function getSizeMappings(teamId: number): Promise<SizeMapping[]> {
  const res = await fetch(`${API_BASE}/teams/${teamId}/size-mappings`);
  if (!res.ok) throw new Error("Failed to fetch size mappings");
  return res.json();
}

export async function updateSizeMappings(teamId: number, mappings: Array<Omit<SizeMapping, "id" | "teamId">>): Promise<SizeMapping[]> {
  const res = await fetch(`${API_BASE}/teams/${teamId}/size-mappings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mappings),
  });
  if (!res.ok) throw new Error("Failed to update size mappings");
  return res.json();
}

// Epics
export async function getEpics(teamId: number): Promise<Epic[]> {
  const res = await fetch(`${API_BASE}/teams/${teamId}/epics`);
  if (!res.ok) throw new Error("Failed to fetch epics");
  return res.json();
}

export async function createEpic(teamId: number, epic: Partial<Epic>): Promise<Epic> {
  const res = await fetch(`${API_BASE}/teams/${teamId}/epics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(epic),
  });
  if (!res.ok) throw new Error("Failed to create epic");
  return res.json();
}

export async function updateEpic(id: number, epic: Partial<Epic>): Promise<Epic> {
  const res = await fetch(`${API_BASE}/epics/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(epic),
  });
  if (!res.ok) throw new Error("Failed to update epic");
  return res.json();
}

export async function reorderEpics(teamId: number, epicIds: number[]): Promise<void> {
  const res = await fetch(`${API_BASE}/teams/${teamId}/epics/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ epicIds }),
  });
  if (!res.ok) throw new Error("Failed to reorder epics");
}

export async function deleteEpic(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/epics/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete epic");
}

// Demo
export async function resetDemo(): Promise<{ teamId: number }> {
  const res = await fetch(`${API_BASE}/demo/reset`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to reset demo");
  return res.json();
}
