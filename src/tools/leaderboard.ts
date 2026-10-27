import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSession } from "../client.js";

const NOISY_BOARD_PATTERNS = [
  /^ajlb:.*prevent-type.*/i,
  /^ajlb:citizens\..*/i,
  /^ajlb:commands\..*/i,
  /^ajlb:loading\..*/i,
  /^ajlb:updater\..*/i,
  /^ajlb:formatted\..*/i,
  /^ajlb:no-data\..*/i,
  /^ajlb:signs\..*/i,
  /^ajlb:no-player-skin.*/i,
  /^ajlb:time\..*/i,
  /^ajlb:[0-9a-z]$/i,
  /^ajlb:java\..*/i,
  /^ajlb:essentials\..*/i,
];

export function registerLeaderboardTools(server: McpServer): void {
  server.tool(
    "leaderboards_list",
    "List all available gameplay leaderboard rankings on the server (e.g. player:kills, player:deaths, player:playtime, mcmmo:power, auraskills:power). Automatically filters out internal plugin noise. Note: For economy and balances, prefer the dedicated economy_* tools.",
    {
      includeNoisy: z
        .boolean()
        .optional()
        .describe("If true, includes internal plugin placeholder keys (default false)"),
      nodeId: z
        .string()
        .optional()
        .describe("Target server node ID (e.g. 'CSMP', 'LOBBY') when connected via Velocity hub"),
    },
    async ({ includeNoisy = false, nodeId }) => {
      const session = getSession();
      try {
        const { client, effectiveNodeId } = await session.resolveTargetClient(nodeId);
        if (!client?.leaderboards?.list) {
          throw new Error("Leaderboards module is not available on this connection.");
        }

        const rawList = await client.leaderboards.list();
        let filtered = rawList;

        if (!includeNoisy && Array.isArray(rawList)) {
          filtered = rawList.filter((entry: any) => {
            const id = entry?.id || "";
            return !NOISY_BOARD_PATTERNS.some((pattern) => pattern.test(id));
          });
        }

        const prefix = effectiveNodeId ? `[Target Node: @${effectiveNodeId}]\n` : "";
        return {
          content: [
            {
              type: "text",
              text: prefix + JSON.stringify(filtered, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to list leaderboards: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "leaderboards_get_top",
    "Get top ranking players for a specific gameplay leaderboard (e.g. 'player:kills', 'player:deaths', 'player:playtime', 'mcmmo:power', 'auraskills:power'). Note: For money/balances, always use economy_get_top or economy_get_currency_top.",
    {
      board: z
        .string()
        .describe("The leaderboard source ID (e.g. 'player:kills', 'player:deaths', 'player:playtime', 'mcmmo:power')"),
      limit: z
        .number()
        .optional()
        .describe("Number of top players to return (default 10, max 100)"),
      nodeId: z
        .string()
        .optional()
        .describe("Target server node ID (e.g. 'CSMP', 'LOBBY') when connected via Velocity hub"),
    },
    async ({ board, limit = 10, nodeId }) => {
      const session = getSession();
      try {
        const { client, effectiveNodeId } = await session.resolveTargetClient(nodeId);
        const prefix = effectiveNodeId ? `[Target Node: @${effectiveNodeId}]\n` : "";

        // Smart Interception: Redirect economy queries to fast native Vault economy
        const cleanBoard = board.trim();
        if (
          cleanBoard === "economy:vault" ||
          cleanBoard === "economy:money" ||
          cleanBoard === "money" ||
          cleanBoard === "vault" ||
          cleanBoard === "balance" ||
          cleanBoard === "ajlb:vault_eco_balance"
        ) {
          if (client.economy?.getTopBalance) {
            const entries = await client.economy.getTopBalance(limit);
            const formatted = (entries || []).map((e: any, idx: number) => ({
              rank: idx + 1,
              name: e.name || e.uuid,
              value: typeof e.balance === "number" ? e.balance : e.value,
              uuid: e.uuid,
            }));
            return {
              content: [
                {
                  type: "text",
                  text: `${prefix}[Intercepted -> Native Vault Economy Top]\n` + JSON.stringify(formatted, null, 2),
                },
              ],
            };
          }
        }

        // Custom currency detection (e.g. economy:coins or economy:candy or simply "coins", "candy")
        const customCurMatch = cleanBoard.startsWith("economy:")
          ? cleanBoard.replace("economy:", "")
          : (["coins", "candy", "tokens", "point", "points"].includes(cleanBoard.toLowerCase()) ? cleanBoard.toLowerCase() : null);
        if (customCurMatch && customCurMatch !== "vault" && client.economy?.getCurrencyTop) {
          try {
            const res = await client.economy.getCurrencyTop(customCurMatch, limit);
            if (Array.isArray(res) && res.length > 0) {
              return {
                content: [
                  {
                    type: "text",
                    text: `${prefix}[Native Currency Top: ${customCurMatch}]\n` + JSON.stringify(res, null, 2),
                  },
                ],
              };
            }
          } catch {}
        }

        if (!client.leaderboards?.getTop) {
          throw new Error("Leaderboard client module is not available on this connection.");
        }

        const entries = await client.leaderboards.getTop(cleanBoard, limit);
        return {
          content: [
            {
              type: "text",
              text: prefix + JSON.stringify(entries, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to get leaderboard '${board}': ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );
}
