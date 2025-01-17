/* eslint-disable no-alert, no-console */
import client from '@kubb/plugin-client/clients/axios'
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTags400 } from '../../../models/ts/petController/FindPetsByTags.js'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

export function getFindPetsByTagsUrl() {
  return '/pet/findByTags' as const
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export async function findPetsByTags(params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<FindPetsByTagsQueryResponse, ResponseErrorConfig<FindPetsByTags400>, unknown>({
    method: 'GET',
    url: getFindPetsByTagsUrl().toString(),
    params,
    ...config,
  })
  return res.data
}
