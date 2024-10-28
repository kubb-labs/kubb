import client from '../../../../tanstack-query-client.ts'
import type { RequestConfig, ResponseConfig } from '../../../../tanstack-query-client.ts'
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

export const createPetsMutationKey = () => [{ url: '/pets/{uuid}' }] as const

export type CreatePetsMutationKey = ReturnType<typeof createPetsMutationKey>

/**
 * @summary Create a pet
 * @link /pets/:uuid
 */
async function createPets(
  { uuid }: CreatePetsPathParams,
  data: CreatePetsMutationRequest,
  headers: CreatePetsHeaderParams,
  params?: CreatePetsQueryParams,
  config: Partial<RequestConfig<CreatePetsMutationRequest>> = {},
) {
  const res = await client<CreatePetsMutationResponse, Error, CreatePetsMutationRequest>({
    method: 'POST',
    url: `/pets/${uuid}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    data,
    headers: { ...headers, ...config.headers },
    ...config,
  })
  return { ...res, data: createPetsMutationResponseSchema.parse(res.data) }
}

/**
 * @summary Create a pet
 * @link /pets/:uuid
 */
export function useCreatePets(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<CreatePetsMutationResponse>,
      Error,
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
  const mutationKey = mutationOptions?.mutationKey ?? createPetsMutationKey()
  return useMutation<
    ResponseConfig<CreatePetsMutationResponse>,
    Error,
    {
      uuid: CreatePetsPathParams['uuid']
      data: CreatePetsMutationRequest
      headers: CreatePetsHeaderParams
      params?: CreatePetsQueryParams
    }
  >({
    mutationFn: async ({ uuid, data, headers, params }) => {
      return createPets({ uuid }, data, headers, params, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}
