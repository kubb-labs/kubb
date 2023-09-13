import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/svelte-query'
import { createMutation } from '@tanstack/svelte-query'
import client from '@kubb/swagger-client/client'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePet400 } from '../models/DeletePet'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
export function deletePetQuery<TData = DeletePetMutationResponse, TError = DeletePet400>(
  petId: DeletePetPathParams['petId'],
  options?: {
    mutation?: CreateMutationOptions<TData, TError, void>
    client: Partial<Parameters<typeof client<TData, TError, void>>[0]>
  },
): CreateMutationResult<TData, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return createMutation<TData, TError, void>({
    mutationFn: () => {
      return client<TData, TError, void>({
        method: 'delete',
        url: `/pet/${petId}`,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}
