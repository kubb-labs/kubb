import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/solid-query'
import { createMutation } from '@tanstack/solid-query'
import client from '@kubb/swagger-client/client'
import type { UpdatePetMutationRequest, UpdatePetMutationResponse, UpdatePet400 } from '../models/UpdatePet'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */
export function updatePetQuery<TData = UpdatePetMutationResponse, TError = UpdatePet400, TVariables = UpdatePetMutationRequest>(options?: {
  mutation?: CreateMutationOptions<TData, TError, TVariables>
  client: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
}): CreateMutationResult<TData, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<TData, TError, TVariables>({
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
