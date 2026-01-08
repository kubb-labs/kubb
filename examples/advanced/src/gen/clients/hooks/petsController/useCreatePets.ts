import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  CreatePetsRequestData9,
  CreatePetsResponseData9,
  CreatePetsPathParams9,
  CreatePetsQueryParams9,
  CreatePetsHeaderParams9,
} from '../../../models/ts/petsController/CreatePets.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { createPets } from '../../axios/petsService/createPets.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const createPetsMutationKey = () => [{ url: '/pets/:uuid' }] as const

export type CreatePetsMutationKey = ReturnType<typeof createPetsMutationKey>

export function createPetsMutationOptions(config: Partial<RequestConfig<CreatePetsRequestData9>> & { client?: typeof fetch } = {}) {
  const mutationKey = createPetsMutationKey()
  return mutationOptions<
    ResponseConfig<CreatePetsResponseData9>,
    ResponseErrorConfig<Error>,
    { uuid: CreatePetsPathParams9['uuid']; data: CreatePetsRequestData9; headers: CreatePetsHeaderParams9; params?: CreatePetsQueryParams9 },
    typeof mutationKey
  >({
    mutationKey,
    mutationFn: async ({ uuid, data, headers, params }) => {
      return createPets({ uuid, data, headers, params }, config)
    },
  })
}

/**
 * @summary Create a pet
 * {@link /pets/:uuid}
 */
export function useCreatePets<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<CreatePetsResponseData9>,
      ResponseErrorConfig<Error>,
      { uuid: CreatePetsPathParams9['uuid']; data: CreatePetsRequestData9; headers: CreatePetsHeaderParams9; params?: CreatePetsQueryParams9 },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<CreatePetsRequestData9>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createPetsMutationKey()

  const baseOptions = createPetsMutationOptions(config) as UseMutationOptions<
    ResponseConfig<CreatePetsResponseData9>,
    ResponseErrorConfig<Error>,
    { uuid: CreatePetsPathParams9['uuid']; data: CreatePetsRequestData9; headers: CreatePetsHeaderParams9; params?: CreatePetsQueryParams9 },
    TContext
  >

  return useMutation<
    ResponseConfig<CreatePetsResponseData9>,
    ResponseErrorConfig<Error>,
    { uuid: CreatePetsPathParams9['uuid']; data: CreatePetsRequestData9; headers: CreatePetsHeaderParams9; params?: CreatePetsQueryParams9 },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<CreatePetsResponseData9>,
    ResponseErrorConfig<Error>,
    { uuid: CreatePetsPathParams9['uuid']; data: CreatePetsRequestData9; headers: CreatePetsHeaderParams9; params?: CreatePetsQueryParams9 },
    TContext
  >
}
