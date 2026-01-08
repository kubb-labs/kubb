import type { SWRMutationConfiguration } from 'swr/mutation'
import useSWRMutation from 'swr/mutation'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { AddPetRequestData, AddPetResponseData, AddPetStatus405 } from '../../../models/ts/petController/AddPet.ts'
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
      ResponseConfig<AddPetResponseData>,
      ResponseErrorConfig<AddPetStatus405>,
      AddPetMutationKeySWR | null,
      AddPetRequestData
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<AddPetRequestData>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = addPetMutationKeySWR()

  return useSWRMutation<ResponseConfig<AddPetResponseData>, ResponseErrorConfig<AddPetStatus405>, AddPetMutationKeySWR | null, AddPetRequestData>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return addPet({ data }, config)
    },
    mutationOptions,
  )
}
