import client from '@kubb/plugin-client/client'
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams } from '../../../models/ts/petController/FindPetsByTags.ts'
import type { ResponseConfig } from '@kubb/plugin-client/client'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export async function findPetsByTags(
  params?: FindPetsByTagsQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<FindPetsByTagsQueryResponse>['data']> {
  const res = await client<FindPetsByTagsQueryResponse>({
    method: 'get',
    url: '/pet/findByTags',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    ...options,
  })
  return res.data
}
