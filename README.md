# @wumx-labs/noxaeapi-mcp

[![npm version](https://img.shields.io/npm/v/@wumx-labs/noxaeapi-mcp?color=blue&style=flat-square)](https://www.npmjs.com/package/@wumx-labs/noxaeapi-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-purple.svg?style=flat-square)](https://modelcontextprotocol.io)
[![NoxAeApi Core](https://img.shields.io/badge/NoxAeApi-v1.5.1-emerald.svg?style=flat-square)](https://github.com/wumx-labs)

Official **Model Context Protocol (MCP)** server for **NoxAeApi**.

Connect your Minecraft servers and Velocity proxy networks directly to any AI agent (**Claude Desktop**, **Claude Code**, **Cursor**, **Windsurf**, **Antigravity**, **Cline**, **Roo Code**) using natural language.

---

## 🌟 Key Features

* **🌐 Velocity Network Hub & Standalone Servers**: Monitor network topology, broadcast announcements, find players across proxy hubs, and seamlessly route commands to backend nodes (e.g. `CSMP`, `LOBBY`).
* **⚡ Server Health & TPS Diagnostics**: Real-time TPS metrics (1m, 5m, 15m), RAM/memory allocation, uptime, and console log inspection.
* **👥 Player Management**: Track online players, inspect inventory/gamemode/coordinates, kick, ban, unban, and toggle whitelists.
* **🛡️ LuckPerms Permissions**: Inspect user permissions, view inherited parent groups, grant/revoke permissions with expiry, and assign primary groups.
* **💰 Multi-Currency & Vault Economy**: Native Vault balance queries, richest player rankings, custom currency leaderboards (Coins, Candy, Gems), deposits, and debits.
* **🏆 Gameplay Leaderboards**: Query high-speed in-memory leaderboards (`player:kills`, `player:deaths`, `player:playtime`, `mcmmo:power`) with automatic noise filtration.
* **🌍 Worlds & Weather**: List loaded worlds, adjust in-game time (`day`, `night`, ticks), set weather (`clear`, `rain`, `thunder`), and view entity counts.
* **🔌 Plugin Ecosystem Integration**: Built-in support for CoreProtect, WorldGuard, EssentialsX, BetterTeams, DiscordSRV, PlayerPoints, MythicMobs, ShopGUI+, and TAB.
* **🤖 Autonomous AI Sysadmin**: Embedded `minecraft_sysadmin` decision tree guides AI models to execute operations accurately and safely without hallucination.

---

## 🚀 Quick Start & Client Configuration

You do **not** need to manually clone or compile this repository. Run it instantly via `npx`.

### 1. Claude Desktop

Add this configuration to your `claude_desktop_config.json`:

* **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
* **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "noxaeapi": {
      "command": "npx",
      "args": ["-y", "@wumx-labs/noxaeapi-mcp"]
    }
  }
}
```

> **Tip:** If you have multiple profiles saved via `noxaeapi-cli`, specify the profile using the `NOXAEAPI_PROFILE` environment variable:
> ```json
> {
>   "mcpServers": {
>     "noxaeapi": {
>       "command": "npx",
>       "args": ["-y", "@wumx-labs/noxaeapi-mcp"],
>       "env": {
>         "NOXAEAPI_PROFILE": "calm"
>       }
>     }
>   }
> }
> ```

---

### 2. Cursor / Windsurf

Go to **Settings** ➔ **MCP Servers** ➔ **Add New MCP Server**:

* **Name**: `noxaeapi`
* **Type**: `command`
* **Command**: `npx -y @wumx-labs/noxaeapi-mcp`

Or in `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "noxaeapi": {
      "command": "npx",
      "args": ["-y", "@wumx-labs/noxaeapi-mcp"]
    }
  }
}
```

---

### 3. Claude Code CLI

Add the MCP server directly using the Claude CLI:

```bash
claude mcp add noxaeapi -- npx -y @wumx-labs/noxaeapi-mcp
```

---

### 4. Cline / Roo Code (VS Code Extension)

Add this under the `mcpServers` object in your settings:

```json
{
  "noxaeapi": {
    "command": "npx",
    "args": ["-y", "@wumx-labs/noxaeapi-mcp"],
    "disabled": false,
    "alwaysAllow": []
  }
}
```

---

## ⚙️ Configuration & Environment Variables

`noxaeapi-mcp` automatically detects your active profile from `~/.noxaeapi-cli/config.json`. You can also configure it directly via CLI arguments or environment variables:

### Direct Connection (Standalone or Hub)
```bash
# Connect directly to a standalone Paper/Spigot server:
npx @wumx-labs/noxaeapi-mcp --url http://127.0.0.1:8080 --key your-api-key

