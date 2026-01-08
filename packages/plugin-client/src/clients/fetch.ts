/**
 * RequestCredentials
 */
export type RequestCredentials = 'omit' | 'same-origin' | 'include'

/**
 * Subset of FetchRequestConfig
 */
export type RequestConfig<TData = unknown> = {
  baseURL?: string
  url?: string
  method?: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD'
  params?: unknown
  data?: TData | FormData
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  signal?: AbortSignal
  headers?: [string, string][] | Record<string, string>
  credentials?: RequestCredentials
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

let _config: Partial<RequestConfig> = {}

export const getConfig = () => _config

export const setConfig = (config: Partial<RequestConfig>) => {
  _config = config
  return getConfig()
}

export type ResponseErrorConfig<TError = unknown> = TError

export const client = async <TResponseData, _TError = unknown, RequestData = unknown>(
  paramsConfig: RequestConfig<RequestData>,
): Promise<ResponseConfig<TResponseData>> => {
  const normalizedParams = new URLSearchParams()

  const globalConfig = getConfig()
  const config = {
    ...globalConfig,
    ...paramsConfig,
    headers: {
      ...(Array.isArray(globalConfig.headers) ? Object.fromEntries(globalConfig.headers) : globalConfig.headers),
      ...(Array.isArray(paramsConfig.headers) ? Object.fromEntries(paramsConfig.headers) : paramsConfig.headers),
    },
  }

  Object.entries(config.params || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : value.toString())
    }
  })

  let targetUrl = [config.baseURL, config.url].filter(Boolean).join('')

  if (config.params) {
    targetUrl += `?${normalizedParams}`
  }

  const response = await fetch(targetUrl, {
    credentials: config.credentials || 'same-origin',
    method: config.method?.toUpperCase(),
    body: config.data instanceof FormData ? config.data : JSON.stringify(config.data),
    signal: config.signal,
    headers: config.headers,
  })

  const data = [204, 205, 304].includes(response.status) || !response.body ? {} : await response.json()

  return {
    data: data as TResponseData,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers as Headers,
  }
}

client.getConfig = getConfig
client.setConfig = setConfig

export default client
