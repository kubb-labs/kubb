import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../models/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */

export function useDeletePet<TData = DeletePetMutationResponse, TError = DeletePet400>(
  petId: DeletePetPathParams['petId'],
  headers?: DeletePetHeaderParams,
  options?: {
    mutation?: SWRMutationConfiguration<ResponseConfig<TData>, TError, string>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  },
): SWRMutationResponse<ResponseConfig<TData>, TError, string> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useSWRMutation<ResponseConfig<TData>, TError, string>(
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
