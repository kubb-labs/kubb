import client from '@kubb/swagger-client/client'

import useSWRMutation from 'swr/mutation'

import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import type { CreateUsersWithListInputMutationRequest, CreateUsersWithListInputMutationResponse } from '../models/CreateUsersWithListInput'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */

export function useCreateUsersWithListInput<
  TData = CreateUsersWithListInputMutationResponse,
  TError = unknown,
  TVariables = CreateUsersWithListInputMutationRequest,
>(options?: {
  mutation?: SWRMutationConfiguration<ResponseConfig<TData>, TError, string | null, TVariables>
  client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  shouldFetch?: boolean
}): SWRMutationResponse<ResponseConfig<TData>, TError, string | null, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

  const url = shouldFetch ? `/user/createWithList` : null
  return useSWRMutation<ResponseConfig<TData>, TError, string | null, TVariables>(
    url,
    (url, { arg: data }) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url,
        data,

        ...clientOptions,
      })
    },
    mutationOptions,
  )
}