# Connect directly to a Velocity Network Hub proxy:
npx @wumx-labs/noxaeapi-mcp --url http://127.0.0.1:19135 --key your-hub-key --hub
```

### Supported Environment Variables
| Variable | Description |
| :--- | :--- |
| `NOXAEAPI_PROFILE` | Select a specific profile name saved in `noxaeapi-cli` |
| `NOXAEAPI_BASE_URL` | Base URL of your NoxAeApi server (e.g. `http://216.163.186.103:12005`) |
| `NOXAEAPI_KEY` | API key configured in NoxAeApi `config.yml` |
| `NOXAEAPI_HUB` | Set to `"true"` if connecting to a Velocity network hub |
| `NOXAEAPI_HUB_BASE_URL` | Base URL for hub connection (auto-enables hub mode) |
| `NOXAEAPI_HUB_KEY` | API Key for hub connection |

---

## 🛠️ Available MCP Tools

### 🌐 Network (Velocity Hub)
* `network_status_all` — Live status, TPS, and player count across all backend nodes.
* `network_node_status` — Detailed metrics for a specific node ID.
* `network_broadcast` — Broadcast announcement across all servers.
* `network_find_player` — Locate which server node a player is currently on.
* `network_send_player` — Transfer/teleport player between server nodes.

### 🖥️ Server Diagnostics & Controls
* `server_get_status` — TPS (1m, 5m, 15m), RAM/memory usage, uptime, version.
* `server_dispatch_command` — Execute console commands safely (without leading `/`).
* `server_get_logs` — Retrieve recent console logs and error traces.
* `server_get_whitelist` / `server_whitelist_add` / `server_whitelist_remove` — Whitelist management.
* `server_get_ops` / `server_op_player` / `server_deop_player` — Operator management.
* `server_restart` — Restart the target server instance.

### 👥 Player Subsystem
* `players_list_online` — List active players with ping, health, and location.
* `players_get_info` — Detailed player profile (gamemode, inventory, coordinates).
* `players_kick` / `players_ban` / `players_unban` — Moderation controls.
* `players_set_gamemode` — Switch player gamemodes (survival, creative, spectator, adventure).

### 💰 Economy & Leaderboards
* `economy_get_top` — Richest player leaderboard (Vault balances or custom currencies).
* `economy_get_balance` — Query individual player balances.
* `economy_list_currencies` — Discover custom currencies (Coins, Candy, Tokens).
* `economy_get_currency_top` — Rankings for custom currencies.
* `economy_pay` / `economy_debit` — Deposit or deduct currency.
* `leaderboards_list` — Discover active gameplay leaderboards (noise-filtered).
* `leaderboards_get_top` — Top rankings for kills, deaths, playtime, etc.

### 🛡️ Permissions & Plugins
* `luckperms_get_player_info` — View assigned permissions and group hierarchy.
* `luckperms_add_player_permission` / `luckperms_remove_player_permission` — Modify player permissions.
* `luckperms_set_player_primary_group` — Change player primary group.
* `plugins_list` / `plugins_get_info` — Inspect installed plugins and versions.
* `worlds_list` / `worlds_set_time` / `worlds_set_weather` — World environment controls.
* `noxae_call_action` — Universal dynamic reflection caller for 16+ Minecraft plugin APIs.

---

## 📜 License

MIT License © 2026 [wumx-labs](https://github.com/wumx-labs).
