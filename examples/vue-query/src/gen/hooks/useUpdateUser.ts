import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/vue-query'
import { unref } from 'vue'
import type { UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams, UpdateUserError } from '../models/UpdateUser'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'
import type { MaybeRef } from 'vue'

type UpdateUserClient = typeof client<UpdateUserMutationResponse, UpdateUserError, UpdateUserMutationRequest>
type UpdateUser = {
  data: UpdateUserMutationResponse
  error: UpdateUserError
  request: UpdateUserMutationRequest
  pathParams: UpdateUserPathParams
  queryParams: never
  headerParams: never
  response: Awaited<ReturnType<UpdateUserClient>>['data']
  unionResponse: Awaited<ReturnType<UpdateUserClient>> | Awaited<ReturnType<UpdateUserClient>>['data']
  client: {
    paramaters: Partial<Parameters<UpdateUserClient>[0]>
    return: Awaited<ReturnType<UpdateUserClient>>
  }
}
/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * @link /user/:username */
export function useUpdateUser<TData = UpdateUser['response'], TError = UpdateUser['error']>(
  refUsername: MaybeRef<UpdateUserPathParams['username']>,
  options: {
    mutation?: VueMutationObserverOptions<TData, TError, UpdateUser['request'], unknown>
    client?: UpdateUser['client']['paramaters']
  } = {},
): UseMutationReturnType<TData, TError, UpdateUser['request'], unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, UpdateUser['request'], unknown>({
    mutationFn: (data) => {
      const username = unref(refUsername)
      return client<UpdateUser['data'], TError, UpdateUser['request']>({
        method: 'put',
        url: `/user/${username}`,
        data,
        ...clientOptions,
      }).then((res) => res as TData)
    },
    ...mutationOptions,
  })
}
