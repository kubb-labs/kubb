import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/vue-query'
import type { KubbQueryFactory } from './types'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../models/AddPet'
import type { UseMutationOptions, UseMutationReturnType } from '@tanstack/vue-query'

type AddPet = KubbQueryFactory<
  AddPetMutationResponse,
  AddPet405,
  AddPetMutationRequest,
  never,
  never,
  never,
  AddPetMutationResponse,
  {
    dataReturnType: 'data'
    type: 'mutation'
  }
> /**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */

export function useAddPet<TData = AddPet['response'], TError = AddPet['error']>(
  options: {
    mutation?: UseMutationOptions<TData, TError, AddPet['request'], unknown>
    client?: AddPet['client']['paramaters']
  } = {},
): UseMutationReturnType<TData, TError, AddPet['request'], unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, AddPet['request'], unknown>({
    mutationFn: (data) => {
      return client<AddPet['data'], TError, AddPet['request']>({
        method: 'post',
        url: `/pet`,
        data,
        ...clientOptions,
      }).then((res) => res as TData)
    },
    ...mutationOptions,
  })
}
