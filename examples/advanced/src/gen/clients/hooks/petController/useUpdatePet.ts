import client from '../../../../tanstack-query-client.ts'
import { useMutation } from '@tanstack/react-query'
import type { KubbQueryFactory } from './types'
import type { UpdatePetMutationRequest, UpdatePetMutationResponse, UpdatePet400, UpdatePet404, UpdatePet405 } from '../../../models/ts/petController/UpdatePet'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'

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

export function useUpdatePet<TData = UpdatePet['response'], TError = UpdatePet['error']>(options: {
  mutation?: UseMutationOptions<TData, TError, UpdatePet['request']>
  client?: UpdatePet['client']['paramaters']
} = {}): UseMutationResult<TData, TError, UpdatePet['request']> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation<TData, TError, UpdatePet['request']>({
    mutationFn: (data) => {
      return client<UpdatePet['data'], TError, UpdatePet['request']>({
        method: 'put',
        url: `/pet`,
        data,
        ...clientOptions,
      }).then(res => res as TData)
    },
    ...mutationOptions,
  })
}
