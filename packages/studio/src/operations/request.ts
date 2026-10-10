type RequestOptions = {
  url: string
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  /** Sent as JSON. */
  body?: unknown
  /** Milliseconds before the request aborts, on top of `signal`. */
  timeout?: number
  signal?: AbortSignal
  /** Resolve a non-2xx response with its body instead of throwing. */
  ignoreResponseError?: boolean
}

/**
 * Thrown by {@link requestJson} on a non-2xx response, with the parsed body under `data`.
 */
export class ResponseError extends Error {
  readonly statusCode: number
  readonly response: Response
  readonly data: unknown

  constructor({ method, url, response, data }: { method: string; url: string; response: Response; data: unknown }) {
    super(`[${method}] ${JSON.stringify(url)}: ${response.status} ${response.statusText}`)
    this.name = 'ResponseError'
    this.statusCode = response.status
    this.response = response
    this.data = data
  }
}

function parseBody(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * Fetches a JSON endpoint: serializes `body`, bounds the request by `timeout` and `signal`, and
 * parses the response body. An empty body resolves to `undefined`.
 */
export async function requestJson<T>({ url, method = 'GET', headers = {}, body, timeout, signal, ignoreResponseError = false }: RequestOptions): Promise<T> {
  const signals = [signal, timeout === undefined ? undefined : AbortSignal.timeout(timeout)].filter(Boolean)
  const init: RequestInit = { method, headers, signal: signals.length > 0 ? AbortSignal.any(signals) : undefined }

  if (body !== undefined) {
    init.body = JSON.stringify(body)
    init.headers = { 'content-type': 'application/json', accept: 'application/json', ...headers }
  }

  const response = await fetch(url, init)
  const text = await response.text()
  const data = text ? parseBody(text) : undefined

  if (!response.ok && !ignoreResponseError) {
    throw new ResponseError({ method, url, response, data })
  }

  return data as T
}
