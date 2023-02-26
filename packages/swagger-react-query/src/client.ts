import axios from 'axios'

import type { RequestConfig } from './types'

// TODO move to it's own library? Maybe part of @kubb/swagger-client?
export const axiosClient = async <TData, TVariables = unknown>(config: RequestConfig<TVariables>) => {
  const promise = axios.request<TData>({ ...config }).then(({ data }) => data)

  return promise
}

export default axiosClient
