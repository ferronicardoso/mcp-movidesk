#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { inspect } from 'node:util';
import * as movidesk from './movideskClient.js';
// ---------------------------------------------------------------------------
// Servidor MCP
// ---------------------------------------------------------------------------
const server = new Server({ name: 'mcp-movidesk', version: '1.0.0' }, { capabilities: { tools: {} } });
// Nomes de propriedade não podem começar com "$" (a API de tools exige
// `^[a-zA-Z0-9_.-]{1,64}$`); os parâmetros OData reais são montados em
// toODataQuery() a partir desses nomes sem prefixo.
const odataListProperties = {
    filter: {
        type: 'string',
        description: 'Expressão de filtro OData ($filter), ex.: "status eq \'Novo\'" ou "clients/any(c: c/id eq \'1\')"',
    },
    orderby: {
        type: 'string',
        description: 'Campo de ordenação OData ($orderby), ex.: "id desc"',
    },
    top: {
        type: 'number',
        description: 'Quantidade máxima de itens a retornar ($top, paginação)',
    },
    skip: {
        type: 'number',
        description: 'Quantidade de itens a pular ($skip, paginação)',
    },
};
const ticketListProperties = {
    ...odataListProperties,
    select: {
        type: 'string',
        description: 'Lista de campos a retornar ($select), separados por vírgula, ex.: "id,subject,status"',
    },
    expand: {
        type: 'string',
        description: 'Entidades relacionadas a expandir ($expand), ex.: "clients"',
    },
};
const personListProperties = {
    ...odataListProperties,
    select: {
        type: 'string',
        description: 'Lista de campos a retornar ($select), separados por vírgula',
    },
};
const ODATA_KEYS = ['filter', 'select', 'expand', 'orderby', 'top', 'skip'];
function toODataQuery(params) {
    const query = {};
    for (const [key, value] of Object.entries(params)) {
        query[ODATA_KEYS.includes(key) ? `$${key}` : key] = value;
    }
    return query;
}
// ---------------------------------------------------------------------------
// Definição das ferramentas
// ---------------------------------------------------------------------------
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'list_tickets',
            description: 'Lista tickets atualizados nos últimos 90 dias (rota /tickets). Para tickets mais antigos, use list_tickets_past.',
            inputSchema: {
                type: 'object',
                properties: ticketListProperties,
            },
        },
        {
            name: 'list_tickets_past',
            description: 'Lista tickets com última atualização (lastupdate) anterior a 90 dias (rota /tickets/past).',
            inputSchema: {
                type: 'object',
                properties: ticketListProperties,
            },
        },
        {
            name: 'get_ticket',
            description: 'Busca um único ticket por id ou por protocolo. Ao menos um dos dois é obrigatório.',
            inputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'number', description: 'Id do ticket' },
                    protocol: { type: 'string', description: 'Número de protocolo do ticket' },
                    includeDeletedItems: {
                        type: 'boolean',
                        description: 'Inclui ações, clientes e tickets pai/filho deletados',
                    },
                },
            },
        },
        {
            name: 'create_ticket',
            description: 'Cria um novo ticket no Movidesk (POST /tickets). Aceita os campos do ticket conforme o layout da API (type, subject, category, urgency, status, clients, actions, etc.). O campo actions permite registrar a descrição inicial (type=1 nota interna, type=2 resposta pública).',
            inputSchema: {
                type: 'object',
                properties: {
                    type: { type: 'number', description: 'Tipo do ticket' },
                    subject: { type: 'string', description: 'Assunto do ticket' },
                },
                required: ['type', 'subject'],
                additionalProperties: true,
            },
        },
        {
            name: 'update_ticket',
            description: 'Atualiza um ticket existente (PATCH /tickets?id=). Envie somente os campos a alterar. O campo actions permite adicionar notas internas (type=1) ou respostas públicas (type=2) ao ticket.',
            inputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'number', description: 'Id do ticket a atualizar' },
                },
                required: ['id'],
                additionalProperties: true,
            },
        },
        {
            name: 'upload_ticket_attachment',
            description: 'Envia um arquivo local como anexo de uma ação de ticket (POST /ticketFileUpload). Requer um caminho de arquivo existente no filesystem local.',
            inputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'number', description: 'Id do ticket' },
                    actionId: { type: 'number', description: 'Id da ação do ticket à qual o anexo será associado' },
                    filePath: { type: 'string', description: 'Caminho absoluto do arquivo local a ser enviado' },
                },
                required: ['id', 'actionId', 'filePath'],
            },
        },
        {
            name: 'list_persons',
            description: 'Lista pessoas/organizações do Movidesk (GET /persons), com suporte a filtros OData.',
            inputSchema: {
                type: 'object',
                properties: personListProperties,
            },
        },
        {
            name: 'get_person',
            description: 'Busca uma pessoa/organização específica por id (GET /persons).',
            inputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Id da pessoa/organização' },
                },
                required: ['id'],
            },
        },
        {
            name: 'create_person',
            description: 'Cria uma nova pessoa/organização (POST /persons). Contatos são informados nos arrays emails[] ({emailType, email, isDefault}) e contacts[] ({contactType, contact, isDefault}). Documento (CPF ou CNPJ) vai no campo cpfCnpj. Agentes (profileType=1) exigem accessProfile e teams.',
            inputSchema: {
                type: 'object',
                properties: {
                    isActive: { type: 'boolean', description: 'Se a pessoa/organização está ativa' },
                    personType: { type: 'number', description: '1=Pessoa física, 2=Empresa, 4=Departamento' },
                    profileType: { type: 'number', description: '1=Agente, 2=Cliente, 3=Agente e Cliente' },
                    businessName: { type: 'string', description: 'Nome ou razão social' },
                },
                required: ['isActive', 'personType', 'profileType', 'businessName'],
                additionalProperties: true,
            },
        },
        {
            name: 'update_person',
            description: 'Atualiza uma pessoa/organização existente (PATCH /persons?id=). Envie somente os campos a alterar. ATENÇÃO: enviar os arrays emails ou contacts sobrescreve a lista inteira anterior — inclua todos os itens desejados, não apenas o novo.',
            inputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Id da pessoa/organização a atualizar' },
                },
                required: ['id'],
                additionalProperties: true,
            },
        },
    ],
}));
// ---------------------------------------------------------------------------
// Implementação das ferramentas
// ---------------------------------------------------------------------------
function formatError(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    try {
        return JSON.stringify(error, null, 2);
    }
    catch {
        return inspect(error, { depth: 6, breakLength: 120 });
    }
}
function toText(value) {
    return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = (request.params ?? {});
    const params = args ?? {};
    try {
        switch (name) {
            case 'list_tickets': {
                const result = await movidesk.get('/tickets', toODataQuery(params));
                return toText(result);
            }
            case 'list_tickets_past': {
                const result = await movidesk.get('/tickets/past', toODataQuery(params));
                return toText(result);
            }
            case 'get_ticket': {
                const { id, protocol, includeDeletedItems } = params;
                if (id === undefined && !protocol) {
                    return {
                        content: [{ type: 'text', text: 'Informe "id" ou "protocol" para buscar o ticket.' }],
                        isError: true,
                    };
                }
                const result = await movidesk.get('/tickets', { id, protocol, includeDeletedItems });
                return toText(result);
            }
            case 'create_ticket': {
                const result = await movidesk.post('/tickets', params);
                return toText(result);
            }
            case 'update_ticket': {
                const { id, ...ticket } = params;
                const result = await movidesk.patch('/tickets', ticket, { id });
                return toText(result);
            }
            case 'upload_ticket_attachment': {
                const { id, actionId, filePath } = params;
                const result = await movidesk.uploadFile('/ticketFileUpload', filePath, { id, actionId });
                return toText(result);
            }
            case 'list_persons': {
                const result = await movidesk.get('/persons', toODataQuery(params));
                return toText(result);
            }
            case 'get_person': {
                const { id } = params;
                const result = await movidesk.get('/persons', { id });
                return toText(result);
            }
            case 'create_person': {
                const result = await movidesk.post('/persons', params);
                return toText(result);
            }
            case 'update_person': {
                const { id, ...person } = params;
                const result = await movidesk.patch('/persons', person, { id });
                return toText(result);
            }
            default:
                return {
                    content: [{ type: 'text', text: `Ferramenta desconhecida: ${name}` }],
                    isError: true,
                };
        }
    }
    catch (error) {
        console.error('Tool execution error:', inspect(error, { depth: 8, breakLength: 120 }));
        return {
            content: [{ type: 'text', text: `Erro: ${formatError(error)}` }],
            isError: true,
        };
    }
});
// ---------------------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------------------
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((err) => {
    console.error('Erro fatal:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map