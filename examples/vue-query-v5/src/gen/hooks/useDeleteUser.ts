import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/vue-query'
import { unref } from 'vue'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from '../models/DeleteUser'
import type { UseMutationOptions, UseMutationReturnType } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'

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
    paramaters: Partial<Parameters<DeleteUserClient>[0]>
    return: Awaited<ReturnType<DeleteUserClient>>
  }
}
/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * @link /user/:username */
export function useDeleteUser(
  refUsername: MaybeRef<DeleteUserPathParams['username']>,
  options: {
    mutation?: UseMutationOptions<DeleteUser['response'], DeleteUser['error'], void, unknown>
    client?: DeleteUser['client']['paramaters']
  } = {},
): UseMutationReturnType<DeleteUser['response'], DeleteUser['error'], void, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<DeleteUser['response'], DeleteUser['error'], void, unknown>({
    mutationFn: async () => {
      const username = unref(refUsername)
      const res = await client<DeleteUser['data'], DeleteUser['error'], void>({
        method: 'delete',
        url: `/user/${username}`,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}
