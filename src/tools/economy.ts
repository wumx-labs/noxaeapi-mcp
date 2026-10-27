import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSession } from "../client.js";

async function resolveUuid(
  client: any,
  playerOrUuid: string,
): Promise<string> {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerOrUuid)) {
    return playerOrUuid;
  }
  try {
    if (client.players?.resolve) {
      const res = await client.players.resolve(playerOrUuid);
      return res.uuid;
    }
  } catch {}
  return playerOrUuid;
}

export function registerEconomyTools(server: McpServer): void {
  server.tool(
    "economy_info",
    "Get information about the economy provider/plugin installed on the server.",
    {
      nodeId: z
        .string()
        .optional()
        .describe("Target server node ID (e.g. 'CSMP', 'LOBBY') when connected via Velocity hub"),
    },
    async ({ nodeId }) => {
      const session = getSession();
      try {
        const { client, effectiveNodeId } = await session.resolveTargetClient(nodeId);
        const result = await client.economy.info();
        const prefix = effectiveNodeId ? `[Target Node: @${effectiveNodeId}]\n` : "";
        return {
          content: [{ type: "text", text: prefix + JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to get economy info: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "economy_get_balance",
    "Get the economy balance for a player (supports Vault default money and custom currencies).",
    {
      player: z.string().describe("Player username or UUID"),
      currency: z
        .string()
        .optional()
        .describe("Currency ID (e.g. 'coins', 'candy'). Leave empty for primary Vault balance."),
      nodeId: z
        .string()
        .optional()
        .describe("Target server node ID (e.g. 'CSMP', 'LOBBY') when connected via Velocity hub"),
    },
    async ({ player, currency, nodeId }) => {
      const session = getSession();
      try {
        const { client, effectiveNodeId } = await session.resolveTargetClient(nodeId);
        const uuid = await resolveUuid(client, player);
        let result: unknown;
        if (currency && client.economy.getCurrencyBalance) {
          result = await client.economy.getCurrencyBalance(currency, uuid);
        } else {
          result = await client.economy.getBalance(uuid);
        }
        const prefix = effectiveNodeId ? `[Target Node: @${effectiveNodeId}]\n` : "";
        return {
          content: [{ type: "text", text: prefix + JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to get balance for '${player}': ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "economy_get_top",
    "Get the leaderboard of richest players by Vault/server default balance. Runs in < 0.1ms with zero lag.",
    {
      limit: z
        .number()
        .optional()
        .describe("Maximum number of players to return (default 10, max 100)"),
      nodeId: z
        .string()
        .optional()
        .describe("Target server node ID (e.g. 'CSMP', 'LOBBY') when connected via Velocity hub"),
    },
    async ({ limit = 10, nodeId }) => {
      const session = getSession();
      try {
        const { client, effectiveNodeId } = await session.resolveTargetClient(nodeId);
        const result = await client.economy.getTopBalance(limit);
        const prefix = effectiveNodeId ? `[Target Node: @${effectiveNodeId}]\n` : "";
        return {
          content: [{ type: "text", text: prefix + JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to get top balances: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "economy_list_currencies",
    "List all custom currencies configured on the server (e.g. coins, candy, gems).",
    {
      nodeId: z
        .string()
        .optional()
        .describe("Target server node ID (e.g. 'CSMP', 'LOBBY') when connected via Velocity hub"),
    },
    async ({ nodeId }) => {
      const session = getSession();
      try {
        const { client, effectiveNodeId } = await session.resolveTargetClient(nodeId);
        if (!client.economy?.listCurrencies) {
          return { content: [{ type: "text", text: "Multi-currency module not available." }] };
        }
        const currencies = await client.economy.listCurrencies();
        const prefix = effectiveNodeId ? `[Target Node: @${effectiveNodeId}]\n` : "";
        return {
          content: [{ type: "text", text: prefix + JSON.stringify(currencies, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to list currencies: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "economy_get_currency_top",
    "Get the leaderboard of richest players for a specific custom currency (e.g. coins, candy).",
    {
      currency: z.string().describe("The currency ID (e.g. 'coins', 'candy')"),
      limit: z
        .number()
        .optional()
        .describe("Maximum number of players to return (default 10, max 100)"),
      nodeId: z
        .string()
        .optional()
        .describe("Target server node ID (e.g. 'CSMP', 'LOBBY') when connected via Velocity hub"),
    },
    async ({ currency, limit = 10, nodeId }) => {
      const session = getSession();
      try {
        const { client, effectiveNodeId } = await session.resolveTargetClient(nodeId);
        if (!client.economy?.getCurrencyTop) {
          throw new Error("Currency top balances not supported on this economy provider.");
        }
        const result = await client.economy.getCurrencyTop(currency, limit);
        const prefix = effectiveNodeId ? `[Target Node: @${effectiveNodeId}]\n` : "";
        return {
          content: [{ type: "text", text: prefix + JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to get currency top for '${currency}': ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "economy_pay",
    "Deposit / add money to a player's balance.",
    {
      player: z.string().describe("Player username or UUID"),
      amount: z.number().positive().describe("Amount to deposit"),
      currency: z
        .string()
        .optional()
        .describe("Optional currency ID for multi-currency plugins (leave blank for Vault default)"),
      nodeId: z
        .string()
        .optional()
        .describe("Target server node ID (e.g. 'CSMP', 'LOBBY') when connected via Velocity hub"),
    },
    async ({ player, amount, currency, nodeId }) => {
      const session = getSession();
      try {
        const { client, effectiveNodeId } = await session.resolveTargetClient(nodeId);
        const uuid = await resolveUuid(client, player);
        if (currency && client.economy.payCurrency) {
          await client.economy.payCurrency(currency, uuid, amount);
        } else {
          await client.economy.pay(uuid, amount);
        }
        const prefix = effectiveNodeId ? `[Target Node: @${effectiveNodeId}] ` : "";
        return {
          content: [
            {
              type: "text",
              text: `${prefix}Successfully added ${amount} ${currency || "money"} to '${player}' balance.`,
            },
          ],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to pay '${player}': ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "economy_debit",
    "Withdraw / deduct money from a player's balance.",
    {
      player: z.string().describe("Player username or UUID"),
      amount: z.number().positive().describe("Amount to deduct"),
      currency: z
        .string()
        .optional()
        .describe("Optional currency ID for multi-currency plugins (leave blank for Vault default)"),
      nodeId: z
        .string()
        .optional()
        .describe("Target server node ID (e.g. 'CSMP', 'LOBBY') when connected via Velocity hub"),
    },
    async ({ player, amount, currency, nodeId }) => {
      const session = getSession();
      try {
        const { client, effectiveNodeId } = await session.resolveTargetClient(nodeId);
        const uuid = await resolveUuid(client, player);
        if (currency && client.economy.debitCurrency) {
          await client.economy.debitCurrency(currency, uuid, amount);
        } else {
          await client.economy.debit(uuid, amount);
        }
        const prefix = effectiveNodeId ? `[Target Node: @${effectiveNodeId}] ` : "";
        return {
          content: [
            {
              type: "text",
              text: `${prefix}Successfully deducted ${amount} ${currency || "money"} from '${player}' balance.`,
            },
          ],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to debit '${player}': ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );
}
