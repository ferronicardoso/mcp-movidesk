import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

const BASE_URL = 'https://api.movidesk.com/public/v1';

function parseCliArgs(): Map<string, string> {
  const args = new Map<string, string>();
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      continue;
    }

    const eqIndex = arg.indexOf('=');
    if (eqIndex !== -1) {
      args.set(arg.slice(2, eqIndex), arg.slice(eqIndex + 1));
      continue;
    }

    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      args.set(key, next);
      i++;
    } else {
      args.set(key, 'true');
    }
  }

  return args;
}

function getToken(): string {
  const cliArgs = parseCliArgs();
  const token = cliArgs.get('token') ?? process.env.MOVIDESK_TOKEN;

  if (!token) {
    throw new Error(
      'Token de autenticação obrigatório: defina a variável de ambiente MOVIDESK_TOKEN ou passe --token=<valor>'
    );
  }

  return token;
}

const token = getToken();

export type ODataParams = {
  $filter?: string;
  $select?: string;
  $expand?: string;
  $orderby?: string;
  $top?: number;
  $skip?: number;
};

export type QueryParams = ODataParams & Record<string, unknown>;

function buildQueryString(params: QueryParams = {}): string {
  const searchParams = new URLSearchParams();
  searchParams.set('token', token);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }
    searchParams.set(key, String(value));
  }

  return searchParams.toString();
}

export class MovideskApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'MovideskApiError';
  }
}

async function parseErrorBody(response: Response): Promise<string> {
  const text = await response.text();

  if (!text) {
    return `HTTP ${response.status}`;
  }

  try {
    const json = JSON.parse(text);
    return typeof json === 'string' ? json : JSON.stringify(json);
  } catch {
    return text;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 429) {
      throw new MovideskApiError(
        429,
        'Limite de requisições por minuto da API do Movidesk foi atingido (429). Aguarde antes de tentar novamente.'
      );
    }

    const detail = await parseErrorBody(response);
    throw new MovideskApiError(response.status, `Erro na API do Movidesk (HTTP ${response.status}): ${detail}`);
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function get<T>(path: string, params?: QueryParams): Promise<T> {
  const url = `${BASE_URL}${path}?${buildQueryString(params)}`;
  const response = await fetch(url);
  return handleResponse<T>(response);
}

export async function post<T>(path: string, body: unknown, params?: QueryParams): Promise<T> {
  const url = `${BASE_URL}${path}?${buildQueryString(params)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function patch<T>(path: string, body: unknown, params?: QueryParams): Promise<T> {
  const url = `${BASE_URL}${path}?${buildQueryString(params)}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function uploadFile<T>(
  path: string,
  filePath: string,
  params: QueryParams
): Promise<T> {
  let fileContent: Buffer;
  try {
    fileContent = await readFile(filePath);
  } catch {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }

  const formData = new FormData();
  formData.append('anexos', new Blob([fileContent as unknown as BlobPart]), basename(filePath));

  const url = `${BASE_URL}${path}?${buildQueryString(params)}`;
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<T>(response);
}
