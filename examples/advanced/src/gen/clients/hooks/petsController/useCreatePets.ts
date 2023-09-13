import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import client from '../../../../client'
import type {
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePets201,
} from '../../../models/ts/petsController/CreatePets'

/**
 * @summary Create a pet
 * @link /pets/:uuid
 */
export function useCreatePets<TData = CreatePetsMutationResponse, TError = CreatePets201, TVariables = CreatePetsMutationRequest>(
  uuid: CreatePetsPathParams['uuid'],
  params?: CreatePetsQueryParams,
  options?: {
    mutation?: UseMutationOptions<TData, TError, TVariables>
    client: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  },
): UseMutationResult<TData, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<TData, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/pets/${uuid}`,
        data,
        params,
        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}
