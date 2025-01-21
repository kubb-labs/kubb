import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../swr-client.ts'
import type {
  UpdatePetMutationRequest,
  UpdatePetMutationResponse,
  UpdatePet400,
  UpdatePet404,
  UpdatePet405,
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
    mutation?: Parameters<
      typeof useSWRMutation<
        ResponseConfig<UpdatePetMutationResponse>,
        ResponseErrorConfig<UpdatePet400 | UpdatePet404 | UpdatePet405>,
        UpdatePetMutationKeySWR,
        UpdatePetMutationRequest
      >
    >[2]
    client?: Partial<RequestConfig<UpdatePetMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = updatePetMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<UpdatePetMutationResponse>,
    ResponseErrorConfig<UpdatePet400 | UpdatePet404 | UpdatePet405>,
    UpdatePetMutationKeySWR | null,
    UpdatePetMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return updatePet({ data }, config)
    },
    mutationOptions,
  )
}
