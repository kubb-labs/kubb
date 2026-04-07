/* eslint-disable no-alert, no-console */
import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/fetch'
import type { FindPetsByStatusQueryStatus, FindPetsByStatusResponse } from './FindPetsByStatus'
import { fetch } from './.kubb/fetch'

export function getFindPetsByStatusUrl() {
  const res = { method: 'GET', url: `/pet/findByStatus` as const }

  return res
}

/**
 * {@link /pet/findByStatus}
 */
export async function findPetsByStatus(
  { params }: { params?: { status?: FindPetsByStatusQueryStatus } } = {},
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<FindPetsByStatusResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getFindPetsByStatusUrl().url.toString(),
    params,
    ...requestConfig,
  })

  return res.data
}
