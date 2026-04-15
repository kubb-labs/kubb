import useSWRMutation from 'swr/mutation'
import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetMutationRequest,
  UpdatePetMutationResponse,
  UpdatePet400,
  UpdatePet404,
  UpdatePet405,
} from '../../../models/ts/petController/UpdatePet.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { updatePet } from '../../axios/petService/updatePet.ts'

export const updatePetSWRMutationKey = () => [{ url: '/pet' }] as const

export type UpdatePetSWRMutationKey = ReturnType<typeof updatePetSWRMutationKey>

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export function useUpdatePetSWR(
  options: {
    mutation?: SWRMutationConfiguration<
      ResponseConfig<UpdatePetMutationResponse>,
      ResponseErrorConfig<UpdatePet400 | UpdatePet404 | UpdatePet405>,
      UpdatePetSWRMutationKey | null,
      UpdatePetMutationRequest
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<UpdatePetMutationRequest>> & { client?: Client }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = updatePetSWRMutationKey()

  return useSWRMutation<
    ResponseConfig<UpdatePetMutationResponse>,
    ResponseErrorConfig<UpdatePet400 | UpdatePet404 | UpdatePet405>,
    UpdatePetSWRMutationKey | null,
    UpdatePetMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return updatePet({ data }, config)
    },
    mutationOptions,
  )
}
