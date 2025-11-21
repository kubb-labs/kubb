import type { SWRMutationConfiguration } from 'swr/mutation'
import useSWRMutation from 'swr/mutation'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  CreatePetsHeaderParams,
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePetsPathParams,
  CreatePetsQueryParams,
} from '../../../models/ts/petsController/CreatePets.ts'
import { createPets } from '../../axios/petsService/createPets.ts'

export const createPetsMutationKeySWR = () => [{ url: '/pets/:uuid' }] as const

export type CreatePetsMutationKeySWR = ReturnType<typeof createPetsMutationKeySWR>

/**
 * @summary Create a pet
 * {@link /pets/:uuid}
 */
export function useCreatePetsSWR(
  { uuid }: { uuid: CreatePetsPathParams['uuid'] },
  headers: CreatePetsHeaderParams,
  params?: CreatePetsQueryParams,
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<CreatePetsMutationResponse>,
      ResponseErrorConfig<Error>,
      CreatePetsMutationKeySWR | null,
      CreatePetsMutationRequest
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<CreatePetsMutationRequest>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = createPetsMutationKeySWR()

  return useSWRMutation<ResponseConfig<CreatePetsMutationResponse>, ResponseErrorConfig<Error>, CreatePetsMutationKeySWR | null, CreatePetsMutationRequest>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return createPets({ uuid, data, headers, params }, config)
    },
    mutationOptions,
  )
}
