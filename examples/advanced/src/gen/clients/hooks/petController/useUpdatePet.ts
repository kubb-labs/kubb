import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import client from '../../../../client'
import type { UpdatePetMutationRequest, UpdatePetMutationResponse, Updatepet400, Updatepet404, Updatepet405 } from '../../../models/ts/petController/UpdatePet'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */

export function useUpdatepet<TData = UpdatePetMutationResponse, TError = Updatepet400 | Updatepet404 | Updatepet405, TVariables = UpdatePetMutationRequest>(
  options: {
    mutation?: UseMutationOptions<TData, TError, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationResult<TData, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<TData, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'put',
        url: `/pet`,
        data,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}
