import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSession } from "../client.js";

const SKIP_MODULES = new Set(["http", "connect"]);

export function registerAllSdkModules(
  server: McpServer,
  registeredNames: Set<string>,
): { totalModules: number; totalMethods: number; newRegistered: number } {
  const session = getSession();
  const client = session.getClient() as unknown as Record<string, unknown>;

  let totalModules = 0;
  let totalMethods = 0;
  let newRegistered = 0;

  for (const [modName, modInstance] of Object.entries(client)) {
    if (SKIP_MODULES.has(modName)) continue;
    if (!modInstance || typeof modInstance !== "object") continue;

    const proto = Object.getPrototypeOf(modInstance);
    if (!proto || proto === Object.prototype) continue;

    const actionNames = Object.getOwnPropertyNames(proto).filter(
      (name) => name !== "constructor" && typeof (modInstance as Record<string, unknown>)[name] === "function",
    );

    if (actionNames.length === 0) continue;
    totalModules++;

    for (const action of actionNames) {
      totalMethods++;
      const toolName = `${modName}_${action}`;

      // Skip if already registered with a custom hand-crafted schema
      if (registeredNames.has(toolName)) continue;

      registeredNames.add(toolName);
      newRegistered++;

      server.tool(
        toolName,
        `NoxAeApi ${modName}.${action}() action. Supports standalone server or Velocity node targeting via nodeId.`,
        {
          args: z
            .array(z.unknown())
            .optional()
            .describe(`Arguments array for ${modName}.${action}()`),
          nodeId: z
            .string()
            .optional()
            .describe("Target server node ID (e.g. 'survival', 'lobby') when connected via Velocity hub"),
        },
        async ({ args = [], nodeId }) => {
          const currentSession = getSession();
          try {
            if (currentSession.isHub && currentSession.hubClient && nodeId) {
              const forwardPath = `${modName}/${action}`;
              try {
                const res = await currentSession.hubClient.network.forward(nodeId, "POST", forwardPath, {
                  body: args.length === 1 && typeof args[0] === "object" ? args[0] : { args },
                });
                return {
                  content: [{ type: "text", text: JSON.stringify(res ?? "OK", null, 2) }],
                };
              } catch {
                const res = await currentSession.hubClient.network.forward(nodeId, "GET", forwardPath);
                return {
                  content: [{ type: "text", text: JSON.stringify(res ?? "OK", null, 2) }],
                };
              }
            }

            const activeClient = currentSession.getClient() as unknown as Record<
              string,
              Record<string, (...a: unknown[]) => unknown>
            >;
            const targetMod = activeClient[modName];
            if (!targetMod || typeof targetMod[action] !== "function") {
              throw new Error(`Method ${modName}.${action} not found on client.`);
            }

            const result = await targetMod[action].apply(targetMod, args);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result ?? "Success (void)", null, 2),
                },
              ],
            };
          } catch (err: unknown) {
            return {
              isError: true,
              content: [
                {
                  type: "text",
                  text: `Error in ${modName}.${action}(): ${err instanceof Error ? err.message : String(err)}`,
                },
              ],
            };
          }
        },
      );
    }
  }

  return { totalModules, totalMethods, newRegistered };
}
