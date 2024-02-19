import useSWRMutation from 'swr/mutation'
import client from '../../../../swr-client.ts'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import type {
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
} from '../../../models/ts/petsController/CreatePets'

type CreatePetsClient = typeof client<CreatePetsMutationResponse, never, CreatePetsMutationRequest>
type CreatePets = {
  data: CreatePetsMutationResponse
  error: never
  request: CreatePetsMutationRequest
  pathParams: CreatePetsPathParams
  queryParams: CreatePetsQueryParams
  headerParams: CreatePetsHeaderParams
  response: Awaited<ReturnType<CreatePetsClient>>
  client: {
    parameters: Partial<Parameters<CreatePetsClient>[0]>
    return: Awaited<ReturnType<CreatePetsClient>>
  }
}
/**
 * @summary Create a pet
 * @link /pets/:uuid */
export function useCreatePets(uuid: CreatePetsPathParams['uuid'], params?: CreatePets['queryParams'], headers?: CreatePets['headerParams'], options?: {
  mutation?: SWRMutationConfiguration<CreatePets['response'], CreatePets['error']>
  client?: CreatePets['client']['parameters']
  shouldFetch?: boolean
}): SWRMutationResponse<CreatePets['response'], CreatePets['error']> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pets/${uuid}` as const
  return useSWRMutation<
    CreatePets['response'],
    CreatePets['error'],
    [
      typeof url,
      typeof params,
    ] | null
  >(shouldFetch ? [url, params] : null, async (_url, { arg: data }) => {
    const res = await client<CreatePets['data'], CreatePets['error'], CreatePets['request']>({
      method: 'post',
      url,
      params,
      data,
      headers: { ...headers, ...clientOptions.headers },
      ...clientOptions,
    })
    return res
  }, mutationOptions)
}
