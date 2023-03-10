import { useMutation } from '@tanstack/react-query'

import client from '../../../client'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { UpdatePetWithFormRequest, UpdatePetWithFormResponse, UpdatePetWithFormPathParams } from '../../models/ts/UpdatePetWithForm'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/{petId}
 * @deprecated
 */
export function useUpdatePetWithForm<TData = UpdatePetWithFormResponse, TVariables = UpdatePetWithFormRequest>(
  petId: UpdatePetWithFormPathParams['petId'],
  options?: {
    mutation?: UseMutationOptions<TData, unknown, TVariables>
  }
) {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, unknown, TVariables>({
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
