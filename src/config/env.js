import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");
const envPath = path.join(projectRoot, ".env");

function parseEnvLine(line) {
  const trimmedLine = line.trim();

  if (!trimmedLine || trimmedLine.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmedLine.indexOf("=");

  if (separatorIndex === -1) {
    return null;
  }

  const key = trimmedLine.slice(0, separatorIndex).trim();
  const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");

  return { key, value };
}

export function loadEnvFile() {
  if (!existsSync(envPath)) {
    return;
  }

  const fileContent = readFileSync(envPath, "utf8");

  for (const line of fileContent.split(/\r?\n/)) {
    const parsedLine = parseEnvLine(line);

    if (parsedLine && !process.env[parsedLine.key]) {
      process.env[parsedLine.key] = parsedLine.value;
    }
  }
}

export function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
