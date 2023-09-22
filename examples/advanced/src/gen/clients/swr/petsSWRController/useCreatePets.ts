import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import client from '../../../../client'
import type {
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatepetsQueryparams,
  CreatepetsHeaderparams,
  Createpets201,
} from '../../../models/ts/petsController/CreatePets'

/**
 * @summary Create a pet
 * @link /pets/:uuid
 */

export function useCreatepets<TData = CreatePetsMutationResponse, TError = Createpets201, TVariables = CreatePetsMutationRequest>(
  uuid: CreatePetsPathParams['uuid'],
  headers: CreatepetsHeaderparams,
  params?: CreatepetsQueryparams,
  options?: {
    mutation?: SWRMutationConfiguration<TData, TError, string, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  },
): SWRMutationResponse<TData, TError, string, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useSWRMutation<TData, TError, string, TVariables>(
    `/pets/${uuid}`,
    (url, { arg: data }) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url,
        data,
        params,
        headers: { ...headers, ...clientOptions.headers },
        ...clientOptions,
      })
    },
    mutationOptions,
  )
}
