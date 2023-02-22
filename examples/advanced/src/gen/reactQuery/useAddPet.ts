import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { AddPetRequest, AddPetResponse } from '../models/ts/AddPet'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */
export const useAddPet = <TData = AddPetResponse, TVariables = AddPetRequest>(options?: { mutation?: UseMutationOptions<TData, unknown, TVariables> }) => {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, unknown, TVariables>({
    mutationFn: (data) => {
      return axios.post(`/pet`, data).then((res) => res.data)
    },
    ...mutationOptions,
  })
}
