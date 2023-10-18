import axios from 'axios'

import type { AxiosError, AxiosHeaders, AxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * Subset of AxiosRequestConfig
 */
export type RequestConfig<TData = unknown> = {
  url?: string
  method: 'get' | 'put' | 'patch' | 'post' | 'delete'
  params?: unknown
  data?: TData
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

export const axiosInstance = axios.create({
  baseURL: typeof 'https://petstore3.swagger.io/api/v3' !== 'undefined' ? 'https://petstore3.swagger.io/api/v3' : undefined,
  headers: typeof '{}' !== 'undefined' ? (JSON.parse('{}') as AxiosHeaders) : undefined,
})

export const axiosClient = async <TData, TError = unknown, TVariables = unknown>(config: RequestConfig<TVariables>): Promise<ResponseConfig<TData>> => {
  const promise = axiosInstance.request<TData, ResponseConfig<TData>>({ ...config }).catch((e: AxiosError<TError>) => {
    throw e
  })

  return promise
}

export default axiosClient
