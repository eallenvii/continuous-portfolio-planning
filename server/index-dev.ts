import fs from "node:fs";
import { type Server } from "node:http";
import path from "node:path";
import { spawn, ChildProcess } from "node:child_process";

import type { Express } from "express";
import { nanoid } from "nanoid";
import { createServer as createViteServer, createLogger } from "vite";

import runApp from "./app";

import viteConfig from "../vite.config";

const viteLogger = createLogger();

let pythonProcess: ChildProcess | null = null;

function startPythonBackend() {
  const logLevel = process.env.LOG_LEVEL || 'DEBUG';
  console.log(`[python] Starting Python backend with LOG_LEVEL=${logLevel}...`);
  
  pythonProcess = spawn('python', ['-m', 'uvicorn', 'server_python.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'], {
    env: { ...process.env, LOG_LEVEL: logLevel },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  pythonProcess.stdout?.on('data', (data) => {
    const lines = data.toString().split('\n').filter((line: string) => line.trim());
    lines.forEach((line: string) => console.log(`[python] ${line}`));
  });

  pythonProcess.stderr?.on('data', (data) => {
    const lines = data.toString().split('\n').filter((line: string) => line.trim());
    lines.forEach((line: string) => console.error(`[python] ${line}`));
  });

  pythonProcess.on('close', (code) => {
    console.log(`[python] Python process exited with code ${code}`);
    if (code !== 0 && code !== null) {
      console.log('[python] Restarting Python backend in 2 seconds...');
      setTimeout(startPythonBackend, 2000);
    }
  });

  pythonProcess.on('error', (err) => {
    console.error('[python] Failed to start Python backend:', err.message);
  });
}

process.on('exit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
});

process.on('SIGINT', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
  process.exit();
});

process.on('SIGTERM', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
  process.exit();
});

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

(async () => {
  startPythonBackend();
  await new Promise(resolve => setTimeout(resolve, 2000));
  await runApp(setupVite);
})();
