import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  CreatePetsHeaderParams,
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
} from '../../../models/ts/petsController/CreatePets.ts'
import { createPets } from '../../axios/petsService/createPets.ts'

export const createPetsMutationKey = () => [{ url: '/pets/:uuid' }] as const

export type CreatePetsMutationKey = ReturnType<typeof createPetsMutationKey>

export function createPetsMutationOptions(config: Partial<RequestConfig<CreatePetsMutationRequest>> & { client?: typeof fetch } = {}) {
  const mutationKey = createPetsMutationKey()
  return mutationOptions<
    ResponseConfig<CreatePetsMutationResponse>,
    ResponseErrorConfig<Error>,
    { uuid: CreatePetsPathParams['uuid']; data: CreatePetsMutationRequest; headers: CreatePetsHeaderParams; params?: CreatePetsQueryParams },
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
      ResponseConfig<CreatePetsMutationResponse>,
      ResponseErrorConfig<Error>,
      { uuid: CreatePetsPathParams['uuid']; data: CreatePetsMutationRequest; headers: CreatePetsHeaderParams; params?: CreatePetsQueryParams },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<CreatePetsMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createPetsMutationKey()

  const baseOptions = createPetsMutationOptions(config) as UseMutationOptions<
    ResponseConfig<CreatePetsMutationResponse>,
    ResponseErrorConfig<Error>,
    { uuid: CreatePetsPathParams['uuid']; data: CreatePetsMutationRequest; headers: CreatePetsHeaderParams; params?: CreatePetsQueryParams },
    TContext
  >

  return useMutation<
    ResponseConfig<CreatePetsMutationResponse>,
    ResponseErrorConfig<Error>,
    { uuid: CreatePetsPathParams['uuid']; data: CreatePetsMutationRequest; headers: CreatePetsHeaderParams; params?: CreatePetsQueryParams },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<CreatePetsMutationResponse>,
    ResponseErrorConfig<Error>,
    { uuid: CreatePetsPathParams['uuid']; data: CreatePetsMutationRequest; headers: CreatePetsHeaderParams; params?: CreatePetsQueryParams },
    TContext
  >
}
