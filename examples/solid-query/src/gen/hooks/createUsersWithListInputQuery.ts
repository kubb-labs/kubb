import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'
import { createMutation } from '@tanstack/solid-query'
import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { CreateUsersWithListInputMutationRequest, CreateUsersWithListInputMutationResponse } from '../models/CreateUsersWithListInput'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */

export function createUsersWithListInputQuery<
  TData = CreateUsersWithListInputMutationResponse,
  TError = unknown,
  TVariables = CreateUsersWithListInputMutationRequest,
>(
  options: {
    mutation?: CreateMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): CreateMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return createMutation<ResponseConfig<TData>, TError, TVariables>({
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
