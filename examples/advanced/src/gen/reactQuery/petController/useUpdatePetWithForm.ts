import { useMutation } from '@tanstack/react-query'

import client from '../../../client'

import type { UseMutationOptions } from '@tanstack/react-query'
import type {
  UpdatePetWithFormRequest,
  UpdatePetWithFormResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithForm405,
} from '../../models/ts/petController/UpdatePetWithForm'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/{petId}
 */
export function useUpdatePetWithForm<TData = UpdatePetWithFormResponse, TError = UpdatePetWithForm405, TVariables = UpdatePetWithFormRequest>(
  petId: UpdatePetWithFormPathParams['petId'],
  options?: {
    mutation?: UseMutationOptions<TData, TError, TVariables>
  }
) {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TVariables>({
        method: 'post',
        url: `/pet/${petId}`,
        data,
      })
    },
    ...mutationOptions,
  })
}
