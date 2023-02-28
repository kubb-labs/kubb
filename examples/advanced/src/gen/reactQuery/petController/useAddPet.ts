import { useMutation } from '@tanstack/react-query'

import client from '../../../client'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { AddPetRequest, AddPetResponse } from '../../models/ts/AddPet'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 * @deprecated
 */
export const useAddPet = <TData = AddPetResponse, TVariables = AddPetRequest>(options?: { mutation?: UseMutationOptions<TData, unknown, TVariables> }) => {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, unknown, TVariables>({
    mutationFn: (data) => {
      return client<TData, TVariables>({
        method: 'post',
        url: `/pet`,
        data,
      })
    },
    ...mutationOptions,
  })
}
