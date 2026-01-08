import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { AddPetRequestData3, AddPetResponseData3, AddPetStatus4053 } from '../../../models/ts/petController/AddPet.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
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
    mutation?: SWRMutationConfiguration<
      ResponseConfig<AddPetResponseData3>,
      ResponseErrorConfig<AddPetStatus4053>,
      AddPetMutationKeySWR | null,
      AddPetRequestData3
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<AddPetRequestData3>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = addPetMutationKeySWR()

  return useSWRMutation<ResponseConfig<AddPetResponseData3>, ResponseErrorConfig<AddPetStatus4053>, AddPetMutationKeySWR | null, AddPetRequestData3>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return addPet({ data }, config)
    },
    mutationOptions,
  )
}
