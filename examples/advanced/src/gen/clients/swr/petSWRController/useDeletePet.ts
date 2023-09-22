import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
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
  options?: {
    mutation?: SWRMutationConfiguration<TData, TError, string>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  },
): SWRMutationResponse<TData, TError, string> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useSWRMutation<TData, TError, string>(
    `/pet/${petId}`,
    (url) => {
      return client<TData, TError>({
        method: 'delete',
        url,

        headers: { ...headers, ...clientOptions.headers },
        ...clientOptions,
      })
    },
    mutationOptions,
  )
}
