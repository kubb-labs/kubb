import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/react-query'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams, UpdateUserError } from '../models/UpdateUser'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'

type UpdateUserClient = typeof client<UpdateUserMutationResponse, UpdateUserError, UpdateUserMutationRequest>
type UpdateUser = {
  data: UpdateUserMutationResponse
  error: UpdateUserError
  request: UpdateUserMutationRequest
  pathParams: UpdateUserPathParams
  queryParams: never
  headerParams: never
  response: UpdateUserMutationResponse
  unionResponse: Awaited<ReturnType<UpdateUserClient>> | UpdateUserMutationResponse
  client: {
    paramaters: Partial<Parameters<UpdateUserClient>[0]>
    return: Awaited<ReturnType<UpdateUserClient>>
  }
}
/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username */
export function useUpdateUserHook<TData = UpdateUser['response'], TError = UpdateUser['error']>(username: UpdateUserPathParams['username'], options: {
  mutation?: UseMutationOptions<TData, TError, UpdateUser['request']>
  client?: UpdateUser['client']['paramaters']
} = {}): UseMutationResult<TData, TError, UpdateUser['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, UpdateUser['request']>({
    mutationFn: (data) => {
      return client<UpdateUser['data'], TError, UpdateUser['request']>({
        method: 'put',
        url: `/user/${username}`,
        data,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}
