import client from '../../../client'

import type { FindPetsByTagsResponse, FindPetsByTagsQueryParams } from '../../models/ts/FindPetsByTags'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 * @deprecated
 */
export const findPetsByTags = <TData = FindPetsByTagsResponse>(params?: FindPetsByTagsQueryParams) => {
  return client<TData>({
    method: 'get',
    url: `/pet/findByTags`,
    params,
  })
}
