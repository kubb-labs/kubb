import client from '../../../../swr-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig } from '../../../../swr-client.ts'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../../models/ts/userController/UpdateUser.ts'
import type { Key } from 'swr'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { updateUserMutationResponseSchema } from '../../../zod/userController/updateUserSchema.ts'

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */
async function updateUser(
  username: UpdateUserPathParams['username'],
  data?: UpdateUserMutationRequest,
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
 * @link /user/:username
 */
export function useUpdateUser(
  username: UpdateUserPathParams['username'],
  options: {
    mutation?: SWRMutationConfiguration<UpdateUserMutationResponse, Error>
    client?: Partial<RequestConfig<UpdateUserMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const swrKey = [`/user/${username}`] as const
  return useSWRMutation<UpdateUserMutationResponse, Error, Key>(
    shouldFetch ? swrKey : null,
    async (_url, { arg: data }) => {
      return updateUser(username, data, config)
    },
    mutationOptions,
  )
}
