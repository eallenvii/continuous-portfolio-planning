import type { Express } from "express";
import { createServer, type Server } from "http";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.use("/api", createProxyMiddleware({
    target: "http://localhost:8000",
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req, res) => {
        proxyReq.path = '/api' + proxyReq.path;
        fixRequestBody(proxyReq, req);
      },
      error: (err, req, res) => {
        console.error('Proxy error:', err.message);
        if ('writeHead' in res && typeof res.writeHead === 'function') {
          (res as any).writeHead(504, { 'Content-Type': 'application/json' });
          (res as any).end(JSON.stringify({ error: 'Python backend unavailable' }));
        }
      }
    }
  }));

  const httpServer = createServer(app);
  return httpServer;
}
