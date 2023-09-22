import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import client from '../../../../client'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatepetwithformQueryparams,
  Updatepetwithform405,
} from '../../../models/ts/petController/UpdatePetWithForm'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */

export function useUpdatepetwithform<TData = UpdatePetWithFormMutationResponse, TError = Updatepetwithform405>(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatepetwithformQueryparams,
  options: {
    mutation?: UseMutationOptions<TData, TError, void>
    client?: Partial<Parameters<typeof client<TData, TError, void>>[0]>
  } = {},
): UseMutationResult<TData, TError, void> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<TData, TError, void>({
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
