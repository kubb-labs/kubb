import client from '@kubb/plugin-client/client'
import type { RequestConfig } from '@kubb/plugin-client/client'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export async function findByTagsWithZod(params?: FindByTagsWithZod, config: Partial<RequestConfig> = {}) {
  const res = await client<FindByTagsWithZod>({ method: 'get', url: `/pet/findByTags`, params, ...config })
  return { ...res, data: findByTagsWithZod.parse(res.data) }
}
