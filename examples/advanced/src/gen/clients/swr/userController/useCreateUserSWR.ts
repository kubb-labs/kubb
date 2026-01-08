import type { SWRMutationConfiguration } from 'swr/mutation'
import useSWRMutation from 'swr/mutation'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { CreateUserRequestData, CreateUserResponseData } from '../../../models/ts/userController/CreateUser.ts'
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
      ResponseConfig<CreateUserResponseData>,
      ResponseErrorConfig<Error>,
      CreateUserMutationKeySWR | null,
      CreateUserRequestData
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<CreateUserRequestData>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = createUserMutationKeySWR()

  return useSWRMutation<ResponseConfig<CreateUserResponseData>, ResponseErrorConfig<Error>, CreateUserMutationKeySWR | null, CreateUserRequestData>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return createUser({ data }, config)
    },
    mutationOptions,
  )
}
