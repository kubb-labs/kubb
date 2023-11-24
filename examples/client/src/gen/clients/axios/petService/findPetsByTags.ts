import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTagsHeaderParams } from '../../../models/ts/petController/FindPetsByTags'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags */
export async function findPetsByTags(
  headers: FindPetsByTagsHeaderParams,
  params?: FindPetsByTagsQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<FindPetsByTagsQueryResponse>['data']> {
  const { data: resData } = await client<FindPetsByTagsQueryResponse>({
    method: 'get',
    url: `/pet/findByTags`,
    params,
    headers: { ...headers, ...options.headers },
    ...options,
  })
  return resData
}
