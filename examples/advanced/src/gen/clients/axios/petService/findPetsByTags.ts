import client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  FindPetsByTagsQueryResponse,
  FindPetsByTagsQueryParams,
  FindPetsByTagsHeaderParams,
  FindPetsByTags400,
} from '../../../models/ts/petController/FindPetsByTags.ts'

export function getFindPetsByTagsUrl() {
  return new URL('/pet/findByTags', 'https://petstore3.swagger.io/api/v3')
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export async function findPetsByTags(
  { headers, params }: { headers: FindPetsByTagsHeaderParams; params?: FindPetsByTagsQueryParams },
  config: Partial<RequestConfig> = {},
) {
  const res = await client<FindPetsByTagsQueryResponse, ResponseErrorConfig<FindPetsByTags400>, unknown>({
    method: 'GET',
    url: getFindPetsByTagsUrl().toString(),
    params,
    headers: { ...headers, ...config.headers },
    ...config,
  })
  return res
}
