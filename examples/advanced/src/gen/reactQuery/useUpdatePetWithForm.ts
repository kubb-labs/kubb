import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { UpdatePetWithFormRequest, UpdatePetWithFormResponse, UpdatePetWithFormPathParams } from '../models/ts/UpdatePetWithForm'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/{petId}
 */
export const useUpdatePetWithForm = <TData = UpdatePetWithFormResponse, TVariables = UpdatePetWithFormRequest>(
  petId: UpdatePetWithFormPathParams['petId'],
  options?: {
    mutation?: UseMutationOptions<TData, unknown, TVariables>
  }
) => {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, unknown, TVariables>({
    mutationFn: (data) => {
      return axios.post(`/pet/${petId}`, data).then((res) => res.data)
    },
    ...mutationOptions,
  })
}
