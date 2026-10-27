import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface Profile {
  baseUrl: string;
  apiKey?: string;
  hub?: boolean;
}

export interface CliConfigFile {
  current: string | null;
  profiles: Record<string, Profile>;
}

export interface ResolvedConfig {
  baseUrl: string;
  apiKey?: string;
  hub: boolean;
  profileName: string;
}

const CONFIG_PATH = join(homedir(), ".noxaeapi-cli", "config.json");

export function loadCliConfig(): CliConfigFile {
  if (!existsSync(CONFIG_PATH)) {
    return { current: null, profiles: {} };
  }
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as CliConfigFile;
  } catch {
    return { current: null, profiles: {} };
  }
}

export function parseArgs(): Record<string, string | boolean> {
  const args = process.argv.slice(2);
  const parsed: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--hub") {
      parsed.hub = true;
    } else if (arg.startsWith("--") && i + 1 < args.length && !args[i + 1].startsWith("--")) {
      parsed[arg.slice(2)] = args[++i];
    } else if (arg.startsWith("--")) {
      parsed[arg.slice(2)] = true;
    }
  }

  return parsed;
}

export function resolveConfig(): ResolvedConfig {
  const args = parseArgs();
  const env = process.env;

  // 1. Explicit CLI arguments take highest precedence
  if (args.url && typeof args.url === "string") {
    return {
      baseUrl: args.url,
      apiKey: typeof args.key === "string" ? args.key : undefined,
      hub: args.hub === true,
      profileName: "custom (via flags)",
    };
  }

  // 2. Profile name from CLI arg or ENV
  const cliConfig = loadCliConfig();
  const requestedProfileName =
    (typeof args.profile === "string" ? args.profile : null) ??
    env.NOXAEAPI_PROFILE ??
    cliConfig.current;

  if (requestedProfileName && cliConfig.profiles[requestedProfileName]) {
    const prof = cliConfig.profiles[requestedProfileName];
    return {
      baseUrl: prof.baseUrl,
      apiKey: prof.apiKey,
      hub: Boolean(prof.hub),
      profileName: requestedProfileName,
    };
  }

  // 3. General ENV variables
  const envUrl = env.NOXAEAPI_HUB_BASE_URL ?? env.NOXAEAPI_BASE_URL;
  if (envUrl) {
    return {
      baseUrl: envUrl,
      apiKey: env.NOXAEAPI_HUB_KEY ?? env.NOXAEAPI_KEY,
      hub: env.NOXAEAPI_HUB === "true" || Boolean(env.NOXAEAPI_HUB_BASE_URL),
      profileName: "environment variables",
    };
  }

  // Fallback defaults or error
  throw new Error(
    "No NoxAeApi configuration found. Please run `noxae connect` in noxaeapi-cli, or provide --url <url>, or set NOXAEAPI_BASE_URL env variable.",
  );
}
