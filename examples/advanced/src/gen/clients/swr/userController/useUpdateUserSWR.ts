import type { SWRMutationConfiguration } from 'swr/mutation'
import useSWRMutation from 'swr/mutation'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { UpdateUserPathParams, UpdateUserRequestData, UpdateUserResponseData } from '../../../models/ts/userController/UpdateUser.ts'
import { updateUser } from '../../axios/userService/updateUser.ts'

export const updateUserMutationKeySWR = () => [{ url: '/user/:username' }] as const

export type UpdateUserMutationKeySWR = ReturnType<typeof updateUserMutationKeySWR>

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * {@link /user/:username}
 */
export function useUpdateUserSWR(
  { username }: { username: UpdateUserPathParams['username'] },
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<UpdateUserResponseData>,
      ResponseErrorConfig<Error>,
      UpdateUserMutationKeySWR | null,
      UpdateUserRequestData
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<UpdateUserRequestData>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = updateUserMutationKeySWR()

  return useSWRMutation<ResponseConfig<UpdateUserResponseData>, ResponseErrorConfig<Error>, UpdateUserMutationKeySWR | null, UpdateUserRequestData>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return updateUser({ username, data }, config)
    },
    mutationOptions,
  )
}
