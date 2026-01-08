import type { QueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { CreateUsersWithListInputRequestData, CreateUsersWithListInputResponseData } from '../../../models/ts/userController/CreateUsersWithListInput.ts'
import { createUsersWithListInput } from '../../axios/userService/createUsersWithListInput.ts'

export const createUsersWithListInputMutationKey = () => [{ url: '/user/createWithList' }] as const

export type CreateUsersWithListInputMutationKey = ReturnType<typeof createUsersWithListInputMutationKey>

export function createUsersWithListInputMutationOptions(config: Partial<RequestConfig<CreateUsersWithListInputRequestData>> & { client?: typeof fetch } = {}) {
  const mutationKey = createUsersWithListInputMutationKey()
  return mutationOptions<
    ResponseConfig<CreateUsersWithListInputResponseData>,
    ResponseErrorConfig<Error>,
    { data?: CreateUsersWithListInputRequestData },
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
      ResponseConfig<CreateUsersWithListInputResponseData>,
      ResponseErrorConfig<Error>,
      { data?: CreateUsersWithListInputRequestData },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<CreateUsersWithListInputRequestData>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createUsersWithListInputMutationKey()

  const baseOptions = createUsersWithListInputMutationOptions(config) as UseMutationOptions<
    ResponseConfig<CreateUsersWithListInputResponseData>,
    ResponseErrorConfig<Error>,
    { data?: CreateUsersWithListInputRequestData },
    TContext
  >

  return useMutation<
    ResponseConfig<CreateUsersWithListInputResponseData>,
    ResponseErrorConfig<Error>,
    { data?: CreateUsersWithListInputRequestData },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<CreateUsersWithListInputResponseData>,
    ResponseErrorConfig<Error>,
    { data?: CreateUsersWithListInputRequestData },
    TContext
  >
}
