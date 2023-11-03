import { useMutation } from '@tanstack/vue-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { UseMutationOptions, UseMutationReturnType } from '@tanstack/vue-query'
import type { UpdatePetMutationRequest, UpdatePetMutationResponse, UpdatePet400, UpdatePet404, UpdatePet405 } from '../models/UpdatePet'

type UpdatePet = KubbQueryFactory<
  UpdatePetMutationResponse,
  UpdatePet400 | UpdatePet404 | UpdatePet405,
  UpdatePetMutationRequest,
  never,
  never,
  never,
  UpdatePetMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
> /**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */

export function useUpdatePet<TData = UpdatePet['response'], TError = UpdatePet['error']>(
  options: {
    mutation?: UseMutationOptions<TData, TError, UpdatePet['request'], unknown>
    client?: UpdatePet['client']['paramaters']
  } = {},
): UseMutationReturnType<TData, TError, UpdatePet['request'], unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<TData, TError, UpdatePet['request'], unknown>({
    mutationFn: (data) => {
      return client<UpdatePet['data'], TError, UpdatePet['request']>({
        method: 'put',
        url: `/pet`,
        data,
        ...clientOptions,
      }).then((res) => res as TData)
    },
    ...mutationOptions,
  })
}
