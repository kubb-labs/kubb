import { useMutation } from '@tanstack/react-query'

import client from '../../../../client'

import type { UseMutationOptions } from '@tanstack/react-query'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../../../models/ts/petController/UpdatePetWithForm'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function useUpdatePetWithForm<TData = UpdatePetWithFormMutationResponse, TError = UpdatePetWithForm405>(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithFormQueryParams,
  options?: {
    mutation?: UseMutationOptions<TData, TError>
  }
) {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, TError>({
    mutationFn: () => {
      return client<TData, TError>({
        method: 'post',
        url: `/pet/${petId}`,

        params,
      })
    },
    ...mutationOptions,
  })
}
