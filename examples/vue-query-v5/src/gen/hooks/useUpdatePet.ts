import client from '@kubb/swagger-client/client'

import { useMutation } from '@tanstack/vue-query'

import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { MutationObserverOptions, UseMutationReturnType } from '@tanstack/vue-query'
import type { UpdatePet400, UpdatePetMutationRequest, UpdatePetMutationResponse } from '../models/UpdatePet'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */

export function useUpdatePet<TData = UpdatePetMutationResponse, TError = UpdatePet400, TVariables = UpdatePetMutationRequest>(
  options: {
    mutation?: MutationObserverOptions<ResponseConfig<TData>, TError, TVariables, unknown>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationReturnType<ResponseConfig<TData>, TError, TVariables, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, TVariables, unknown>({
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
