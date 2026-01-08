import type { SWRMutationConfiguration } from 'swr/mutation'
import useSWRMutation from 'swr/mutation'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  CreatePetsHeaderParams,
  CreatePetsPathParams,
  CreatePetsQueryParams,
  CreatePetsRequestData,
  CreatePetsResponseData,
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
      ResponseConfig<CreatePetsResponseData>,
      ResponseErrorConfig<Error>,
      CreatePetsMutationKeySWR | null,
      CreatePetsRequestData
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<CreatePetsRequestData>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = createPetsMutationKeySWR()

  return useSWRMutation<ResponseConfig<CreatePetsResponseData>, ResponseErrorConfig<Error>, CreatePetsMutationKeySWR | null, CreatePetsRequestData>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return createPets({ uuid, data, headers, params }, config)
    },
    mutationOptions,
  )
}
