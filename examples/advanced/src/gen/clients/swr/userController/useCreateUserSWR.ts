import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { CreateUserRequestData3, CreateUserResponseData3 } from '../../../models/ts/userController/CreateUser.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { createUser } from '../../axios/userService/createUser.ts'

export const createUserMutationKeySWR = () => [{ url: '/user' }] as const

export type CreateUserMutationKeySWR = ReturnType<typeof createUserMutationKeySWR>

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export function useCreateUserSWR(
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<CreateUserResponseData3>,
      ResponseErrorConfig<Error>,
      CreateUserMutationKeySWR | null,
      CreateUserRequestData3
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<CreateUserRequestData3>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = createUserMutationKeySWR()

  return useSWRMutation<ResponseConfig<CreateUserResponseData3>, ResponseErrorConfig<Error>, CreateUserMutationKeySWR | null, CreateUserRequestData3>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return createUser({ data }, config)
    },
    mutationOptions,
  )
}
