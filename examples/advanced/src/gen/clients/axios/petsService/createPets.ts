import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type {
  CreatePetsHeaderParams,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsRequestData,
  CreatePetsResponseData,
} from '../../../models/ts/petsController/CreatePets.ts'
import { createPetsRequestDataSchema, createPetsResponseDataSchema } from '../../../zod/petsController/createPetsSchema.ts'

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

  const requestData = createPetsRequestDataSchema.parse(data)

  const res = await request<CreatePetsResponseData, ResponseErrorConfig<Error>, CreatePetsRequestData>({
    method: 'POST',
    url: getCreatePetsUrl({ uuid }).url.toString(),
    params,
    data: requestData,
    ...requestConfig,
    headers: { ...headers, ...requestConfig.headers },
  })
  return { ...res, data: createPetsResponseDataSchema.parse(res.data) }
}
