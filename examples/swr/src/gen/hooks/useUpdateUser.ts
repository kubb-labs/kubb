import client from '@kubb/swagger-client/client'
import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../models/UpdateUser'

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
export function useUpdateUser(
  username: UpdateUserPathParams['username'],
  options?: {
    mutation?: SWRMutationConfiguration<UpdateUser['response'], UpdateUser['error']>
    client?: UpdateUser['client']['parameters']
    shouldFetch?: boolean
  },
): SWRMutationResponse<UpdateUser['response'], UpdateUser['error']> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/user/${username}` as const
  return useSWRMutation<UpdateUser['response'], UpdateUser['error'], typeof url | null>(
    shouldFetch ? url : null,
    async (_url, { arg: data }) => {
      const res = await client<UpdateUser['data'], UpdateUser['error'], UpdateUser['request']>({
        method: 'put',
        url,
        data,
        ...clientOptions,
      })
      return res.data
    },
    mutationOptions,
  )
}
