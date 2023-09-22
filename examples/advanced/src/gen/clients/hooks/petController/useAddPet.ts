import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import client from '../../../../client'
import type { AddPetMutationRequest, AddPetMutationResponse, Addpet405 } from '../../../models/ts/petController/AddPet'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */

export function useAddpet<TData = AddPetMutationResponse, TError = Addpet405, TVariables = AddPetMutationRequest>(
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
        url: `/pet`,
        data,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}
