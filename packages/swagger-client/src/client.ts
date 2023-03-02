import axios from 'axios'

import type { RequestConfig } from './types'

export async function axiosClient<TData, TVariables = unknown>(config: RequestConfig<TVariables>) {
  const promise = axios.request<TData>({ ...config }).then(({ data }) => data)

  return promise
}

export default axiosClient
