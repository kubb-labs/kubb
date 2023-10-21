import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
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

export function useUpdatePetWithFormHook<TData = UpdatePetWithFormMutationResponse, TError = UpdatePetWithForm405>(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithFormQueryParams,
  options: {
    mutation?: UseMutationOptions<ResponseConfig<TData>, TError, void>
    client?: Partial<Parameters<typeof client<TData, TError, void>>[0]>
  } = {},
): UseMutationResult<ResponseConfig<TData>, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<ResponseConfig<TData>, TError, void>({
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
