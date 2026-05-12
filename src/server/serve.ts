import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RepoProfile } from "../types.js";

export type ServeOptions = {
  port: number;
  apiPort: number;
  openBrowser: boolean;
};

export async function serveProfile(profile: RepoProfile, options: ServeOptions): Promise<void> {
  const apiServer = http.createServer((request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    if (request.url === "/api/profile") {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(JSON.stringify(profile));
      return;
    }
    response.statusCode = 404;
    response.end("Not found");
  });

  await new Promise<void>((resolve, reject) => {
    apiServer.once("error", reject);
    apiServer.listen(options.apiPort, "127.0.0.1", () => {
      apiServer.off("error", reject);
      resolve();
    });
  });

  const frontendPath = findFrontendPath();
  const child = spawn(
    "npm",
    ["--prefix", frontendPath, "run", "dev", "--", "--host", "127.0.0.1", "--port", String(options.port)],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        VITE_REPOTOUR_API_URL: `http://127.0.0.1:${options.apiPort}/api/profile`,
      },
    },
  );

  const url = `http://127.0.0.1:${options.port}`;
  if (options.openBrowser) openBrowser(url);
  process.stderr.write(`repotour: API ready at http://127.0.0.1:${options.apiPort}/api/profile\n`);
  process.stderr.write(`repotour: frontend starting at ${url}\n`);

  await new Promise<void>((resolve) => {
    child.on("exit", () => {
      apiServer.close();
      resolve();
    });
  });
}

function openBrowser(url: string): void {
  const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  const child = spawn(command, args, { stdio: "ignore", detached: true });
  child.unref();
}

function findFrontendPath(): string {
  const base = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(process.cwd(), "frontend"),
    path.resolve(base, "..", "frontend"),
    path.resolve(base, "..", "..", "frontend"),
  ];
  const found = candidates.find((candidate) => fs.existsSync(path.join(candidate, "package.json")));
  return found ?? candidates[0] ?? "frontend";
}
