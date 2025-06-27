import client from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../../../models/ts/petController/DeletePet.ts'
import { deletePet } from '../../axios/petService/deletePet.ts'

export const deletePetMutationKeySWR = () => [{ url: '/pet/{petId}' }] as const

export type DeletePetMutationKeySWR = ReturnType<typeof deletePetMutationKeySWR>

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId}
 */
export function useDeletePetSWR(
  { petId }: { petId: DeletePetPathParams['petId'] },
  headers?: DeletePetHeaderParams,
  options: {
    mutation?: Parameters<typeof useSWRMutation<ResponseConfig<DeletePetMutationResponse>, ResponseErrorConfig<DeletePet400>, DeletePetMutationKeySWR>>[2]
    client?: Partial<RequestConfig> & { client?: typeof client }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = deletePetMutationKeySWR()

  return useSWRMutation<ResponseConfig<DeletePetMutationResponse>, ResponseErrorConfig<DeletePet400>, DeletePetMutationKeySWR | null>(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return deletePet({ petId, headers }, config)
    },
    mutationOptions,
  )
}
