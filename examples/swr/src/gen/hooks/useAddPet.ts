import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import client from '@kubb/swagger-client/client'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../models/AddPet'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */
export function useAddPet<TData = AddPetMutationResponse, TError = AddPet405, TVariables = AddPetMutationRequest>(options?: {
  mutation?: SWRMutationConfiguration<TData, TError, string, TVariables>
}): SWRMutationResponse<TData, TError, string, TVariables> {
  const { mutation: mutationOptions } = options ?? {}

  return useSWRMutation<TData, TError, string, TVariables>(
    `/pet`,
    (url, { arg: data }) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url,
        data,
      })
    },
    mutationOptions,
  )
}
