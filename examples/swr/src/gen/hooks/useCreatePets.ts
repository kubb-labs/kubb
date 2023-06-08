import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration } from 'swr/mutation'
import client from '@kubb/swagger-client/client'
import type { CreatePetsMutationRequest, CreatePetsMutationResponse } from '../models/CreatePets'

/**
 * @summary Create a pet
 * @link /pets
 */
export function useCreatePets<TData = CreatePetsMutationResponse, TError = unknown, TVariables = CreatePetsMutationRequest>(options?: {
  mutation?: SWRMutationConfiguration<TData, TError, TVariables, string>
}) {
  const { mutation: mutationOptions } = options ?? {}

  return useSWRMutation<TData, TError, string, TVariables>(
    `/pets`,
    (url, { arg: data }) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url,
        data,
      })
    },
    mutationOptions
  )
}
