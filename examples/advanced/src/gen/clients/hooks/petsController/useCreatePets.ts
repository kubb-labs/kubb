import client from '../../../../tanstack-query-client.ts'
import type { RequestConfig } from '../../../../tanstack-query-client.ts'
import type {
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
} from '../../../models/ts/petsController/CreatePets.ts'
import type { UseMutationOptions, UseMutationResult, MutationKey } from '@tanstack/react-query'
import { createPetsMutationResponseSchema } from '../../../zod/petsController/createPetsSchema.ts'
import { useMutation } from '@tanstack/react-query'

export const createPetsMutationKey = () => [{ url: '/pets/{uuid}' }] as const

export type CreatePetsMutationKey = ReturnType<typeof createPetsMutationKey>

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
  const res = await client<CreatePetsMutationResponse, Error, CreatePetsMutationRequest>({
    method: 'POST',
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
  const mutation = useMutation({
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
  }) as UseMutationResult<CreatePetsMutationResponse, Error> & {
    mutationKey: MutationKey
  }
  mutation.mutationKey = mutationKey as MutationKey
  return mutation
}
