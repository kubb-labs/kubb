import client from '../../../../swr-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig } from '../../../../swr-client.ts'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../../models/ts/userController/UpdateUser.ts'
import { updateUserMutationResponseSchema } from '../../../zod/userController/updateUserSchema.ts'

export const updateUserMutationKeySWR = () => [{ url: '/user/{username}' }] as const

export type UpdateUserMutationKeySWR = ReturnType<typeof updateUserMutationKeySWR>

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * {@link /user/:username}
 */
async function updateUserSWR(
  {
    username,
    data,
  }: {
    username: UpdateUserPathParams['username']
    data?: UpdateUserMutationRequest
  },
  config: Partial<RequestConfig<UpdateUserMutationRequest>> = {},
) {
  const res = await client<UpdateUserMutationResponse, Error, UpdateUserMutationRequest>({
    method: 'PUT',
    url: `/user/${username}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...config,
  })
  return updateUserMutationResponseSchema.parse(res.data)
}

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * {@link /user/:username}
 */
export function useUpdateUserSWR(
  {
    username,
  }: {
    username: UpdateUserPathParams['username']
  },
  options: {
    mutation?: Parameters<typeof useSWRMutation<UpdateUserMutationResponse, Error, UpdateUserMutationKeySWR, UpdateUserMutationRequest>>[2]
    client?: Partial<RequestConfig<UpdateUserMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = updateUserMutationKeySWR()
  return useSWRMutation<UpdateUserMutationResponse, Error, UpdateUserMutationKeySWR | null, UpdateUserMutationRequest>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return updateUserSWR({ username, data }, config)
    },
    mutationOptions,
  )
}
