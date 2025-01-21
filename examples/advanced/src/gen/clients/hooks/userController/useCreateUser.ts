import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../tanstack-query-client'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../../models/ts/userController/CreateUser.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { createUser } from '../../axios/userService/createUser.ts'
import { useMutation } from '@tanstack/react-query'

export const createUserMutationKey = () => [{ url: '/user' }] as const

export type CreateUserMutationKey = ReturnType<typeof createUserMutationKey>

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export function useCreateUser(
  options: {
    mutation?: UseMutationOptions<ResponseConfig<CreateUserMutationResponse>, ResponseErrorConfig<Error>, { data?: CreateUserMutationRequest }>
    client?: Partial<RequestConfig<CreateUserMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? createUserMutationKey()

  return useMutation<ResponseConfig<CreateUserMutationResponse>, ResponseErrorConfig<Error>, { data?: CreateUserMutationRequest }>({
    mutationFn: async ({ data }) => {
      return createUser({ data }, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}
