import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/react-query'
import { useInvalidationForMutation } from '../../useInvalidationForMutation'
import type { DeleteUserMutationResponse, DeleteUserPathParams, DeleteUser400, DeleteUser404 } from '../models/DeleteUser'
import type { UseMutationOptions } from '@tanstack/react-query'

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
export function useDeleteUserHook(
  username: DeleteUserPathParams['username'],
  options: {
    mutation?: UseMutationOptions<DeleteUser['response'], DeleteUser['error'], DeleteUser['request']>
    client?: DeleteUser['client']['parameters']
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  const invalidationOnSuccess = useInvalidationForMutation('useDeleteUserHook')
  return useMutation({
    mutationFn: async () => {
      const res = await client<DeleteUser['data'], DeleteUser['error'], DeleteUser['request']>({
        method: 'delete',
        url: `/user/${username}`,
        ...clientOptions,
      })
      return res.data
    },
    onSuccess: (...args) => {
      if (invalidationOnSuccess) {
        invalidationOnSuccess(...args)
      }
      if (mutationOptions?.onSuccess) {
        mutationOptions.onSuccess(...args)
      }
    },
    ...mutationOptions,
  })
}
