import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import client from '../../../../client'
import type {
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatepetsQueryparams,
  CreatepetsHeaderparams,
  Createpets201,
} from '../../../models/ts/petsController/CreatePets'

/**
 * @summary Create a pet
 * @link /pets/:uuid
 */

export function useCreatepets<TData = CreatePetsMutationResponse, TError = Createpets201, TVariables = CreatePetsMutationRequest>(
  uuid: CreatePetsPathParams['uuid'],
  headers: CreatepetsHeaderparams,
  params?: CreatepetsQueryparams,
  options: {
    mutation?: UseMutationOptions<TData, TError, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationResult<TData, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<TData, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/pets/${uuid}`,
        data,
        params,
        headers: { ...headers, ...clientOptions.headers },
        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}
