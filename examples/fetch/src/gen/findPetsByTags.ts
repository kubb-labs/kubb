import client from '@kubb/plugin-client/clients/fetch'
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTags400 } from './models.ts'
import type { RequestConfig } from '@kubb/plugin-client/clients/fetch'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export async function findPetsByTags(params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<FindPetsByTagsQueryResponse, FindPetsByTags400, unknown>({ method: 'GET', url: '/pet/findByTags', params, ...config })
  return res.data
}
