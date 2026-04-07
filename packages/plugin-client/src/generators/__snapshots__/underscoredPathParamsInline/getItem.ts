/* eslint-disable no-alert, no-console */
import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/fetch'
import type { GetItemPathItemId, GetItemResponse } from './GetItem'
import { fetch } from './.kubb/fetch'

export function getGetItemUrl(itemId: GetItemPathItemId) {
  const item_id = itemId
  const res = { method: 'GET', url: `/v1/items/${item_id}` as const }
  return res
}

/**
 * {@link /v1/items/:item_id}
 */
export async function getItem(itemId: GetItemPathItemId, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = fetch, ...requestConfig } = config
  const res = await request<GetItemResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getGetItemUrl(itemId).url.toString(),
    ...requestConfig,
  })
  return res.data
}
