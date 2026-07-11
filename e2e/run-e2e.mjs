import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();
const isWindows = process.platform === "win32";

const children = [];

function spawnChild(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
    ...options,
  });

  children.push(child);

  return child;
}

async function waitForUrl(url) {
  const deadline = Date.now() + 30_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for ${url}: ${String(lastError)}`);
}

async function waitForService(child, url, name) {
  await Promise.race([
    waitForUrl(url),
    once(child, "exit").then(([exitCode]) => {
      throw new Error(`${name} exited before ${url} was ready with code ${String(exitCode)}.`);
    }),
  ]);
}

async function stopChild(child) {
  if (child.exitCode !== null || child.pid === undefined) {
    return;
  }

  if (isWindows) {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
        windowsHide: true,
      });
      killer.on("exit", resolve);
      killer.on("error", resolve);
    });
    return;
  }

  child.kill("SIGTERM");
  await Promise.race([once(child, "exit"), delay(2_000)]);

  if (child.exitCode === null) {
    child.kill("SIGKILL");
  }
}

async function stopChildren() {
  await Promise.all(children.map((child) => stopChild(child)));
}

process.on("SIGINT", () => {
  void stopChildren().finally(() => process.exit(130));
});

process.on("SIGTERM", () => {
  void stopChildren().finally(() => process.exit(143));
});

try {
  const server = spawnChild(process.execPath, ["apps/server/dist/index.js"]);
  const web = spawnChild(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1"], {
    cwd: `${root}/apps/web`,
  });

  await Promise.all([
    waitForService(server, "http://127.0.0.1:3001/health", "Server"),
    waitForService(web, "http://127.0.0.1:4173", "Web preview"),
  ]);

  const playwright = spawnChild(process.execPath, ["node_modules/@playwright/test/cli.js", "test"], {
    env: { ...process.env, ITSVITAL_SKIP_PLAYWRIGHT_WEBSERVER: "1" },
  });
  const [exitCode] = await once(playwright, "exit");

  await stopChildren();
  process.exit(typeof exitCode === "number" ? exitCode : 1);
} catch (error) {
  console.error(error);
  await stopChildren();
  process.exit(1);
}
