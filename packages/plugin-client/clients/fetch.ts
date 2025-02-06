/**
 * Subset of FetchRequestConfig
 */
export type RequestConfig<TData = unknown> = {
  baseURL?: string
  url?: string
  method: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS'
  params?: unknown
  data?: TData | FormData
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  signal?: AbortSignal
  headers?: [string, string][] | Record<string, string>
}

/**
 * Subset of FetchResponse
 */
export type ResponseConfig<TData = unknown> = {
  data: TData
  status: number
  statusText: string
  headers: Headers
}

export type ResponseErrorConfig<TError = unknown> = TError

export const client = async <TData, _TError = unknown, TVariables = unknown>(config: RequestConfig<TVariables>): Promise<ResponseConfig<TData>> => {
  const normalizedParams = new URLSearchParams()

  Object.entries(config.params || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : value.toString())
    }
  })

  let targetUrl = `${config.baseURL}${config.url}`

  if (config.params) {
    targetUrl += `?${normalizedParams}`
  }

  const response = await fetch(targetUrl, {
    method: config.method.toUpperCase(),
    body: JSON.stringify(config.data),
    signal: config.signal,
    headers: config.headers,
  })

  const data = [204, 205, 304].includes(response.status) || !response.body ? {} : await response.json()

  return {
    data: data as TData,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers as Headers,
  }
}

client.getConfig = () => {
  throw new Error('Not supported')
}
client.setConfig = () => {
  throw new Error('Not supported')
}

export default client
