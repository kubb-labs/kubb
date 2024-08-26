import type {
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
} from '../../../models/ts/petsController/CreatePets'
import type { UseMutationOptions } from '@tanstack/react-query'
import client from '../../../../tanstack-query-client.ts'
import { useMutation } from '@tanstack/react-query'

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
 * @link /pets/:uuid
 */
export function useCreatePets(
  options: {
    mutation?: UseMutationOptions<
      CreatePets['response'],
      CreatePets['error'],
      {
        uuid: CreatePetsPathParams['uuid']
        params?: CreatePets['queryParams']
        headers: CreatePets['headerParams']
        data: CreatePets['request']
      }
    >
    client?: CreatePets['client']['parameters']
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  return useMutation({
    mutationFn: async ({ uuid, headers, data, params }) => {
      const res = await client<CreatePets['data'], CreatePets['error'], CreatePets['request']>({
        method: 'post',
        url: `/pets/${uuid}`,
        params,
        data,
        headers: { ...headers, ...clientOptions.headers },
        ...clientOptions,
      })
      return res
    },
    ...mutationOptions,
  })
}
