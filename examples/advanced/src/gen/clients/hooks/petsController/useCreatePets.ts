import type client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
} from '../../../models/ts/petsController/CreatePets.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { createPets } from '../../axios/petsService/createPets.ts'
import { useMutation } from '@tanstack/react-query'

export const createPetsMutationKey = () => [{ url: '/pets/{uuid}' }] as const

export type CreatePetsMutationKey = ReturnType<typeof createPetsMutationKey>

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
    >
    client?: Partial<RequestConfig<CreatePetsMutationRequest>> & { client?: typeof client }
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? createPetsMutationKey()

  return useMutation<
    ResponseConfig<CreatePetsMutationResponse>,
    ResponseErrorConfig<Error>,
    { uuid: CreatePetsPathParams['uuid']; data: CreatePetsMutationRequest; headers: CreatePetsHeaderParams; params?: CreatePetsQueryParams },
    TContext
  >({
    mutationFn: async ({ uuid, data, headers, params }) => {
      return createPets({ uuid, data, headers, params }, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}
