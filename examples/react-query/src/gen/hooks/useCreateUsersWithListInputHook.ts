import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/react-query'
import type { CreateUsersWithListInputMutationRequest, CreateUsersWithListInputMutationResponse } from '../models/CreateUsersWithListInput'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'

type CreateUsersWithListInputClient = typeof client<CreateUsersWithListInputMutationResponse, never, CreateUsersWithListInputMutationRequest>
type CreateUsersWithListInput = {
  data: CreateUsersWithListInputMutationResponse
  error: never
  request: CreateUsersWithListInputMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: CreateUsersWithListInputMutationResponse
  client: {
    parameters: Partial<Parameters<CreateUsersWithListInputClient>[0]>
    return: Awaited<ReturnType<CreateUsersWithListInputClient>>
  }
}
/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
export function useCreateUsersWithListInputHook(
  options: {
    mutation?: UseMutationOptions<CreateUsersWithListInput['response'], CreateUsersWithListInput['error'], CreateUsersWithListInput['request']>
    client?: CreateUsersWithListInput['client']['parameters']
  } = {},
): UseMutationResult<CreateUsersWithListInput['response'], CreateUsersWithListInput['error'], CreateUsersWithListInput['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<CreateUsersWithListInput['response'], CreateUsersWithListInput['error'], CreateUsersWithListInput['request']>({
    mutationFn: async (data) => {
      const res = await client<CreateUsersWithListInput['data'], CreateUsersWithListInput['error'], CreateUsersWithListInput['request']>({
        method: 'post',
        url: '/user/createWithList',
        data,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}
