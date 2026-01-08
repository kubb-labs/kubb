import type { SWRMutationConfiguration } from 'swr/mutation'
import useSWRMutation from 'swr/mutation'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetRequestData,
  UpdatePetResponseData,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
} from '../../../models/ts/petController/UpdatePet.ts'
import { updatePet } from '../../axios/petService/updatePet.ts'

export const updatePetMutationKeySWR = () => [{ url: '/pet' }] as const

export type UpdatePetMutationKeySWR = ReturnType<typeof updatePetMutationKeySWR>

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export function useUpdatePetSWR(
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<UpdatePetResponseData>,
      ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>,
      UpdatePetMutationKeySWR | null,
      UpdatePetRequestData
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<UpdatePetRequestData>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = updatePetMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<UpdatePetResponseData>,
    ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>,
    UpdatePetMutationKeySWR | null,
    UpdatePetRequestData
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return updatePet({ data }, config)
    },
    mutationOptions,
  )
}
