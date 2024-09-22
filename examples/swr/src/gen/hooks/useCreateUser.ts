import useSWRMutation from 'swr/mutation'
import client from '@kubb/swagger-client/client'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import type { Key } from 'swr'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../models/CreateUser'

type CreateUserClient = typeof client<CreateUserMutationResponse, Error, CreateUserMutationRequest>
type CreateUser = {
  data: CreateUserMutationResponse
  error: Error
  request: CreateUserMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: CreateUserMutationResponse
  client: {
    parameters: Partial<Parameters<CreateUserClient>[0]>
    return: Awaited<ReturnType<CreateUserClient>>
  }
}
/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * @link /user
 */
export function useCreateUser(options?: {
  mutation?: SWRMutationConfiguration<CreateUser['response'], CreateUser['error']>
  client?: CreateUser['client']['parameters']
  shouldFetch?: boolean
}): SWRMutationResponse<CreateUser['response'], CreateUser['error']> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = '/user' as const
  return useSWRMutation<CreateUser['response'], CreateUser['error'], Key>(
    shouldFetch ? url : null,
    async (_url, { arg: data }) => {
      const res = await client<CreateUser['data'], CreateUser['error'], CreateUser['request']>({
        method: 'post',
        url,
        data,
        ...clientOptions,
      })
      return res.data
    },
    mutationOptions,
  )
}
