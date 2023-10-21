import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import type { UpdatePet400, UpdatePet404, UpdatePet405, UpdatePetMutationRequest, UpdatePetMutationResponse } from '../models/UpdatePet'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */

export function useUpdatePetHook<TData = UpdatePetMutationResponse, TError = UpdatePet400 | UpdatePet404 | UpdatePet405, TVariables = UpdatePetMutationRequest>(
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationResult<ResponseConfig<TData>, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, TVariables>({
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
