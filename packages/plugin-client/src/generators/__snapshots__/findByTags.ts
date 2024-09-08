import client from '@kubb/plugin-client/client'
import type { RequestConfig } from '@kubb/plugin-client/client'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export async function findByTags(params?: FindByTags, config: Partial<RequestConfig> = {}) {
  const res = await client<FindByTags>({ method: 'get', url: `/pet/findByTags`, params, ...config })
  return res.data
}
