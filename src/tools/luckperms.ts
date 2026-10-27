import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSession } from "../client.js";

async function resolveUuid(
  client: { players: { resolve: (name: string) => Promise<{ uuid: string }> } },
  playerOrUuid: string,
): Promise<string> {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerOrUuid)) {
    return playerOrUuid;
  }
  try {
    const res = await client.players.resolve(playerOrUuid);
    return res.uuid;
  } catch {
    return playerOrUuid;
  }
}

export function registerLuckPermsTools(server: McpServer): void {
  server.tool(
    "luckperms_get_player_info",
    "Get all groups and permission nodes assigned to a player in LuckPerms.",
    {
      player: z.string().describe("Player username or UUID"),
    },
    async ({ player }) => {
      const session = getSession();
      try {
        const client = session.getClient();
        const uuid = await resolveUuid(client, player);
        const [primaryGroup, groups, permissions] = await Promise.allSettled([
          client.luckperms.getPlayerPrimaryGroup(uuid),
          client.luckperms.getPlayerGroups(uuid),
          client.luckperms.getPlayerPermissions(uuid),
        ]);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  player,
                  uuid,
                  primaryGroup: primaryGroup.status === "fulfilled" ? primaryGroup.value : null,
                  groups: groups.status === "fulfilled" ? groups.value : null,
                  permissions: permissions.status === "fulfilled" ? permissions.value : null,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to get LuckPerms info for '${player}': ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "luckperms_add_player_permission",
    "Grant a permission node to a player in LuckPerms (permanent or temporary).",
    {
      player: z.string().describe("Player username or UUID"),
      permission: z.string().describe("Permission node (e.g. 'essentials.fly', 'worldedit.*')"),
      value: z.boolean().optional().describe("Permission value: true to grant, false to negate (default: true)"),
      expiry: z.string().optional().describe("Expiry in ISO-8601 format (e.g. '2026-12-31T00:00:00Z'). Omit for permanent."),
    },
    async ({ player, permission, value, expiry }) => {
      const session = getSession();
      try {
        const client = session.getClient();
        const uuid = await resolveUuid(client, player);
        await client.luckperms.addPlayerPermission(uuid, permission, { value, expiry });
        return {
          content: [
            {
              type: "text",
              text: `Successfully granted permission '${permission}' to player '${player}' (value=${value ?? true}${expiry ? `, expires=${expiry}` : ""}).`,
            },
          ],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to add permission: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "luckperms_remove_player_permission",
    "Remove a permission node from a player in LuckPerms.",
    {
      player: z.string().describe("Player username or UUID"),
      permission: z.string().describe("Permission node to remove"),
    },
    async ({ player, permission }) => {
      const session = getSession();
      try {
        const client = session.getClient();
        const uuid = await resolveUuid(client, player);
        await client.luckperms.removePlayerPermission(uuid, permission);
        return {
          content: [
            {
              type: "text",
              text: `Successfully removed permission '${permission}' from player '${player}'.`,
            },
          ],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to remove permission: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "luckperms_set_player_primary_group",
    "Set the primary LuckPerms group for a player (e.g. 'default', 'vip', 'moderator', 'admin').",
    {
      player: z.string().describe("Player username or UUID"),
      group: z.string().describe("The name of the LuckPerms group"),
    },
    async ({ player, group }) => {
      const session = getSession();
      try {
        const client = session.getClient();
        const uuid = await resolveUuid(client, player);
        await client.luckperms.setPlayerPrimaryGroup(uuid, group);
        return {
          content: [
            {
              type: "text",
              text: `Successfully set primary group of '${player}' to '${group}'.`,
            },
          ],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to set primary group: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "luckperms_list_groups",
    "List all available permission groups configured in LuckPerms.",
    {},
    async () => {
      const session = getSession();
      try {
        const client = session.getClient();
        const groups = await client.luckperms.getGroups();
        return {
          content: [{ type: "text", text: JSON.stringify(groups, null, 2) }],
        };
      } catch (err: unknown) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to list groups: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  );
}
