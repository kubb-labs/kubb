import client from '../../../../client'

import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams } from '../../../models/ts/petController/FindPetsByTags'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function findPetsByTags<TData = FindPetsByTagsQueryResponse>(params?: FindPetsByTagsQueryParams) {
  return client<TData>({
    method: 'get',
    url: `/pet/findByTags`,
    params,
  })
}
