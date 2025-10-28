import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../../models/ts/userController/CreateUsersWithListInput.ts'
import type { UseMutationOptions, UseMutationResult, QueryClient } from '@tanstack/react-query'
import { createUsersWithListInput } from '../../axios/userService/createUsersWithListInput.ts'
import { mutationOptions, useMutation } from '@tanstack/react-query'

export const createUsersWithListInputMutationKey = () => [{ url: '/user/createWithList' }] as const

export type CreateUsersWithListInputMutationKey = ReturnType<typeof createUsersWithListInputMutationKey>

export function createUsersWithListInputMutationOptions(
  config: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>> & { client?: typeof fetch } = {},
) {
  const mutationKey = createUsersWithListInputMutationKey()
  return mutationOptions<
    ResponseConfig<CreateUsersWithListInputMutationResponse>,
    ResponseErrorConfig<Error>,
    { data?: CreateUsersWithListInputMutationRequest },
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
      ResponseConfig<CreateUsersWithListInputMutationResponse>,
      ResponseErrorConfig<Error>,
      { data?: CreateUsersWithListInputMutationRequest },
      TContext
    > & { client?: QueryClient }
    client?: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>> & { client?: typeof fetch }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createUsersWithListInputMutationKey()

  const baseOptions = createUsersWithListInputMutationOptions(config) as UseMutationOptions<
    ResponseConfig<CreateUsersWithListInputMutationResponse>,
    ResponseErrorConfig<Error>,
    { data?: CreateUsersWithListInputMutationRequest },
    TContext
  >

  return useMutation<
    ResponseConfig<CreateUsersWithListInputMutationResponse>,
    ResponseErrorConfig<Error>,
    { data?: CreateUsersWithListInputMutationRequest },
    TContext
  >(
    {
      ...baseOptions,
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  ) as UseMutationResult<
    ResponseConfig<CreateUsersWithListInputMutationResponse>,
    ResponseErrorConfig<Error>,
    { data?: CreateUsersWithListInputMutationRequest },
    TContext
  >
}
