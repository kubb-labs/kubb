import axios from 'axios'

import type { RequestConfig } from '@kubb/swagger-react-query'

export const axiosClient = async <TData, TVariables = unknown>(config: RequestConfig<TVariables>) => {
  const promise = axios.request<TData>({ ...config }).then(({ data }) => data)

  return promise
}

export default axiosClient
