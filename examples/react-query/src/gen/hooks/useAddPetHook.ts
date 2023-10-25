import { useMutation } from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../models/AddPet'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */
export function useAddPetHook<TData = AddPetMutationResponse, TError = AddPet405, TVariables = AddPetMutationRequest>(options: {
  mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
  client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
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
