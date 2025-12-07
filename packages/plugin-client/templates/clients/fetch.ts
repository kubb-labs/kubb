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

export const fetch = async <TData, _TError = unknown, TVariables = unknown>(paramsConfig: RequestConfig<TVariables>): Promise<ResponseConfig<TData>> => {
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

  // Get the Content-Type header to determine how to serialize the body
  const headersObj = Array.isArray(config.headers) ? Object.fromEntries(config.headers) : config.headers
  const contentType = headersObj?.['Content-Type'] || headersObj?.['content-type']

  // Serialize body based on Content-Type
  let body: BodyInit | undefined
  if (config.data !== undefined) {
    if (config.data instanceof FormData) {
      body = config.data
    } else if (typeof config.data === 'string') {
      // If data is already a string (e.g., XML), use it as-is
      body = config.data
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      // For form-urlencoded, convert object to URLSearchParams
      const formParams = new URLSearchParams()
      Object.entries(config.data as Record<string, any>).forEach(([key, value]) => {
        if (value !== undefined) {
          formParams.append(key, value === null ? 'null' : value.toString())
        }
      })
      body = formParams.toString()
    } else {
      // Default to JSON serialization
      body = JSON.stringify(config.data)
    }
  }

  const response = await globalThis.fetch(targetUrl, {
    credentials: config.credentials || 'same-origin',
    method: config.method?.toUpperCase(),
    body,
    signal: config.signal,
    headers: config.headers,
  })

  // Parse response based on Content-Type
  let data: any
  if ([204, 205, 304].includes(response.status) || !response.body) {
    data = {}
  } else {
    const responseContentType = response.headers.get('content-type')
    if (responseContentType?.includes('application/json')) {
      data = await response.json()
    } else if (responseContentType?.includes('application/xml') || responseContentType?.includes('text/xml')) {
      data = await response.text()
    } else if (responseContentType?.includes('text/')) {
      data = await response.text()
    } else {
      // Default to JSON for backward compatibility
      data = await response.json()
    }
  }

  return {
    data: data as TData,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers as Headers,
  }
}

fetch.getConfig = getConfig
fetch.setConfig = setConfig
