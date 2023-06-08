import axios from 'axios'

import type { AxiosError } from 'axios'
import type { RequestConfig } from './types.ts'

export const axiosClient = async <TData, TError = unknown, TVariables = unknown>(config: RequestConfig<TVariables>): Promise<TData> => {
  const promise = axios
    .request<TData>({ ...config })
    .then(({ data }) => data)
    .catch((e: AxiosError<TError>) => {
      throw e
    })

  return promise
}

export default axiosClient
