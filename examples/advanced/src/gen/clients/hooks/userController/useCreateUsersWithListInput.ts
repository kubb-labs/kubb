import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { CreateUsersWithListInputRequestData9, CreateUsersWithListInputResponseData9 } from '../../../models/ts/userController/CreateUsersWithListInput.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { createUsersWithListInput } from '../../axios/userService/createUsersWithListInput.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const createUsersWithListInputMutationKey = () => [{ url: '/user/createWithList' }] as const

export type CreateUsersWithListInputMutationKey = ReturnType<typeof createUsersWithListInputMutationKey>

export function createUsersWithListInputMutationOptions(config: Partial<RequestConfig<CreateUsersWithListInputRequestData9>> & { client?: typeof fetch } = {}) {
  const mutationKey = createUsersWithListInputMutationKey()
  return mutationOptions<
    ResponseConfig<CreateUsersWithListInputResponseData9>,
    ResponseErrorConfig<Error>,
    { data?: CreateUsersWithListInputRequestData9 },
    typeof mutationKey
  >({
    mutationKey,
    mutationFn: async ({ data }) => {
      return createUsersWithListInput({ data }, config)
    },
  })
}

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * {@link /user/createWithList}
 */
export function useCreateUsersWithListInput<TContext>(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<CreateUsersWithListInputResponseData9>,
      ResponseErrorConfig<Error>,
      { data?: CreateUsersWithListInputRequestData9 },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<CreateUsersWithListInputRequestData9>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createUsersWithListInputMutationKey()

  const baseOptions = createUsersWithListInputMutationOptions(config) as UseMutationOptions<
    ResponseConfig<CreateUsersWithListInputResponseData9>,
    ResponseErrorConfig<Error>,
    { data?: CreateUsersWithListInputRequestData9 },
    TContext
  >

  return useMutation<
    ResponseConfig<CreateUsersWithListInputResponseData9>,
    ResponseErrorConfig<Error>,
    { data?: CreateUsersWithListInputRequestData9 },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<CreateUsersWithListInputResponseData9>,
    ResponseErrorConfig<Error>,
    { data?: CreateUsersWithListInputRequestData9 },
    TContext
  >
}
