import useSWRMutation from 'swr/mutation'
import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { DeletePetPathParams, DeletePetHeaderParams, DeletePetMutationResponse, DeletePet400 } from '../../../models/ts/petController/DeletePet.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { deletePet } from '../../axios/petService/deletePet.ts'

export const deletePetSWRMutationKey = () => [{ url: '/pet/:petId:search' }] as const

export type DeletePetSWRMutationKey = ReturnType<typeof deletePetSWRMutationKey>

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId:search}
 */
export function useDeletePetSWR(
  { petId }: { petId: DeletePetPathParams['petId'] },
  headers?: DeletePetHeaderParams,
  options: {
    mutation?: SWRMutationConfiguration<ResponseConfig<DeletePetMutationResponse>, ResponseErrorConfig<DeletePet400>, DeletePetSWRMutationKey | null, never> & {
      throwOnError?: boolean
    }
    client?: Partial<RequestConfig> & { client?: Client }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = deletePetSWRMutationKey()

  return useSWRMutation<ResponseConfig<DeletePetMutationResponse>, ResponseErrorConfig<DeletePet400>, DeletePetSWRMutationKey | null>(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return deletePet({ petId, headers }, config)
    },
    mutationOptions,
  )
}
