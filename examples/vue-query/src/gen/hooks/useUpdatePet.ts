import client from '@kubb/swagger-client/client'
import { useMutation } from '@tanstack/vue-query'
import type { UpdatePetMutationRequest, UpdatePetMutationResponse, UpdatePet400, UpdatePet404, UpdatePet405 } from '../models/UpdatePet'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'

type UpdatePetClient = typeof client<UpdatePetMutationResponse, UpdatePet400 | UpdatePet404 | UpdatePet405, UpdatePetMutationRequest>
type UpdatePet = {
  data: UpdatePetMutationResponse
  error: UpdatePet400 | UpdatePet404 | UpdatePet405
  request: UpdatePetMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: UpdatePetMutationResponse
  client: {
    parameters: Partial<Parameters<UpdatePetClient>[0]>
    return: Awaited<ReturnType<UpdatePetClient>>
  }
}
/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */
export function useUpdatePet(
  options: {
    mutation?: VueMutationObserverOptions<UpdatePet['response'], UpdatePet['error'], UpdatePet['request'], unknown>
    client?: UpdatePet['client']['parameters']
  } = {},
): UseMutationReturnType<UpdatePet['response'], UpdatePet['error'], UpdatePet['request'], unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<UpdatePet['response'], UpdatePet['error'], UpdatePet['request'], unknown>({
    mutationFn: async (data) => {
      const res = await client<UpdatePet['data'], UpdatePet['error'], UpdatePet['request']>({
        method: 'put',
        url: '/pet',
        data,
        ...clientOptions,
      })
      return res.data
    },
    ...mutationOptions,
  })
}
