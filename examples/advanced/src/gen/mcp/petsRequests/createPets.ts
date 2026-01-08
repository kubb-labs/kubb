import fetch from '@kubb/plugin-client/clients/axios'
import type {
  CreatePetsRequestData,
  CreatePetsResponseData,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
} from '../../models/ts/petsController/CreatePets.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
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
  data: CreatePetsRequestData
  headers: CreatePetsHeaderParams
  params?: CreatePetsQueryParams
}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<CreatePetsResponseData, ResponseErrorConfig<Error>, CreatePetsRequestData>({
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
