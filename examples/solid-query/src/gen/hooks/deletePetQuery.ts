import { createMutation } from '@tanstack/solid-query'
import client from '@kubb/swagger-client/client'
import type { KubbQueryFactory } from './types'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../models/DeletePet'

type DeletePet = KubbQueryFactory<
  DeletePetMutationResponse,
  DeletePet400,
  never,
  DeletePetPathParams,
  never,
  DeletePetMutationResponse,
  {
    dataReturnType: 'data'
    type: 'mutation'
  }
> /**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
export function deletePetQuery<TData = DeletePet['response'], TError = DeletePet['error']>(
  petId: DeletePetPathParams['petId'],
  headers?: DeletePetHeaderParams,
  options: {
    mutation?: CreateMutationOptions<ResponseConfig<TData>, TError, void>
    client?: DeletePet['client']['paramaters']
  } = {},
): CreateMutationResult<ResponseConfig<TData>, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<ResponseConfig<TData>, TError, void>({
    mutationFn: () => {
      return client<TData, TError, void>({
        method: 'delete',
        url: `/pet/${petId}`,
        headers: { ...headers, ...clientOptions.headers },
        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}
