import fetch from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTagsHeaderParams, FindPetsByTags400 } from '../models/ts/FindPetsByTags.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export async function findPetsByTagsHandler({
  headers,
  params,
}: {
  headers: FindPetsByTagsHeaderParams
  params?: FindPetsByTagsQueryParams
}): Promise<Promise<CallToolResult>> {
  const res = await fetch<FindPetsByTagsQueryResponse, ResponseErrorConfig<FindPetsByTags400>, unknown>({
    method: 'GET',
    url: '/pet/findByTags',
    baseURL: 'https://petstore.swagger.io/v2',
    params,
    headers: { ...headers },
  })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}
