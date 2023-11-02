import useSWRMutation from 'swr/mutation'
import client from '../../../../swr-client.ts'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import type { ResponseConfig } from '../../../../swr-client.ts'
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
export function useUpdatePetWithForm<
  TData = UpdatePetWithFormMutationResponse,
  TError = UpdatePetWithForm405,
>(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithFormQueryParams,
  options?: {
    mutation?: SWRMutationConfiguration<ResponseConfig<TData>, TError, string | null, never>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
    shouldFetch?: boolean
  },
): SWRMutationResponse<ResponseConfig<TData>, TError, string | null, never> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

  const url = shouldFetch ? `/pet/${petId}` : null
  return useSWRMutation<ResponseConfig<TData>, TError, string | null, never>(
    url,
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
