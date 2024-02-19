import client from '@kubb/swagger-client/client'
import { createMutation } from '@tanstack/solid-query'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../models/UpdateUser'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'

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
 * @link /user/:username */

export function updateUserQuery(
  username: UpdateUserPathParams['username'],
  options: {
    mutation?: CreateMutationOptions<UpdateUser['response'], UpdateUser['error'], UpdateUser['request']>
    client?: UpdateUser['client']['parameters']
  } = {},
): CreateMutationResult<UpdateUser['response'], UpdateUser['error'], UpdateUser['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return createMutation<UpdateUser['response'], UpdateUser['error'], UpdateUser['request']>({
    mutationFn: async (data) => {
      const res = await client<UpdateUser['data'], UpdateUser['error'], UpdateUser['request']>({
        method: 'put',
        url: `/user/${username}`,
        data,
        ...clientOptions,
      })

      return res.data
    },
    ...mutationOptions,
  })
}
