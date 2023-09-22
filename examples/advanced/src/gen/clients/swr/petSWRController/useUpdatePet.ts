import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import client from '../../../../client'
import type { UpdatePetMutationRequest, UpdatePetMutationResponse, Updatepet400, Updatepet404, Updatepet405 } from '../../../models/ts/petController/UpdatePet'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */

export function useUpdatepet<
  TData = UpdatePetMutationResponse,
  TError = Updatepet400 | Updatepet404 | Updatepet405,
  TVariables = UpdatePetMutationRequest,
>(options?: {
  mutation?: SWRMutationConfiguration<TData, TError, string, TVariables>
  client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
}): SWRMutationResponse<TData, TError, string, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useSWRMutation<TData, TError, string, TVariables>(
    `/pet`,
    (url, { arg: data }) => {
      return client<TData, TError, TVariables>({
        method: 'put',
        url,
        data,

        ...clientOptions,
      })
    },
    mutationOptions,
  )
}
