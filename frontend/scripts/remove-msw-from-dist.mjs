import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workerPath = path.resolve(scriptDirectory, "../dist/mockServiceWorker.js");

if (existsSync(workerPath)) {
  rmSync(workerPath, { force: true });
  process.stdout.write("Removed dist/mockServiceWorker.js from production build.\n");
}
