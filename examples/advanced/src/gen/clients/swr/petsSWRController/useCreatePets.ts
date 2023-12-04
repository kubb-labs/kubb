import useSWRMutation from 'swr/mutation'
import client from '../../../../swr-client.ts'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import type { ResponseConfig } from '../../../../swr-client.ts'
import type {
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
  CreatePets201,
  CreatePetsError,
} from '../../../models/ts/petsController/CreatePets'

/**
 * @summary Create a pet
 * @link /pets/:uuid */
export function useCreatePets<TData = CreatePetsMutationResponse, TError = CreatePets201 | CreatePetsError, TVariables = CreatePetsMutationRequest>(
  uuid: CreatePetsPathParams['uuid'],
  params?: CreatePetsQueryParams,
  headers?: CreatePetsHeaderParams,
  options?: {
    mutation?: SWRMutationConfiguration<ResponseConfig<TData>, TError>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
    shouldFetch?: boolean
  },
): SWRMutationResponse<ResponseConfig<TData>, TError> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pets/${uuid}` as const
  return useSWRMutation<
    ResponseConfig<TData>,
    TError,
    [
      typeof url,
      typeof params,
    ] | null
  >(shouldFetch ? [url, params] : null, (_url, { arg: data }) => {
    return client<TData, TError, TVariables>({
      method: 'post',
      url,
      params,
      data,
      headers: { ...headers, ...clientOptions.headers },
      ...clientOptions,
    })
  }, mutationOptions)
}
