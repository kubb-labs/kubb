import { useMutation } from '@tanstack/react-query'

import client from '../../../client'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { UpdatePetRequest, UpdatePetResponse } from '../../models/ts/UpdatePet'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 * @deprecated
 */
export function useUpdatePet<TData = UpdatePetResponse, TVariables = UpdatePetRequest>(options?: {
  mutation?: UseMutationOptions<TData, unknown, TVariables>
}) {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, unknown, TVariables>({
    mutationFn: (data) => {
      return client<TData, TVariables>({
        method: 'put',
        url: `/pet`,
        data,
      })
    },
    ...mutationOptions,
  })
}
