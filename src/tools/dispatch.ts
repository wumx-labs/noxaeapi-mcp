import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSession } from "../client.js";

const SKIP_KEYS = new Set(["connect"]);

export function buildResourceMap(client: Record<string, unknown>): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(client)) {
    if (SKIP_KEYS.has(key)) continue;
    if (!value || typeof value !== "object") continue;
    const proto = Object.getPrototypeOf(value);
    if (!proto || proto === Object.prototype) continue;
    const actions = Object.getOwnPropertyNames(proto).filter(
      (name) => name !== "constructor" && typeof (value as Record<string, unknown>)[name] === "function",
    );
    if (actions.length === 0) continue;
    map[key] = actions;
  }
  return map;
}

export function registerDispatchTools(server: McpServer): void {
  server.tool(
    "noxae_list_modules",
    "List all available SDK resource modules and their executable actions (e.g. essentials, worldguard, coreprotect, discordsrv, authme, shopgui, etc.).",
    {},
    async () => {
      const session = getSession();
      try {
        const client = session.getClient();
        const map = buildResourceMap(client as unknown as Record<string, unknown>);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(map, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to list modules: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "noxae_call_action",
    "Universal executor for any NoxAeApi module action. Allows calling all integration modules shown in CLI (e.g. worldguard, coreprotect, essentials, betterteams, discordsrv, authme, playerpoints, mythicmobs, shopgui, etc.).",
    {
      module: z.string().describe("The module name (e.g. 'worldguard', 'essentials', 'coreprotect', 'betterteams', 'discordsrv', 'authme', 'shopgui')"),
      action: z.string().describe("The method name to execute on the module (use noxae_list_modules to see available actions)"),
      args: z.array(z.unknown()).optional().describe("Arguments to pass to the method"),
      nodeId: z.string().optional().describe("Target server node ID (if connected via Velocity hub, e.g. 'survival', 'lobby')"),
    },
    async ({ module: modName, action, args = [], nodeId }) => {
      const session = getSession();
      try {
        const { client, effectiveNodeId } = await session.resolveTargetClient(nodeId);
        const mod = (client as Record<string, Record<string, (...a: unknown[]) => unknown>>)[modName];
        if (!mod) {
          throw new Error(`Module '${modName}' not found on client.`);
        }
        const fn = mod[action];
        if (typeof fn !== "function") {
          throw new Error(`Action '${action}' not found on module '${modName}'.`);
        }

        const result = await fn.apply(mod, args);
        const prefix = effectiveNodeId ? `[Target Node: @${effectiveNodeId}]\n` : "";
        return {
          content: [
            {
              type: "text",
              text: prefix + JSON.stringify(result ?? "Success (void)", null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to execute ${modName}.${action}(): ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );
}
