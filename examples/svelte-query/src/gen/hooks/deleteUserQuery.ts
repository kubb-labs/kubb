import client from '@kubb/plugin-client/client'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from '../models/DeleteUser.ts'
import type { CreateMutationOptions } from '@tanstack/svelte-query'
import { createMutation } from '@tanstack/svelte-query'

type DeleteUserClient = typeof client<DeleteUserMutationResponse, DeleteUser400 | DeleteUser404, never>

type DeleteUser = {
  data: DeleteUserMutationResponse
  error: DeleteUser400 | DeleteUser404
  request: never
  pathParams: DeleteUserPathParams
  queryParams: never
  headerParams: never
  response: DeleteUserMutationResponse
  client: {
    parameters: Partial<Parameters<DeleteUserClient>[0]>
    return: Awaited<ReturnType<DeleteUserClient>>
  }
}

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username
 */
export function deleteUserQuery(
  username: DeleteUserPathParams['username'],
  options: {
    mutation?: CreateMutationOptions<DeleteUser['response'], DeleteUser['error'], DeleteUser['request']>
    client?: DeleteUser['client']['parameters']
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation({
    mutationFn: async () => {
      const res = await client<DeleteUser['data'], DeleteUser['error'], DeleteUser['request']>({
        method: 'delete',
        url: `/user/${username}`,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}
