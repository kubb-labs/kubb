import { useMutation } from '@tanstack/vue-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { UpdatePetMutationResponse, UpdatePet400, UpdatePet404, UpdatePet405 } from '../models/UpdatePet'

type UpdatePet = KubbQueryFactory<
  UpdatePetMutationResponse,
  UpdatePet400 | UpdatePet404 | UpdatePet405,
  never,
  never,
  never,
  UpdatePetMutationResponse,
  {
    dataReturnType: 'data'
    type: 'mutation'
  }
> /**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */

export function useUpdatePet<TData = UpdatePet['response'], TError = UpdatePet['error'], TVariables = UpdatePet['request']>(
  options: {
    mutation?: VueMutationObserverOptions<ResponseConfig<TData>, TError, TVariables, unknown>
    client?: UpdatePet['client']['paramaters']
  } = {},
): UseMutationReturnType<ResponseConfig<TData>, TError, TVariables, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<ResponseConfig<TData>, TError, TVariables, unknown>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'put',
        url: `/pet`,
        data,
        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}
