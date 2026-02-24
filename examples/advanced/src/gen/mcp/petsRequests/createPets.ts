import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import fetch from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type {
  CreatePetsHeaderParams,
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
} from '../../models/ts/petsController/CreatePets.ts'

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
  const mappedParams = params ? { bool_param: params.boolParam } : undefined

  const mappedHeaders = headers ? { 'X-EXAMPLE': headers.xEXAMPLE } : undefined

  const requestData = data

  const res = await fetch<CreatePetsMutationResponse, ResponseErrorConfig<Error>, CreatePetsMutationRequest>({
    method: 'POST',
    url: `/pets/${uuid}`,
    baseURL: 'https://petstore.swagger.io/v2',
    params: mappedParams,
    data: requestData,
    headers: { ...mappedHeaders },
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
