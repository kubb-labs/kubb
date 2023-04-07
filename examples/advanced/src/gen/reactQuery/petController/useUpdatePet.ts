import { useMutation } from '@tanstack/react-query'

import client from '../../../client'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { UpdatePetRequest, UpdatePetResponse, UpdatePet400, UpdatePet404, UpdatePet405 } from '../../models/ts/petController/UpdatePet'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */
export function useUpdatePet<TData = UpdatePetResponse, TError = UpdatePet400 & UpdatePet404 & UpdatePet405, TVariables = UpdatePetRequest>(options?: {
  mutation?: UseMutationOptions<TData, TError, TVariables>
}) {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, TError, TVariables>({
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
