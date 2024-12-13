/* eslint-disable no-alert, no-console */
import client from '@kubb/plugin-client/client'
import type { RequestConfig } from '@kubb/plugin-client/client'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export async function findPetsByTags(params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<FindPetsByTagsQueryResponse, FindPetsByTags400, unknown>({ method: 'GET', url: `/pet/findByTags`, params, ...config })
  return res
}
