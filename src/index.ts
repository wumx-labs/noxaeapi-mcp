import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { resolveConfig } from "./config.js";
import { registerNetworkTools } from "./tools/network.js";
import { registerServerTools } from "./tools/server.js";
import { registerPlayerTools } from "./tools/players.js";
import { registerLuckPermsTools } from "./tools/luckperms.js";
import { registerEconomyTools } from "./tools/economy.js";
import { registerWorldTools } from "./tools/worlds.js";
import { registerPluginTools } from "./tools/plugins.js";
import { registerDispatchTools } from "./tools/dispatch.js";
import { registerLeaderboardTools } from "./tools/leaderboard.js";
import { registerAllSdkModules } from "./tools/auto-register.js";
import { getSession } from "./client.js";

async function main() {
  try {
    const config = resolveConfig();
    console.error(
      `[noxaeapi-mcp] Loaded profile: "${config.profileName}" (hub=${config.hub}, url=${config.baseUrl})`,
    );
  } catch (err: unknown) {
    console.error(
      `[noxaeapi-mcp] Notice: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const server = new McpServer({
    name: "noxaeapi-mcp",
    version: "1.0.0",
  });

  const registeredNames = new Set<string>();

  // Helper function to track names
  const track = (names: string[]) => names.forEach((n) => registeredNames.add(n));

  // 1. Register specialized tools with rich parameter validation
  registerNetworkTools(server);
  track([
    "network_status_all",
    "network_node_status",
    "network_broadcast",
    "network_find_player",
    "network_send_player",
  ]);

  registerServerTools(server);
  track([
    "server_get_status",
    "server_dispatch_command",
    "server_broadcast",
    "server_get_whitelist",
    "server_whitelist_add",
    "server_whitelist_remove",
    "server_get_ops",
    "server_op_player",
    "server_deop_player",
    "server_get_logs",
    "server_restart",
    "server_ban_ip",
    "server_tell_player",
  ]);

  registerPlayerTools(server);
  track([
    "players_list_online",
    "players_get_info",
    "players_kick",
    "players_ban",
    "players_unban",
    "players_set_gamemode",
  ]);

  registerLuckPermsTools(server);
  track([
    "luckperms_get_player_info",
    "luckperms_add_player_permission",
    "luckperms_remove_player_permission",
    "luckperms_set_player_primary_group",
    "luckperms_list_groups",
  ]);

  registerEconomyTools(server);
  track([
    "economy_info",
    "economy_get_balance",
    "economy_pay",
    "economy_debit",
    "economy_get_top",
    "economy_list_currencies",
    "economy_get_currency_top",
  ]);

  registerLeaderboardTools(server);
  track([
    "leaderboards_list",
    "leaderboards_get_top",
  ]);

  registerWorldTools(server);
  track([
    "worlds_list",
    "worlds_set_time",
    "worlds_set_weather",
    "worlds_get_entities",
  ]);

  registerPluginTools(server);
  track([
    "plugins_list",
    "plugins_get_info",
  ]);

  // 2. Register dynamic reflection dispatcher
  registerDispatchTools(server);
  track(["noxae_list_modules", "noxae_call_action"]);

  // 3. Automatically register 100% of ALL SDK modules and actions
  const stats = registerAllSdkModules(server, registeredNames);
  console.error(
    `[noxaeapi-mcp] Registered 100% of SDK: ${stats.totalModules} modules, ${registeredNames.size} total tools active.`,
  );

  // 4. Register MCP SysAdmin Prompt for intelligent decision-making
  server.prompt(
    "minecraft_sysadmin",
    "Expert guidelines and decision trees for AI agents operating Minecraft servers and Velocity networks via NoxAeApi.",
    {},
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `You are an expert Minecraft DevOps and Server Administrator assistant operating with NoxAeApi.
Follow these operational guidelines to make accurate, reliable decisions:

1. ENVIRONMENT & TOPOLOGY:
   - When connected to a Velocity Network Hub proxy, multiple backend server nodes exist (e.g. CSMP, LOBBY).
   - Use 'network_status_all' to discover active nodes, player counts, and node health.
   - For node-specific actions (players, economy, leaderboards, commands, worlds), always supply the 'nodeId' parameter (e.g. 'CSMP').

2. ECONOMY & BALANCE DECISION TREE:
   - For primary money/Vault balance: use 'economy_get_top' (richest players) and 'economy_get_balance' (individual balance).
   - For custom currencies (CoinsEngine, ExcellentEconomy): use 'economy_list_currencies' to find IDs, and 'economy_get_currency_top' for rankings.
   - DO NOT use generic placeholder boards for money. Always prefer the dedicated 'economy_*' tools.

3. LEADERBOARD DECISION TREE:
   - For gameplay rankings (kills, deaths, playtime, mcmmo, auraskills): use 'leaderboards_get_top' with IDs like 'player:kills', 'player:deaths', 'player:playtime'.
   - Use 'leaderboards_list' to discover valid game stats (it automatically filters internal noise).

4. PERFORMANCE & DIAGNOSTICS:
   - For lag or TPS inquiries: call 'server_get_status'. TPS: 20.0 is perfect, <18.0 is lagging.
   - For errors or console activity: call 'server_get_logs'.

5. COMMANDS & SAFETY:
   - For executing commands: call 'server_dispatch_command' without the leading slash.
   - For player permissions: call 'luckperms_add_player_permission' or 'luckperms_remove_player_permission'.`,
          },
        },
      ],
    }),
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[noxaeapi-mcp] Server running on stdio ready for AI agents");
}

main().catch((err) => {
  console.error("[noxaeapi-mcp] Fatal error:", err);
  process.exit(1);
});
