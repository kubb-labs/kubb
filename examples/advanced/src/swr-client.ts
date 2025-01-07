import axios from 'axios'

import type { AxiosError, AxiosHeaders, AxiosRequestConfig, AxiosResponse } from 'axios'

declare const AXIOS_BASE: string
declare const AXIOS_HEADERS: string

/**
 * Subset of AxiosRequestConfig
 */
export type RequestConfig<TData = unknown> = {
  url?: string
  method: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE'
  baseURL?: string
  params?: unknown
  data?: TData | FormData
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  signal?: AbortSignal
  headers?: AxiosRequestConfig['headers']
}

export type ResponseErrorConfig<TError = unknown> = TError

/**
 * Subset of AxiosResponse
 */
export type ResponseConfig<TData = unknown> = {
  data: TData
  status: number
  statusText: string
  headers?: AxiosResponse['headers']
}

export const axiosInstance = axios.create({
  baseURL: typeof AXIOS_BASE !== 'undefined' ? AXIOS_BASE : undefined,
  headers: typeof AXIOS_HEADERS !== 'undefined' ? (JSON.parse(AXIOS_HEADERS) as AxiosHeaders) : undefined,
})

export const axiosClient = async <TData, TError = unknown, TVariables = unknown>(config: RequestConfig<TVariables>): Promise<ResponseConfig<TData>> => {
  const promise = axiosInstance.request<TVariables, ResponseConfig<TData>>({ ...config }).catch((e: AxiosError<TError>) => {
    throw e
  })

  return promise
}

export default axiosClient
