import client from '../../../../tanstack-query-client.ts'
import type { RequestConfig } from '../../../../tanstack-query-client.ts'
import type {
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
} from '../../../models/ts/petsController/CreatePets.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { createPetsMutationResponseSchema } from '../../../zod/petsController/createPetsSchema.ts'
import { useMutation } from '@tanstack/react-query'

/**
 * @summary Create a pet
 * @link /pets/:uuid
 */
async function createPets(
  uuid: CreatePetsPathParams['uuid'],
  data: CreatePetsMutationRequest,
  headers: CreatePetsHeaderParams,
  params?: CreatePetsQueryParams,
  config: Partial<RequestConfig<CreatePetsMutationRequest>> = {},
) {
  const res = await client<CreatePetsMutationResponse, unknown, CreatePetsMutationRequest>({
    method: 'post',
    url: `/pets/${uuid}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    data,
    headers: { ...headers, ...config.headers },
    ...config,
  })
  return createPetsMutationResponseSchema.parse(res.data)
}

/**
 * @summary Create a pet
 * @link /pets/:uuid
 */
export function useCreatePets(
  options: {
    mutation?: UseMutationOptions<
      CreatePetsMutationResponse,
      unknown,
      {
        uuid: CreatePetsPathParams['uuid']
        data: CreatePetsMutationRequest
        headers: CreatePetsHeaderParams
        params?: CreatePetsQueryParams
      }
    >
    client?: Partial<RequestConfig<CreatePetsMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  return useMutation({
    mutationFn: async ({
      uuid,
      data,
      headers,
      params,
    }: {
      uuid: CreatePetsPathParams['uuid']
      data: CreatePetsMutationRequest
      headers: CreatePetsHeaderParams
      params?: CreatePetsQueryParams
    }) => {
      return createPets(uuid, data, headers, params, config)
    },
    ...mutationOptions,
  })
}
