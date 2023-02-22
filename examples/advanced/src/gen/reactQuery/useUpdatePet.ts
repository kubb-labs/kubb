import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { UpdatePetRequest, UpdatePetResponse } from '../models/ts/UpdatePet'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */
export const useUpdatePet = <TData = UpdatePetResponse, TVariables = UpdatePetRequest>(options?: {
  mutation?: UseMutationOptions<TData, unknown, TVariables>
}) => {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, unknown, TVariables>({
    mutationFn: (data) => {
      return axios.put(`/pet`, data).then((res) => res.data)
    },
    ...mutationOptions,
  })
}
