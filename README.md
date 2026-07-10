# mcp-movidesk

[![Docker Publish](https://github.com/ferronicardoso/mcp-movidesk/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/ferronicardoso/mcp-movidesk/actions/workflows/docker-publish.yml)
[![GHCR](https://img.shields.io/badge/ghcr.io-mcp--movidesk-2496ED?logo=docker&logoColor=white)](https://github.com/ferronicardoso/mcp-movidesk/pkgs/container/mcp-movidesk)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](package.json)

MCP server para interação com a API pública do Movidesk via linguagem natural, expondo operações de tickets e de pessoas/organizações a hosts MCP (Claude Desktop, VS Code, Cursor e compatíveis).

## Features

- Listagem, busca, criação e atualização de tickets (`/tickets` e `/tickets/past`)
- Upload de anexos em ações de ticket (`/ticketFileUpload`)
- Listagem, busca, criação e atualização de pessoas/organizações (`/persons`)
- Suporte a filtros OData (`$filter`, `$select`, `$expand`, `$orderby`, `$top`, `$skip`) nas ferramentas de listagem
- Tratamento de erro que repassa o corpo de erro retornado pela API do Movidesk

## Available Tools

| Tool | Descrição |
|---|---|
| `list_tickets` | Lista tickets atualizados nos últimos 90 dias, com filtros OData opcionais |
| `list_tickets_past` | Lista tickets com atualização anterior a 90 dias (`/tickets/past`) |
| `get_ticket` | Busca um ticket por `id` ou `protocol` |
| `create_ticket` | Cria um novo ticket |
| `update_ticket` | Atualiza um ticket existente, incluindo notas/respostas via `actions` |
| `upload_ticket_attachment` | Envia um arquivo local como anexo de uma ação de ticket |
| `list_persons` | Lista pessoas/organizações, com filtros OData opcionais |
| `get_person` | Busca uma pessoa/organização por `id` |
| `create_person` | Cria uma nova pessoa/organização |
| `update_person` | Atualiza uma pessoa/organização existente |

## Requirements

- Node.js 18+
- Token de API do Movidesk (gerado no painel admin do Movidesk: Configurações → Espaço de trabalho → Token de API)

## Configuration

O token de autenticação pode ser informado por variável de ambiente ou por argumento de linha de comando. Quando os dois forem informados, o argumento prevalece.

| Variável / Argumento | Obrigatório | Descrição |
|---|---|---|
| `MOVIDESK_TOKEN` | Sim* | Token de API do Movidesk |
| `--token` | Sim* | Alternativa ao `MOVIDESK_TOKEN`, via argumento de linha de comando |

\* Um dos dois é obrigatório.

A URL base da API (`https://api.movidesk.com/public/v1`) é fixa e não é configurável.

**Segurança:** prefira `MOVIDESK_TOKEN` via `env` para uso contínuo. `--token` fica visível em listagens de processo (`ps`, gerenciador de tarefas) e é recomendado apenas para testes manuais pontuais.

| Variável | Obrigatório | Padrão | Descrição |
|---|---|---|---|
| `MCP_TRANSPORT` | Não | `stdio` | Modo de transporte: `stdio` (padrão, para `npx`/Claude Desktop/VS Code) ou `http` (Streamable HTTP, para Docker/clientes remotos como o n8n) |
| `MCP_HTTP_PORT` | Não | `3003` | Porta do servidor HTTP (só usada quando `MCP_TRANSPORT=http`) |
| `MCP_HTTP_HOST` | Não | `0.0.0.0` | Endereço de bind do servidor HTTP (só usada quando `MCP_TRANSPORT=http`) |

## Usage

### Run directly from GitHub

```bash
npx github:ferronicardoso/mcp-movidesk
```

### Claude Desktop configuration

`%APPDATA%\\Claude\\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "movidesk": {
      "command": "npx",
      "args": ["github:ferronicardoso/mcp-movidesk"],
      "env": {
        "MOVIDESK_TOKEN": "seu-token-aqui"
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
        "MOVIDESK_TOKEN": "seu-token-aqui"
      }
    }
  }
}
```

### Rodando com Docker (transporte HTTP)

A imagem publicada roda em modo Streamable HTTP por padrão, para uso como endpoint MCP remoto (ex.: a partir do node MCP Client Tool do n8n ou qualquer cliente compatível com Streamable HTTP):

```bash
docker run -d --name mcp-movidesk \
  -p 3003:3003 \
  -e MOVIDESK_TOKEN=seu-token-aqui \
  ghcr.io/ferronicardoso/mcp-movidesk:latest
```

O endpoint MCP fica disponível em `http://localhost:3003/mcp`.

## Local Development

```bash
git clone https://github.com/ferronicardoso/mcp-movidesk
cd mcp-movidesk
npm install
npm run build
```

Start the compiled server:

```bash
MOVIDESK_TOKEN=seu-token-aqui npm start
```

## Build and Commit Workflow

Este repositório versiona `dist/` intencionalmente, para suportar o uso via `npx github:user/repo`.

O projeto usa um hook Husky `pre-commit` para:
1. compilar TypeScript (`npm run build`)
2. adicionar os artefatos gerados (`git add dist`)

Fallback manual:

```bash
npm run build
git add dist
```

## Security Notes

- Nunca commite o token real ou arquivos `.env`.
- Use `MOVIDESK_TOKEN` via ambiente para uso contínuo; evite `--token` fora de testes pontuais.
- O limite de 10 requisições/minuto da API vale das 7:01 às 18:59; fora desse horário o acesso é irrestrito.
