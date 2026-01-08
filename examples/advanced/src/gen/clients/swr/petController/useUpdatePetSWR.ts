import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetRequestData3,
  UpdatePetResponseData3,
  UpdatePetStatus4003,
  UpdatePetStatus4043,
  UpdatePetStatus4053,
} from '../../../models/ts/petController/UpdatePet.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
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
      ResponseConfig<UpdatePetResponseData3>,
      ResponseErrorConfig<UpdatePetStatus4003 | UpdatePetStatus4043 | UpdatePetStatus4053>,
      UpdatePetMutationKeySWR | null,
      UpdatePetRequestData3
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<UpdatePetRequestData3>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = updatePetMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<UpdatePetResponseData3>,
    ResponseErrorConfig<UpdatePetStatus4003 | UpdatePetStatus4043 | UpdatePetStatus4053>,
    UpdatePetMutationKeySWR | null,
    UpdatePetRequestData3
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return updatePet({ data }, config)
    },
    mutationOptions,
  )
}
