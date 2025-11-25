import fetch from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type {
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
} from '../models/ts/CreatePets.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @summary Create a pet
 * {@link /pets/:uuid}
 */
export async function createPetsHandler({
  uuid,
  data,
  headers,
  params,
}: {
  uuid: CreatePetsPathParams['uuid']
  data: CreatePetsMutationRequest
  headers: CreatePetsHeaderParams
  params?: CreatePetsQueryParams
}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<CreatePetsMutationResponse, ResponseErrorConfig<Error>, CreatePetsMutationRequest>({
    method: 'POST',
    url: `/pets/${uuid}`,
    baseURL: 'https://petstore.swagger.io/v2',
    params,
    data: requestData,
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
