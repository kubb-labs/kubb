import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { CreateUsersWithListInputMutationRequest, CreateUsersWithListInputMutationResponse } from '../models/CreateUsersWithListInput'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
export function useCreateUsersWithListInputHook<
  TData = CreateUsersWithListInputMutationResponse,
  TError = unknown,
  TVariables = CreateUsersWithListInputMutationRequest,
>(options?: {
  mutation?: UseMutationOptions<TData, TError, TVariables>
  client: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
}): UseMutationResult<TData, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/user/createWithList`,
        data,
        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}
