import type { Express } from "express";
import { createServer, type Server } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.use("/api", createProxyMiddleware({
    target: "http://localhost:8000",
    changeOrigin: true,
  }));

  const httpServer = createServer(app);
  return httpServer;
}
