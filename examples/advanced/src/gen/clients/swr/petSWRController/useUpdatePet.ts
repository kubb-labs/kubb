import useSWRMutation from 'swr/mutation'
import client from '../../../../swr-client.ts'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import type { ResponseConfig } from '../../../../swr-client.ts'
import type { UpdatePetMutationRequest, UpdatePetMutationResponse, UpdatePet400, UpdatePet404, UpdatePet405 } from '../../../models/ts/petController/UpdatePet'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet */
export function useUpdatePet<TData = UpdatePetMutationResponse, TError = UpdatePet400 | UpdatePet404 | UpdatePet405, TVariables = UpdatePetMutationRequest>(
  options?: {
    mutation?: SWRMutationConfiguration<ResponseConfig<TData>, TError, string | null, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
    shouldFetch?: boolean
  },
): SWRMutationResponse<ResponseConfig<TData>, TError, string | null, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = shouldFetch ? `/pet` : null
  return useSWRMutation<ResponseConfig<TData>, TError, string | null, TVariables>(url, (url, { arg: data }) => {
    return client<TData, TError, TVariables>({
      method: 'put',
      url,
      data,
      ...clientOptions,
    })
  }, mutationOptions)
}
