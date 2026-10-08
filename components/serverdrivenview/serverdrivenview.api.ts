/**
 * The API schema: named operations a spec may call. A spec can only reach the
 * operations listed here — never an arbitrary URL. Building a request is pure;
 * `sendRequest` is the one place that touches the network.
 */
import { getIn, isPlainObject, parsePath, resolveValue, type Scope } from './serverdrivenview.engine';
import type { ServerDrivenApiOperation, ServerDrivenApiSchema } from './serverdrivenview.props';

export interface NormalizedApi {
  baseUrl: unknown;
  headers: Record<string, unknown>;
  operations: Record<string, ServerDrivenApiOperation>;
}

export interface ApiRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  /** Identity of the request; a `load` operation refetches when it changes. */
  key: string;
}

/** Rejection payload of a failed call; also what `onError` reads as `$event`. */
export interface ApiFailure {
  message: string;
  status?: number;
  data?: unknown;
}

/** Accepts an object, a JSON string or a Studio `{ dataSet }` wrapper. */
export function normalizeApi(api: unknown): NormalizedApi | null {
  let value = api;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (isPlainObject(value) && !('operations' in value) && isPlainObject(value.dataSet)) value = value.dataSet;
  if (!isPlainObject(value) || !isPlainObject(value.operations)) return null;
  const schema = value as ServerDrivenApiSchema;
  return {
    baseUrl: schema.baseUrl ?? '',
    headers: isPlainObject(schema.headers) ? schema.headers : {},
    operations: schema.operations as Record<string, ServerDrivenApiOperation>,
  };
}

export function hasOperation(api: NormalizedApi | null, name: string): boolean {
  return api != null && Object.prototype.hasOwnProperty.call(api.operations, name) && isPlainObject(api.operations[name]);
}

const PLACEHOLDER = /\{([^}]+)\}/g;
const BODYLESS = new Set(['GET', 'HEAD', 'DELETE']);

function joinUrl(base: string, path: string): string {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(path) || base === '') return path;
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function queryString(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, raw] of Object.entries(params)) {
    for (const value of Array.isArray(raw) ? raw : [raw]) {
      if (value == null) continue;
      const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(text)}`);
    }
  }
  return parts.join('&');
}

/**
 * Builds the request for operation `name`. Params are the operation's
 * defaults with the caller's on top; `{name}` placeholders in the path take
 * theirs, and the rest go to the query string (GET, HEAD, DELETE) or the JSON
 * body. Returns `null` while a placeholder has no value yet — a variable that
 * has not loaded — so nothing is sent with a hole in the URL.
 */
export function buildRequest(
  api: NormalizedApi,
  name: string,
  params: Record<string, unknown>,
  scope: Scope
): ApiRequest | null {
  const operation = api.operations[name];
  const method = String(operation.method ?? 'GET').toUpperCase();
  const defaults = resolveValue(isPlainObject(operation.params) ? operation.params : {}, scope);
  const inputs: Record<string, unknown> = { ...defaults, ...params };

  let missing = false;
  const path = String(resolveValue(operation.path ?? '', scope) ?? '').replace(PLACEHOLDER, (_m, raw: string) => {
    const key = raw.trim();
    const value = inputs[key];
    delete inputs[key];
    if (value == null || value === '') missing = true;
    return encodeURIComponent(String(value ?? ''));
  });
  if (missing) return null;

  const headers: Record<string, string> = { Accept: 'application/json' };
  const rawHeaders = resolveValue({ ...api.headers, ...(isPlainObject(operation.headers) ? operation.headers : {}) }, scope);
  for (const [key, value] of Object.entries(rawHeaders as Record<string, unknown>)) {
    if (value != null && value !== '') headers[key] = String(value);
  }

  let url = joinUrl(String(resolveValue(api.baseUrl, scope) ?? ''), path);
  let body: string | undefined;
  if (BODYLESS.has(method)) {
    const query = queryString(inputs);
    if (query !== '') url += (url.includes('?') ? '&' : '?') + query;
  } else if (Object.keys(inputs).length > 0) {
    body = JSON.stringify(inputs);
    if (!Object.keys(headers).some((key) => key.toLowerCase() === 'content-type')) {
      headers['Content-Type'] = 'application/json';
    }
  }
  return { url, method, headers, body, key: JSON.stringify([method, url, headers, body]) };
}

function failureMessage(data: unknown, status: number): string {
  if (isPlainObject(data)) {
    for (const key of ['message', 'error', 'detail']) {
      if (typeof data[key] === 'string' && data[key] !== '') return data[key];
    }
  }
  return `Request failed with status ${status}`;
}

/**
 * Sends a request and resolves with the response body — JSON when it parses,
 * else text — narrowed by the operation's `select`. Rejects with an
 * {@link ApiFailure} on a network error or a non-2xx status.
 */
export async function sendRequest(
  request: ApiRequest,
  operation: ServerDrivenApiOperation,
  signal?: AbortSignal
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(request.url, { method: request.method, headers: request.headers, body: request.body, signal });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error;
    throw { message: (error as Error)?.message || 'Network request failed' } satisfies ApiFailure;
  }
  const text = await response.text();
  let data: unknown = text === '' ? undefined : text;
  try {
    if (text !== '') data = JSON.parse(text);
  } catch {
    // Not JSON: keep the text.
  }
  if (!response.ok) {
    throw { message: failureMessage(data, response.status), status: response.status, data } satisfies ApiFailure;
  }
  return operation.select != null ? getIn(data, parsePath(operation.select)) : data;
}

export function toFailure(error: unknown): ApiFailure {
  if (isPlainObject(error) && typeof error.message === 'string') return error as ApiFailure;
  return { message: error instanceof Error ? error.message : String(error) };
}
