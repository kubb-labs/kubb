import client from 'axios'
import type { RequestConfig } from 'axios'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export async function importPath(params?: ImportPath, config: Partial<RequestConfig> = {}) {
  const res = await client<ImportPath>({ method: 'get', url: `/pet/findByTags`, params, ...config })
  return res.data
}
