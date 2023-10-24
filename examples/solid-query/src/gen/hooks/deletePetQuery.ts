import client from '@kubb/swagger-client/client'

import { createMutation } from '@tanstack/solid-query'

import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'
import type { DeletePet400, DeletePetHeaderParams, DeletePetMutationResponse, DeletePetPathParams } from '../models/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
export function deletePetQuery<TData = DeletePetMutationResponse, TError = DeletePet400>(
  petId: DeletePetPathParams['petId'],
  headers?: DeletePetHeaderParams,
  options: {
    mutation?: CreateMutationOptions<ResponseConfig<TData>, TError, void>
    client?: Partial<Parameters<typeof client<TData, TError, void>>[0]>
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
