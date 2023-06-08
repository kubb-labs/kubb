import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration } from 'swr/mutation'
import client from '../../../../client'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePet400 } from '../../../models/ts/petController/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
export function useDeletePet<TData = DeletePetMutationResponse, TError = DeletePet400>(
  petId: DeletePetPathParams['petId'],
  options?: {
    mutation?: SWRMutationConfiguration<TData, TError, string>
  }
) {
  const { mutation: mutationOptions } = options ?? {}

  return useSWRMutation<TData, TError, string>(
    `/pet/${petId}`,
    (url) => {
      return client<TData, TError>({
        method: 'delete',
        url,
      })
    },
    mutationOptions
  )
}
