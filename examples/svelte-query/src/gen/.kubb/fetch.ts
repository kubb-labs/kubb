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

export const fetch = async <TData, TError = unknown, TVariables = unknown>(config: RequestConfig<TVariables>): Promise<ResponseConfig<TData>> => {
  const globalConfig = getConfig()

  return axiosInstance
    .request<TData, ResponseConfig<TData>>({
      ...globalConfig,
      ...config,
      headers: {
        ...globalConfig.headers,
        ...config.headers,
      },
    })
    .catch((e: AxiosError<TError>) => {
      throw e
    })
}

fetch.getConfig = getConfig
fetch.setConfig = setConfig
