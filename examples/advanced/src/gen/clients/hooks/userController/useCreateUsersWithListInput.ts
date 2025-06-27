import client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../../models/ts/userController/CreateUsersWithListInput.ts'
import type { UseMutationOptions, QueryClient } from '@tanstack/react-query'
import { createUsersWithListInput } from '../../axios/userService/createUsersWithListInput.ts'
import { useMutation } from '@tanstack/react-query'

export const createUsersWithListInputMutationKey = () => [{ url: '/user/createWithList' }] as const

export type CreateUsersWithListInputMutationKey = ReturnType<typeof createUsersWithListInputMutationKey>

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
    client?: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>> & { client?: typeof client }
  } = {},
) {
  const { mutation = {}, client: config = {} } = options ?? {}
  const { client: queryClient, ...mutationOptions } = mutation
  const mutationKey = mutationOptions.mutationKey ?? createUsersWithListInputMutationKey()

  return useMutation<
    ResponseConfig<CreateUsersWithListInputMutationResponse>,
    ResponseErrorConfig<Error>,
    { data?: CreateUsersWithListInputMutationRequest },
    TContext
  >(
    {
      mutationFn: async ({ data }) => {
        return createUsersWithListInput({ data }, config)
      },
      mutationKey,
      ...mutationOptions,
    },
    queryClient,
  )
}
