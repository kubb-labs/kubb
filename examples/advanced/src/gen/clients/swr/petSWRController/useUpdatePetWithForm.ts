import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import client from '../../../../client'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../../../models/ts/petController/UpdatePetWithForm'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */

export function useupdatePetWithForm<TData = UpdatePetWithFormMutationResponse, TError = UpdatePetWithForm405>(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithFormQueryParams,
  options?: {
    mutation?: SWRMutationConfiguration<TData, TError, string>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  },
): SWRMutationResponse<TData, TError, string> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useSWRMutation<TData, TError, string>(
    `/pet/${petId}`,
    (url) => {
      return client<TData, TError>({
        method: 'post',
        url,

        params,

        ...clientOptions,
      })
    },
    mutationOptions,
  )
}
