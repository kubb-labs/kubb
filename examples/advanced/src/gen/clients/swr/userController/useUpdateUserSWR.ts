import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { UpdateUserRequestData3, UpdateUserResponseData3, UpdateUserPathParams3 } from '../../../models/ts/userController/UpdateUser.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { updateUser } from '../../axios/userService/updateUser.ts'

export const updateUserMutationKeySWR = () => [{ url: '/user/:username' }] as const

export type UpdateUserMutationKeySWR = ReturnType<typeof updateUserMutationKeySWR>

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * {@link /user/:username}
 */
export function useUpdateUserSWR(
  { username }: { username: UpdateUserPathParams3['username'] },
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<UpdateUserResponseData3>,
      ResponseErrorConfig<Error>,
      UpdateUserMutationKeySWR | null,
      UpdateUserRequestData3
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<UpdateUserRequestData3>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = updateUserMutationKeySWR()

  return useSWRMutation<ResponseConfig<UpdateUserResponseData3>, ResponseErrorConfig<Error>, UpdateUserMutationKeySWR | null, UpdateUserRequestData3>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return updateUser({ username, data }, config)
    },
    mutationOptions,
  )
}
