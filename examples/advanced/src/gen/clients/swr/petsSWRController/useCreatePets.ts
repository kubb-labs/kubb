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
import { createPetsMutationResponseSchema } from '../../../zod/petsController/createPetsSchema.ts'

export const createPetsMutationKey = () => [{ url: '/pets/{uuid}' }] as const

export type CreatePetsMutationKey = ReturnType<typeof createPetsMutationKey>

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
export function useCreatePets(
  uuid: CreatePetsPathParams['uuid'],
  headers: CreatePetsHeaderParams,
  params?: CreatePetsQueryParams,
  options: {
    mutation?: Parameters<typeof useSWRMutation<CreatePetsMutationResponse, Error, CreatePetsMutationKey, CreatePetsMutationRequest>>[2]
    client?: Partial<RequestConfig<CreatePetsMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = createPetsMutationKey()
  return useSWRMutation<CreatePetsMutationResponse, Error, CreatePetsMutationKey | null, CreatePetsMutationRequest>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return createPets(uuid, data, headers, params, config)
    },
    mutationOptions,
  )
}
