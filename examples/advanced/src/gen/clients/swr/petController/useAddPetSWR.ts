import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../swr-client.ts'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../../../models/ts/petController/AddPet.ts'
import { addPet } from '../../axios/petService/addPet.ts'

export const addPetMutationKeySWR = () => [{ url: '/pet' }] as const

export type AddPetMutationKeySWR = ReturnType<typeof addPetMutationKeySWR>

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export function useAddPetSWR(
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<ResponseConfig<AddPetMutationResponse>, ResponseErrorConfig<AddPet405>, AddPetMutationKeySWR, AddPetMutationRequest>
    >[2]
    client?: Partial<RequestConfig<AddPetMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = addPetMutationKeySWR()

  return useSWRMutation<ResponseConfig<AddPetMutationResponse>, ResponseErrorConfig<AddPet405>, AddPetMutationKeySWR | null, AddPetMutationRequest>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return addPet({ data }, config)
    },
    mutationOptions,
  )
}
