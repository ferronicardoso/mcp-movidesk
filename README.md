# MCP Server for Movidesk

[![Docker Publish](https://github.com/ferronicardoso/mcp-movidesk/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/ferronicardoso/mcp-movidesk/actions/workflows/docker-publish.yml)
[![GHCR](https://img.shields.io/badge/ghcr.io-mcp--movidesk-2496ED?logo=docker&logoColor=white)](https://github.com/ferronicardoso/mcp-movidesk/pkgs/container/mcp-movidesk)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](package.json)

MCP server for interacting with the Movidesk public API via natural language, exposing ticket and person/organization operations to MCP hosts (Claude Desktop, VS Code, Cursor, and compatible clients).

## Features

- List, search, create, and update tickets (`/tickets` and `/tickets/past`)
- Upload attachments to ticket actions (`/ticketFileUpload`)
- List, search, create, and update persons/organizations (`/persons`)
- OData filter support (`$filter`, `$select`, `$expand`, `$orderby`, `$top`, `$skip`) on listing tools
- Error handling that forwards the error body returned by the Movidesk API

## Available Tools

| Tool | Description |
|---|---|
| `list_tickets` | Lists tickets updated in the last 90 days, with optional OData filters |
| `list_tickets_past` | Lists tickets last updated more than 90 days ago (`/tickets/past`) |
| `get_ticket` | Fetches a ticket by `id` or `protocol` |
| `create_ticket` | Creates a new ticket |
| `update_ticket` | Updates an existing ticket, including notes/replies via `actions` |
| `upload_ticket_attachment` | Uploads a local file as an attachment to a ticket action |
| `list_persons` | Lists persons/organizations, with optional OData filters |
| `get_person` | Fetches a person/organization by `id` |
| `create_person` | Creates a new person/organization |
| `update_person` | Updates an existing person/organization |

## Requirements

- Node.js 18+
- Movidesk API token (generated in the Movidesk admin panel: Settings → Workspace → API Token)

## Configuration

The authentication token can be provided via environment variable or command-line argument. When both are provided, the argument takes precedence.

| Variable / Argument | Required | Description |
|---|---|---|
| `MOVIDESK_TOKEN` | Yes* | Movidesk API token |
| `--token` | Yes* | Alternative to `MOVIDESK_TOKEN`, via command-line argument |

\* One of the two is required.

The API base URL (`https://api.movidesk.com/public/v1`) is fixed and not configurable.

**Security:** prefer `MOVIDESK_TOKEN` via `env` for continuous use. `--token` is visible in process listings (`ps`, task manager) and is recommended only for one-off manual testing.

| Variable | Required | Default | Description |
|---|---|---|---|
| `MCP_TRANSPORT` | No | `stdio` | Transport mode: `stdio` (default, for `npx`/Claude Desktop/VS Code) or `http` (Streamable HTTP, for Docker/remote clients such as n8n) |
| `MCP_HTTP_PORT` | No | `3003` | Port for the HTTP server (only used when `MCP_TRANSPORT=http`) |
| `MCP_HTTP_HOST` | No | `0.0.0.0` | Bind address for the HTTP server (only used when `MCP_TRANSPORT=http`) |

## Usage

### Run directly from GitHub

```bash
npx github:ferronicardoso/mcp-movidesk
```

### Claude Code (CLI)

```bash
claude mcp add movidesk --scope user -- npx -y github:ferronicardoso/mcp-movidesk
```

`--scope` controls where the server registration is stored:

| Scope | Stored in | Visible to |
|---|---|---|
| `local` (default) | project-local, untracked | only you, only in this project |
| `project` | `.mcp.json` at the project root | anyone who clones the repo (commit it to share) |
| `user` | your global Claude Code config | you, across every project |

Environment variables can be passed with repeated `--env KEY=VALUE` flags before the `--`, e.g.:

**Bash (Linux/macOS/WSL):**

```bash
claude mcp add movidesk --scope user \
  --env MOVIDESK_TOKEN=your-token-here \
  -- npx -y github:ferronicardoso/mcp-movidesk
```

**PowerShell:**

```powershell
claude mcp add movidesk --scope user `
  --env MOVIDESK_TOKEN=your-token-here `
  -- npx -y github:ferronicardoso/mcp-movidesk
```

### Codex CLI

**Bash (Linux/macOS/WSL):**

```bash
codex mcp add movidesk \
  --env MOVIDESK_TOKEN=your-token-here \
  npx -- -y github:ferronicardoso/mcp-movidesk
```

**PowerShell:**

```powershell
codex mcp add movidesk `
  --env MOVIDESK_TOKEN=your-token-here `
  npx -- -y github:ferronicardoso/mcp-movidesk
```

This registers the server in `~/.codex/config.toml`. To remove it, run `codex mcp remove movidesk`.

### Claude Desktop configuration

`%APPDATA%\\Claude\\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "movidesk": {
      "command": "npx",
      "args": ["github:ferronicardoso/mcp-movidesk"],
      "env": {
        "MOVIDESK_TOKEN": "your-token-here"
      }
    }
  }
}
```

### VS Code MCP configuration

`.vscode/mcp.json`:

```json
{
  "servers": {
    "movidesk": {
      "command": "npx",
      "args": ["github:ferronicardoso/mcp-movidesk"],
      "env": {
        "MOVIDESK_TOKEN": "your-token-here"
      }
    }
  }
}
```

### Run with Docker (HTTP transport)

The published image runs in Streamable HTTP mode by default, for use as a remote MCP endpoint (e.g. from n8n's MCP Client Tool node or any Streamable HTTP-compatible client):

**Bash (Linux/macOS/WSL):**

```bash
docker run -d --name mcp-movidesk \
  -p 3003:3003 \
  -e MOVIDESK_TOKEN=your-token-here \
  ghcr.io/ferronicardoso/mcp-movidesk:latest
```

**PowerShell:**

```powershell
docker run -d --name mcp-movidesk `
  -p 3003:3003 `
  -e MOVIDESK_TOKEN=your-token-here `
  ghcr.io/ferronicardoso/mcp-movidesk:latest
```

The MCP endpoint is then available at `http://localhost:3003/mcp`.

## Local Development

```bash
git clone https://github.com/ferronicardoso/mcp-movidesk
cd mcp-movidesk
npm install
npm run build
```

Start the compiled server:

```bash
MOVIDESK_TOKEN=your-token-here npm start
```

## Build and Commit Workflow

This repository intentionally tracks `dist/` to support `npx github:user/repo` usage.

The project uses a Husky `pre-commit` hook to:
1. build TypeScript (`npm run build`)
2. stage generated artifacts (`git add dist`)

Manual fallback:

```bash
npm run build
git add dist
```

## Security Notes

- Never commit the real token or `.env` files.
- Use `MOVIDESK_TOKEN` via environment for continuous use; avoid `--token` outside of one-off testing.
- The API's 10 requests/minute limit applies from 7:01 AM to 6:59 PM; outside that window access is unrestricted.

## License

[MIT](LICENSE) © Raphael Augusto Ferroni Cardoso
