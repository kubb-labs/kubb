import client from '@kubb/swagger-client/client'

import { useMutation } from '@tanstack/vue-query'

import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { UseMutationReturnType } from '@tanstack/vue-query'
import type { VueMutationObserverOptions } from '@tanstack/vue-query/build/lib/useMutation'
import type { AddPet405, AddPetMutationRequest, AddPetMutationResponse } from '../models/AddPet'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */

export function useAddPet<TData = AddPetMutationResponse, TError = AddPet405, TVariables = AddPetMutationRequest>(
  options: {
    mutation?: VueMutationObserverOptions<ResponseConfig<TData>, TError, TVariables, unknown>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationReturnType<ResponseConfig<TData>, TError, TVariables, unknown> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, TVariables, unknown>({
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
