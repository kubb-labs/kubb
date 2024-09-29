import client from '../../../../swr-client.js'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig } from '../../../../swr-client.js'
import type {
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsHeaderParams,
} from '../../../models/ts/petsController/CreatePets.js'
import { createPetsMutationResponseSchema } from '../../../zod/petsController/createPetsSchema.js'

export const createPetsMutationKeySWR = () => [{ url: '/pets/{uuid}' }] as const

export type CreatePetsMutationKeySWR = ReturnType<typeof createPetsMutationKeySWR>

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
  const res = await client<CreatePetsMutationResponse, Error, CreatePetsMutationRequest>({
    method: 'POST',
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
export function useCreatePetsSWR(
  uuid: CreatePetsPathParams['uuid'],
  headers: CreatePetsHeaderParams,
  params?: CreatePetsQueryParams,
  options: {
    mutation?: Parameters<typeof useSWRMutation<CreatePetsMutationResponse, Error, CreatePetsMutationKeySWR, CreatePetsMutationRequest>>[2]
    client?: Partial<RequestConfig<CreatePetsMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = createPetsMutationKeySWR()
  return useSWRMutation<CreatePetsMutationResponse, Error, CreatePetsMutationKeySWR | null, CreatePetsMutationRequest>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return createPets(uuid, data, headers, params, config)
    },
    mutationOptions,
  )
}
