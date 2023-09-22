import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import client from '../../../../client'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletepetHeaderparams, Deletepet400 } from '../../../models/ts/petController/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */

export function useDeletepet<TData = DeletePetMutationResponse, TError = Deletepet400>(
  petId: DeletePetPathParams['petId'],
  headers?: DeletepetHeaderparams,
  options: {
    mutation?: UseMutationOptions<TData, TError, void>
    client?: Partial<Parameters<typeof client<TData, TError, void>>[0]>
  } = {},
): UseMutationResult<TData, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<TData, TError, void>({
    mutationFn: () => {
      return client<TData, TError, void>({
        method: 'delete',
        url: `/pet/${petId}`,

        headers: { ...headers, ...clientOptions.headers },
        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}
