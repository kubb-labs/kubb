import client from '@kubb/plugin-client/client'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../models/UpdateUser.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { CreateMutationOptions, CreateMutationResult, MutationKey } from '@tanstack/svelte-query'
import { createMutation } from '@tanstack/svelte-query'

export const updateUserMutationKey = () => [{ url: '/user/{username}' }] as const

export type UpdateUserMutationKey = ReturnType<typeof updateUserMutationKey>

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
  return res.data
}

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */
export function createUpdateUser(
  options: {
    mutation?: CreateMutationOptions<
      UpdateUserMutationResponse,
      Error,
      {
        username: UpdateUserPathParams['username']
        data?: UpdateUserMutationRequest
      }
    >
    client?: Partial<RequestConfig<UpdateUserMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? updateUserMutationKey()
  const mutation = createMutation({
    mutationFn: async ({
      username,
      data,
    }: {
      username: UpdateUserPathParams['username']
      data?: UpdateUserMutationRequest
    }) => {
      return updateUser(username, data, config)
    },
    ...mutationOptions,
  }) as CreateMutationResult<UpdateUserMutationResponse, Error> & {
    mutationKey: MutationKey
  }
  mutation.mutationKey = mutationKey as MutationKey
  return mutation
}
