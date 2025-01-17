import client from '../../../../tanstack-query-client'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../tanstack-query-client'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../../../models/ts/petController/DeletePet.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { deletePetMutationResponseSchema } from '../../../zod/petController/deletePetSchema.ts'
import { useMutation } from '@tanstack/react-query'

export const deletePetMutationKey = () => [{ url: '/pet/{petId}' }] as const

export type DeletePetMutationKey = ReturnType<typeof deletePetMutationKey>

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId}
 */
async function deletePet({ petId, headers }: { petId: DeletePetPathParams['petId']; headers?: DeletePetHeaderParams }, config: Partial<RequestConfig> = {}) {
  const res = await client<DeletePetMutationResponse, ResponseErrorConfig<DeletePet400>, unknown>({
    method: 'DELETE',
    url: `/pet/${petId}`,
    headers: { ...headers, ...config.headers },
    ...config,
  })
  return { ...res, data: deletePetMutationResponseSchema.parse(res.data) }
}

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId}
 */
export function useDeletePet(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<DeletePetMutationResponse>,
      ResponseErrorConfig<DeletePet400>,
      { petId: DeletePetPathParams['petId']; headers?: DeletePetHeaderParams }
    >
    client?: Partial<RequestConfig>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? deletePetMutationKey()

  return useMutation<
    ResponseConfig<DeletePetMutationResponse>,
    ResponseErrorConfig<DeletePet400>,
    { petId: DeletePetPathParams['petId']; headers?: DeletePetHeaderParams }
  >({
    mutationFn: async ({ petId, headers }) => {
      return deletePet({ petId, headers }, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}
