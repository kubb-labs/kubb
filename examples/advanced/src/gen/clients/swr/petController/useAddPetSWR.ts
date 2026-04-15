import useSWRMutation from 'swr/mutation'
import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405, AddPetError } from '../../../models/ts/petController/AddPet.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { addPet } from '../../axios/petService/addPet.ts'

export const addPetSWRMutationKey = () => [{ url: '/pet' }] as const

export type AddPetSWRMutationKey = ReturnType<typeof addPetSWRMutationKey>

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export function useAddPetSWR(
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<AddPetMutationResponse>,
      ResponseErrorConfig<AddPet405 | AddPetError>,
      AddPetSWRMutationKey | null,
      AddPetMutationRequest
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<AddPetMutationRequest>> & { client?: Client }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = addPetSWRMutationKey()

  return useSWRMutation<
    ResponseConfig<AddPetMutationResponse>,
    ResponseErrorConfig<AddPet405 | AddPetError>,
    AddPetSWRMutationKey | null,
    AddPetMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return addPet({ data }, config)
    },
    mutationOptions,
  )
}
