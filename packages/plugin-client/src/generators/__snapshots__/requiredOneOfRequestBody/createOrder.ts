/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/fetch'
import type { CreateOrderData, CreateOrderResponse } from './CreateOrder'
import { fetch } from './.kubb/fetch'

export function getCreateOrderUrl() {
  const res = { method: 'POST', url: `/orders` as const }

  return res
}

/**
 * {@link /orders}
 */
export async function createOrder(data: CreateOrderData, config: Partial<RequestConfig<CreateOrderData>> & { client?: Client } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = data

  const res = await request<CreateOrderResponse, ResponseErrorConfig<Error>, CreateOrderData>({
    method: 'POST',
    url: getCreateOrderUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })

  return res.data
}
