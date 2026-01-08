import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { DeletePetResponseData3, DeletePetPathParams3, DeletePetHeaderParams3, DeletePetStatus4003 } from '../../../models/ts/petController/DeletePet.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { deletePet } from '../../axios/petService/deletePet.ts'

export const deletePetMutationKeySWR = () => [{ url: '/pet/:petId:search' }] as const

export type DeletePetMutationKeySWR = ReturnType<typeof deletePetMutationKeySWR>

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId:search}
 */
export function useDeletePetSWR(
  { petId }: { petId: DeletePetPathParams3['petId'] },
  headers?: DeletePetHeaderParams3,
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<DeletePetResponseData3>,
      ResponseErrorConfig<DeletePetStatus4003>,
      DeletePetMutationKeySWR | null,
      never
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = deletePetMutationKeySWR()

  return useSWRMutation<ResponseConfig<DeletePetResponseData3>, ResponseErrorConfig<DeletePetStatus4003>, DeletePetMutationKeySWR | null>(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return deletePet({ petId, headers }, config)
    },
    mutationOptions,
  )
}
