import { useMutation } from '@tanstack/react-query'
import client from '../../../../tanstack-query-client.ts'
import type { KubbQueryFactory } from './types'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type { ResponseConfig } from '../../../../tanstack-query-client.ts'
import type { AddPetMutationResponse, AddPet405 } from '../../../models/ts/petController/AddPet'

type AddPet = KubbQueryFactory<AddPetMutationResponse, AddPet405, never, never, never, AddPetMutationResponse, {
  dataReturnType: 'full'
  type: 'mutation'
}> /**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */

export function useAddPet<TData = AddPet['response'], TError = AddPet['error'], TVariables = AddPet['request']>(options: {
  mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
  client?: AddPet['client']['paramaters']
} = {}): UseMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<ResponseConfig<TData>, TError, TVariables>({
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
