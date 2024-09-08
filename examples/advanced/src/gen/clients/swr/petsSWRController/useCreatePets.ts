import client from '../../../../swr-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig } from '../../../../swr-client.ts'
import type {
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
} from '../../../models/ts/petsController/CreatePets.ts'
import type { Key } from 'swr'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { createPetsMutationResponseSchema } from '../../../zod/petsController/createPetsSchema.ts'

/**
 * @summary Create a pet
 * @link /pets/:uuid
 */
async function createPets(
  uuid: CreatePetsPathParams['uuid'],
  data: CreatePetsMutationRequest,
  headers: CreatePetsHeaderParams,
  params?: CreatePetsQueryParams,
  config: Partial<RequestConfig<CreatePetsMutationRequest>> = {},
) {
  const res = await client<CreatePetsMutationResponse, unknown, CreatePetsMutationRequest>({
    method: 'post',
    url: `/pets/${uuid}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    data,
    headers: { ...headers, ...config.headers },
    ...config,
  })
  return createPetsMutationResponseSchema.parse(res.data)
}

/**
 * @summary Create a pet
 * @link /pets/:uuid
 */
export function useCreatePets(
  uuid: CreatePetsPathParams['uuid'],
  headers: CreatePetsHeaderParams,
  params?: CreatePetsQueryParams,
  options: {
    mutation?: SWRMutationConfiguration<CreatePetsMutationResponse, unknown>
    client?: Partial<RequestConfig<CreatePetsMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const swrKey = [`/pets/${uuid}`, params] as const
  return useSWRMutation<CreatePetsMutationResponse, unknown, Key>(
    shouldFetch ? swrKey : null,
    async (_url, { arg: data }) => {
      return createPets(uuid, data, headers, params, config)
    },
    mutationOptions,
  )
}
