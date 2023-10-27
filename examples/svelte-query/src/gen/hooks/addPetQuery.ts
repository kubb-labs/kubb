import { createMutation } from '@tanstack/svelte-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/svelte-query'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { AddPetMutationResponse, AddPet405 } from '../models/AddPet'

type AddPet = KubbQueryFactory<
  AddPetMutationResponse,
  AddPet405,
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

export function addPetQuery<TData = AddPet['response'], TError = AddPet['error'], TVariables = AddPet['request']>(
  options: {
    mutation?: CreateMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: AddPet['client']['paramaters']
  } = {},
): CreateMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<ResponseConfig<TData>, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/pet`,
        data,
        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}
