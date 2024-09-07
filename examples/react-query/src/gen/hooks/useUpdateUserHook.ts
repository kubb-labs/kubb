import client from '@kubb/plugin-client/client'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../models/UpdateUser.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

type UpdateUserClient = typeof client<UpdateUserMutationResponse, never, UpdateUserMutationRequest>

type UpdateUser = {
  data: UpdateUserMutationResponse
  error: never
  request: UpdateUserMutationRequest
  pathParams: UpdateUserPathParams
  queryParams: never
  headerParams: never
  response: UpdateUserMutationResponse
  client: {
    parameters: Partial<Parameters<UpdateUserClient>[0]>
    return: Awaited<ReturnType<UpdateUserClient>>
  }
}

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username
 */
export function useUpdateUserHook(
  username: UpdateUserPathParams['username'],
  options?: {
    mutation?: UseMutationOptions<UpdateUser['response'], UpdateUser['error'], UpdateUser['request']>
    client?: UpdateUser['client']['parameters']
  },
) {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<UpdateUser['data'], UpdateUser['error']>({ method: 'put', url: `/user/${username}`, data, ...options })
      return res.data
    },
    ...mutationOptions,
  })
}
