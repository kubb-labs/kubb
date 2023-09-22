import client from '../../../client'
import type { FindPetsByTagsQueryResponse, FindpetsbytagsQueryparams, FindpetsbytagsHeaderparams } from '../../../models/ts/petController/FindPetsByTags'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */

export function findPetsByTags<TData = FindPetsByTagsQueryResponse>(
  headers: FindpetsbytagsHeaderparams,
  params?: FindpetsbytagsQueryparams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<TData> {
  return client<TData>({
    method: 'get',
    url: `/pet/findByTags`,
    params,

    headers: { ...headers, ...options.headers },
    ...options,
  })
}
