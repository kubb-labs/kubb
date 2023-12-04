import useSWRMutation from 'swr/mutation'
import client from '@kubb/swagger-client/client'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type {
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
  CreateUsersWithListInputError,
} from '../models/CreateUsersWithListInput'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList */
export function useCreateUsersWithListInput<
  TData = CreateUsersWithListInputMutationResponse,
  TError = CreateUsersWithListInputError,
  TVariables = CreateUsersWithListInputMutationRequest,
>(options?: {
  mutation?: SWRMutationConfiguration<ResponseConfig<TData>, TError>
  client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  shouldFetch?: boolean
}): SWRMutationResponse<ResponseConfig<TData>, TError> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/user/createWithList` as const
  return useSWRMutation<ResponseConfig<TData>, TError, typeof url | null>(
    shouldFetch ? url : null,
    (_url, { arg: data }) => {
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
