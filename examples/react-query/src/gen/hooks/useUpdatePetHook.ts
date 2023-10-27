import { useMutation } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { UpdatePetMutationResponse, UpdatePet400, UpdatePet404, UpdatePet405 } from '../models/UpdatePet'

type UpdatePet = KubbQueryFactory<UpdatePetMutationResponse, UpdatePet400 | UpdatePet404 | UpdatePet405, never, never, never, UpdatePetMutationResponse, {
  dataReturnType: 'data'
  type: 'mutation'
}> /**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */

export function useUpdatePetHook<TData = UpdatePet['response'], TError = UpdatePet['error'], TVariables = UpdatePet['request']>(options: {
  mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
  client?: UpdatePet['client']['paramaters']
} = {}): UseMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<ResponseConfig<TData>, TError, TVariables>({
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
