import client from '../../../client'

import type { ResponseConfig } from '../../../client'
import type { FindPetsByTagsHeaderParams, FindPetsByTagsQueryParams, FindPetsByTagsQueryResponse } from '../../../models/ts/petController/FindPetsByTags'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export async function findPetsByTags<TData = FindPetsByTagsQueryResponse>(
  headers: FindPetsByTagsHeaderParams,
  params?: FindPetsByTagsQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<TData>['data']> {
  const { data: resData } = await client<TData>({
    method: 'get',
    url: `/pet/findByTags`,
    params,
    headers: { ...headers, ...options.headers },
    ...options,
  })

  return resData
}
