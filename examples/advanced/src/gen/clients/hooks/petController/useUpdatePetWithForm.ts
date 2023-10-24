import { useMutation } from '@tanstack/react-query'

import client from '../../../../tanstack-query-client.ts'

import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type { ResponseConfig } from '../../../../tanstack-query-client.ts'
import type {
  UpdatePetWithForm405,
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
} from '../../../models/ts/petController/UpdatePetWithForm'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function useUpdatePetWithForm<TData = UpdatePetWithFormMutationResponse, TError = UpdatePetWithForm405>(
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
