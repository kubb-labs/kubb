import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/vue-query'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../models/AddPet'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'

type AddPetClient = typeof client<AddPetMutationResponse, AddPet405, AddPetMutationRequest>
type AddPet = {
  data: AddPetMutationResponse
  error: AddPet405
  request: AddPetMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: AddPetMutationResponse
  unionResponse: Awaited<ReturnType<AddPetClient>> | AddPetMutationResponse
  client: {
    paramaters: Partial<Parameters<AddPetClient>[0]>
    return: Awaited<ReturnType<AddPetClient>>
  }
}
/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet */
export function useAddPet<TData = AddPet['response'], TError = AddPet['error']>(
  options: {
    mutation?: VueMutationObserverOptions<TData, TError, AddPet['request'], unknown>
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
