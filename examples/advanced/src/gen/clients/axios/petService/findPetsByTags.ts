import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { FindPetsByTagsQuery } from '../../../models/ts/petController/FindPetsByTags'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags */
export async function findPetsByTags(
  headers: FindPetsByTagsQuery.HeaderParams,
  params?: FindPetsByTagsQuery.QueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<FindPetsByTagsQuery.Response>> {
  const res = await client<FindPetsByTagsQuery.Response>({
    method: 'get',
    url: `/pet/findByTags`,
    params,
    headers: { ...headers, ...options.headers },
    ...options,
  })
  return res
}
