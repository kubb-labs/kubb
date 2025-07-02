import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  FindPetsByTagsQueryResponse,
  FindPetsByTagsQueryParams,
  FindPetsByTagsHeaderParams,
  FindPetsByTags400,
} from '../../../models/ts/petController/FindPetsByTags.ts'
import { findPetsByTagsQueryResponseSchema } from '../../../zod/petController/findPetsByTagsSchema.ts'

export function getFindPetsByTagsUrl() {
  return 'https://petstore3.swagger.io/api/v3/pet/findByTags' as const
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export async function findPetsByTags(
  { headers, params }: { headers: FindPetsByTagsHeaderParams; params?: FindPetsByTagsQueryParams },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<FindPetsByTagsQueryResponse, ResponseErrorConfig<FindPetsByTags400>, unknown>({
    method: 'GET',
    url: getFindPetsByTagsUrl().toString(),
    params,
    ...requestConfig,
    headers: { ...headers, ...requestConfig.headers },
  })
  return { ...res, data: findPetsByTagsQueryResponseSchema.parse(res.data) }
}
