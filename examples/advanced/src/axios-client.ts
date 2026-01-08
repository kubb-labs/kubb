import type { AxiosError, AxiosHeaders, AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'

declare const AXIOS_BASE: string
declare const AXIOS_HEADERS: string

/**
 * Subset of AxiosRequestConfig
 */
export type RequestConfig<TBody = unknown> = {
  baseURL?: string
  url?: string
  method: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE'
  params?: unknown
  data?: TBody | FormData
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  signal?: AbortSignal
  headers?: AxiosRequestConfig['headers']
}
/**
 * Subset of AxiosResponse
 */
export type ResponseConfig<TData = unknown> = {
  data: TData
  status: number
  statusText: string
  headers?: AxiosResponse['headers']
}

export type ResponseErrorConfig<TError = unknown> = TError

export const axiosInstance = axios.create({
  baseURL: typeof AXIOS_BASE !== 'undefined' ? AXIOS_BASE : undefined,
  headers: typeof AXIOS_HEADERS !== 'undefined' ? (JSON.parse(AXIOS_HEADERS) as AxiosHeaders) : undefined,
})

export const client = async <TResponse, TError = unknown, TBody = unknown>(config: RequestConfig<TBody>): Promise<ResponseConfig<TResponse>> => {
  const promise = axiosInstance.request<TBody, ResponseConfig<TResponse>>(config).catch((e: AxiosError<TError>) => {
    throw e
  })

  return promise
}

export default client
