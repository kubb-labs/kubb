import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import client from '@kubb/swagger-client/client'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePet400 } from '../models/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
export function useDeletePet<TData = DeletePetMutationResponse, TError = DeletePet400>(
  petId: DeletePetPathParams['petId'],
  options?: {
    mutation?: SWRMutationConfiguration<TData, TError, string>
  },
): SWRMutationResponse<TData, TError, string> {
  const { mutation: mutationOptions } = options ?? {}
  return useSWRMutation<TData, TError, string>(
    `/pet/${petId}`,
    (url) => {
      return client<TData, TError>({
        method: 'delete',
        url,
      })
    },
    mutationOptions,
  )
}
