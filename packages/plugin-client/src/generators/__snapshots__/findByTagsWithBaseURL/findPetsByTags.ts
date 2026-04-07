/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/fetch'
import type { FindPetsByTagsQueryTags, FindPetsByTagsQueryStatus, FindPetsByTagsResponse } from './FindPetsByTags'
import { fetch } from './.kubb/fetch'

export function getFindPetsByTagsUrl() {
  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/pet/findByTags` as const }

  return res
}

/**
 * {@link /pet/findByTags}
 */
export async function findPetsByTags(
  params: { tags: FindPetsByTagsQueryTags; status?: FindPetsByTagsQueryStatus },
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<FindPetsByTagsResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getFindPetsByTagsUrl().url.toString(),
    params,
    ...requestConfig,
  })

  return res.data
}
