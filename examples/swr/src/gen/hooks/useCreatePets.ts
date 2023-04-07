import useSWRMutation from 'swr/mutation'

import client from '@kubb/swagger-client/client'

import type { SWRMutationConfiguration } from 'swr/mutation'
import type { CreatePetsRequest, CreatePetsResponse } from '../models/CreatePets'

/**
 * @summary Create a pet
 * @link /pets
 */
export function useCreatePets<TData = CreatePetsResponse, TError = unknown, TVariables = CreatePetsRequest>(options?: {
  mutation?: SWRMutationConfiguration<TData, TError, TVariables>
}) {
  const { mutation: mutationOptions } = options ?? {}

  return useSWRMutation<TData, TError, string, TVariables>(
    `/pets`,
    (url, { arg: data }) => {
      return client<TData, TVariables>({
        method: 'post',
        url,
        data,
      })
    },
    mutationOptions
  )
}
