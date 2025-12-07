import type { AxiosError, AxiosHeaders, AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'

declare const AXIOS_BASE: string
declare const AXIOS_HEADERS: string

/**
 * Subset of AxiosRequestConfig
 */
export type RequestConfig<TData = unknown> = {
  baseURL?: string
  url?: string
  method?: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD'
  params?: unknown
  data?: TData | FormData
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  signal?: AbortSignal
  validateStatus?: (status: number) => boolean
  headers?: AxiosRequestConfig['headers']
  paramsSerializer?: AxiosRequestConfig['paramsSerializer']
}

/**
 * Subset of AxiosResponse
 */
export type ResponseConfig<TData = unknown> = {
  data: TData
  status: number
  statusText: string
  headers: AxiosResponse['headers']
}

export type ResponseErrorConfig<TError = unknown> = AxiosError<TError>

let _config: Partial<RequestConfig> = {
  baseURL: typeof AXIOS_BASE !== 'undefined' ? AXIOS_BASE : undefined,
  headers: typeof AXIOS_HEADERS !== 'undefined' ? (JSON.parse(AXIOS_HEADERS) as AxiosHeaders) : undefined,
}

export const getConfig = () => _config

export const setConfig = (config: RequestConfig) => {
  _config = config
  return getConfig()
}

export const axiosInstance = axios.create(getConfig())

export const client = async <TData, TError = unknown, TVariables = unknown>(config: RequestConfig<TVariables>): Promise<ResponseConfig<TData>> => {
  const globalConfig = getConfig()

  // Get the Content-Type header to determine how to transform the request
  const contentType = config.headers?.['Content-Type'] || config.headers?.['content-type']
  
  // Transform request data based on Content-Type
  let transformedData = config.data
  if (config.data !== undefined && !(config.data instanceof FormData)) {
    if (typeof config.data === 'string') {
      // If data is already a string (e.g., XML), use it as-is
      transformedData = config.data
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      // For form-urlencoded, convert object to URLSearchParams
      const formParams = new URLSearchParams()
      Object.entries(config.data as Record<string, any>).forEach(([key, value]) => {
        if (value !== undefined) {
          formParams.append(key, value === null ? 'null' : value.toString())
        }
      })
      transformedData = formParams.toString()
    }
    // Axios handles JSON serialization automatically for objects
  }

  return axiosInstance
    .request<TData, ResponseConfig<TData>>({
      ...globalConfig,
      ...config,
      data: transformedData,
      headers: {
        ...globalConfig.headers,
        ...config.headers,
      },
    })
    .catch((e: AxiosError<TError>) => {
      throw e
    })
}

client.getConfig = getConfig
client.setConfig = setConfig

export default client
