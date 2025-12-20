import { Team, Epic, SizeMapping, PlanningSnapshot, IntegrationConfig } from "@shared/schema";
import { logApiRequest, logApiResponse, logApiError } from "./logger";

const API_BASE = "/api";

// Transform snake_case API response to camelCase for frontend
function transformTeam(data: any): Team {
  return {
    id: data.id,
    name: data.name,
    avatar: data.avatar,
    engineerCount: data.engineer_count ?? data.engineerCount ?? 0,
    avgPointsPerEngineer: data.avg_points_per_engineer ?? data.avgPointsPerEngineer ?? 0,
    sprintLengthWeeks: data.sprint_length_weeks ?? data.sprintLengthWeeks ?? 2,
    sprintsInIncrement: data.sprints_in_increment ?? data.sprintsInIncrement ?? 0,
    createdAt: data.created_at ?? data.createdAt,
    updatedAt: data.updated_at ?? data.updatedAt,
  };
}

function transformSizeMapping(data: any): SizeMapping {
  return {
    id: data.id,
    teamId: data.team_id ?? data.teamId,
    size: data.size,
    points: data.points ?? 0,
    confidence: data.confidence ?? 80,
    anchorDescription: data.anchor_description ?? data.anchorDescription ?? "",
  };
}

function transformEpic(data: any): Epic {
  return {
    id: data.id,
    teamId: data.team_id ?? data.teamId,
    externalId: data.external_id ?? data.externalId,
    title: data.title,
    description: data.description ?? "",
    originalSize: data.original_size ?? data.originalSize ?? "M",
    currentSize: data.current_size ?? data.currentSize ?? "M",
    status: data.status ?? "backlog",
    source: data.source ?? "Template",
    priority: data.priority ?? 0,
    isTemplate: data.is_template ?? data.isTemplate ?? false,
    createdAt: data.created_at ?? data.createdAt,
    updatedAt: data.updated_at ?? data.updatedAt,
  };
}

async function apiRequest<T>(method: string, url: string, body?: unknown): Promise<T> {
  logApiRequest(method, url, body);
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    logApiResponse(method, url, res.status, data);
    if (!res.ok) {
      const error = new Error(data?.detail || `Request failed: ${res.status}`);
      logApiError(method, url, error);
      throw error;
    }
    return data;
  } catch (error) {
    logApiError(method, url, error);
    throw error;
  }
}

// Teams
export async function getTeams(): Promise<Team[]> {
  const res = await fetch(`${API_BASE}/teams`);
  if (!res.ok) throw new Error("Failed to fetch teams");
  const data = await res.json();
  return data.map(transformTeam);
}

export async function getTeam(id: number): Promise<Team> {
  const res = await fetch(`${API_BASE}/teams/${id}`);
  if (!res.ok) throw new Error("Failed to fetch team");
  const data = await res.json();
  return transformTeam(data);
}

export async function updateTeam(id: number, data: Partial<Team> | Record<string, any>): Promise<Team> {
  const res = await fetch(`${API_BASE}/teams/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update team");
  const result = await res.json();
  return transformTeam(result);
}

// Size Mappings
export async function getSizeMappings(teamId: number): Promise<SizeMapping[]> {
  const res = await fetch(`${API_BASE}/teams/${teamId}/size-mappings`);
  if (!res.ok) throw new Error("Failed to fetch size mappings");
  const data = await res.json();
  return data.map(transformSizeMapping);
}

export async function updateSizeMappings(teamId: number, mappings: Array<Record<string, any>>): Promise<SizeMapping[]> {
  const res = await fetch(`${API_BASE}/teams/${teamId}/size-mappings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mappings),
  });
  if (!res.ok) throw new Error("Failed to update size mappings");
  const data = await res.json();
  return data.map(transformSizeMapping);
}

// Epics
export async function getEpics(teamId: number): Promise<Epic[]> {
  const res = await fetch(`${API_BASE}/teams/${teamId}/epics`);
  if (!res.ok) throw new Error("Failed to fetch epics");
  const data = await res.json();
  return data.map(transformEpic);
}

export async function createEpic(teamId: number, epic: Partial<Epic> | Record<string, any>): Promise<Epic> {
  const payload = {
    title: epic.title,
    description: epic.description ?? "",
    original_size: epic.originalSize ?? (epic as any).original_size ?? "M",
    current_size: epic.currentSize ?? (epic as any).current_size ?? "M",
    status: epic.status ?? "backlog",
    source: epic.source ?? "Template",
    priority: epic.priority ?? 0,
    is_template: epic.isTemplate ?? (epic as any).is_template ?? false,
  };
  const res = await fetch(`${API_BASE}/teams/${teamId}/epics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create epic");
  const data = await res.json();
  return transformEpic(data);
}

export async function updateEpic(id: number, epic: Partial<Epic> | Record<string, any>): Promise<Epic> {
  const payload: Record<string, any> = {};
  if (epic.title !== undefined) payload.title = epic.title;
  if (epic.description !== undefined) payload.description = epic.description;
  if (epic.originalSize !== undefined) payload.original_size = epic.originalSize;
  if ((epic as any).original_size !== undefined) payload.original_size = (epic as any).original_size;
  if (epic.currentSize !== undefined) payload.current_size = epic.currentSize;
  if ((epic as any).current_size !== undefined) payload.current_size = (epic as any).current_size;
  if (epic.status !== undefined) payload.status = epic.status;
  if (epic.source !== undefined) payload.source = epic.source;
  if (epic.priority !== undefined) payload.priority = epic.priority;
  if (epic.isTemplate !== undefined) payload.is_template = epic.isTemplate;
  
  const res = await fetch(`${API_BASE}/epics/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update epic");
  const data = await res.json();
  return transformEpic(data);
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

// Auth
export interface AuthUser {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export async function signup(email: string, password: string, firstName?: string, lastName?: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Signup failed");
  }
  return res.json();
}

export async function login(email: string, password: string): Promise<AuthToken> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Invalid email or password");
  }
  return res.json();
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}

export async function logout(token: string): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}
