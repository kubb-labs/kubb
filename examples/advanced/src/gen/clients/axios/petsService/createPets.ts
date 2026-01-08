import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  CreatePetsRequestData,
  CreatePetsResponseData,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
} from '../../../models/ts/petsController/CreatePets.ts'
import { createPetsResponseData2Schema, createPetsRequestData2Schema } from '../../../zod/petsController/createPetsSchema.ts'

export function getCreatePetsUrl({ uuid }: { uuid: CreatePetsPathParams['uuid'] }) {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/pets/${uuid}` as const }
  return res
}

/**
 * @summary Create a pet
 * {@link /pets/:uuid}
 */
export async function createPets(
  {
    uuid,
    data,
    headers,
    params,
  }: { uuid: CreatePetsPathParams['uuid']; data: CreatePetsRequestData; headers: CreatePetsHeaderParams; params?: CreatePetsQueryParams },
  config: Partial<RequestConfig<CreatePetsRequestData>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = createPetsRequestData2Schema.parse(data)

  const res = await request<CreatePetsResponseData, ResponseErrorConfig<Error>, CreatePetsRequestData>({
    method: 'POST',
    url: getCreatePetsUrl({ uuid }).url.toString(),
    params,
    data: requestData,
    ...requestConfig,
    headers: { ...headers, ...requestConfig.headers },
  })
  return { ...res, data: createPetsResponseData2Schema.parse(res.data) }
}
