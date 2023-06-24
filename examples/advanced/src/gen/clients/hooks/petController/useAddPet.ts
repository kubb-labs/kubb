import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import client from '../../../../client'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../../../models/ts/petController/AddPet'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */
export function useAddPet<TData = AddPetMutationResponse, TError = AddPet405, TVariables = AddPetMutationRequest>(options?: {
  mutation?: UseMutationOptions<TData, TError, TVariables>
}): UseMutationResult<TData, TError, TVariables> {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/pet`,
        data,
      })
    },
    ...mutationOptions,
  })
}
