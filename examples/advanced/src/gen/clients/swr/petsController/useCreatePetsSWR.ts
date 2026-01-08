import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  CreatePetsRequestData3,
  CreatePetsResponseData3,
  CreatePetsPathParams3,
  CreatePetsQueryParams3,
  CreatePetsHeaderParams3,
} from '../../../models/ts/petsController/CreatePets.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { createPets } from '../../axios/petsService/createPets.ts'

export const createPetsMutationKeySWR = () => [{ url: '/pets/:uuid' }] as const

export type CreatePetsMutationKeySWR = ReturnType<typeof createPetsMutationKeySWR>

/**
 * @summary Create a pet
 * {@link /pets/:uuid}
 */
export function useCreatePetsSWR(
  { uuid }: { uuid: CreatePetsPathParams3['uuid'] },
  headers: CreatePetsHeaderParams3,
  params?: CreatePetsQueryParams3,
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<CreatePetsResponseData3>,
      ResponseErrorConfig<Error>,
      CreatePetsMutationKeySWR | null,
      CreatePetsRequestData3
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<CreatePetsRequestData3>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = createPetsMutationKeySWR()

  return useSWRMutation<ResponseConfig<CreatePetsResponseData3>, ResponseErrorConfig<Error>, CreatePetsMutationKeySWR | null, CreatePetsRequestData3>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return createPets({ uuid, data, headers, params }, config)
    },
    mutationOptions,
  )
}
