import client from '@kubb/swagger-client/client'

import { createMutation } from '@tanstack/svelte-query'

import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { CreateMutationOptions, CreateMutationResult } from '@tanstack/svelte-query'
import type {
  UpdatePetWithForm405,
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
} from '../models/UpdatePetWithForm'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function updatePetWithFormQuery<TData = UpdatePetWithFormMutationResponse, TError = UpdatePetWithForm405>(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithFormQueryParams,
  options: {
    mutation?: CreateMutationOptions<ResponseConfig<TData>, TError, void>
    client?: Partial<Parameters<typeof client<TData, TError, void>>[0]>
  } = {},
): CreateMutationResult<ResponseConfig<TData>, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return createMutation<ResponseConfig<TData>, TError, void>({
    mutationFn: () => {
      return client<TData, TError, void>({
        method: 'post',
        url: `/pet/${petId}`,
        params,
        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}
