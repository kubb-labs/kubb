import useSWRMutation from 'swr/mutation'

import client from '@kubb/swagger-client/client'

import type { SWRMutationConfiguration } from 'swr/mutation'
import type { CreatePetsRequest, CreatePetsResponse } from '../models/CreatePets'

/**
 * @summary Create a pet
 * @link /pets
 */
export function useCreatePets<TData = CreatePetsResponse, TVariables = CreatePetsRequest>(options?: {
  mutation?: SWRMutationConfiguration<TData, unknown, TVariables>
}) {
  const { mutation: mutationOptions } = options ?? {}

  return useSWRMutation<TData, unknown, string, TVariables>(
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
