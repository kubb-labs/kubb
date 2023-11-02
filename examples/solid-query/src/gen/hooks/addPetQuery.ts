import { createMutation } from '@tanstack/solid-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../models/AddPet'

type AddPet = KubbQueryFactory<
  AddPetMutationResponse,
  AddPet405,
  AddPetMutationRequest,
  never,
  never,
  never,
  AddPetMutationResponse,
  {
    dataReturnType: 'full'
    type: 'mutation'
  }
> /**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */

export function addPetQuery<TData = AddPet['response'], TError = AddPet['error']>(
  options: {
    mutation?: CreateMutationOptions<TData, TError, AddPet['request']>
    client?: AddPet['client']['paramaters']
  } = {},
): CreateMutationResult<TData, TError, AddPet['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<TData, TError, AddPet['request']>({
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
