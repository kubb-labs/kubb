import client from '@kubb/plugin-client/clients/axios'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../models/DeletePet'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { MutationObserverOptions } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { useMutation } from '@tanstack/vue-query'

export const deletePetMutationKey = () => [{ url: '/pet/{petId}' }] as const

export type DeletePetMutationKey = ReturnType<typeof deletePetMutationKey>

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId}
 */
async function deletePet({ petId, headers }: { petId: DeletePetPathParams['petId']; headers?: DeletePetHeaderParams }, config: Partial<RequestConfig> = {}) {
  const res = await client<DeletePetMutationResponse, DeletePet400, unknown>({
    method: 'DELETE',
    url: `/pet/${petId}`,
    headers: { ...headers, ...config.headers },
    ...config,
  })
  return res.data
}

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId}
 */
export function useDeletePet(
  options: {
    mutation?: MutationObserverOptions<
      DeletePetMutationResponse,
      DeletePet400,
      { petId: MaybeRef<DeletePetPathParams['petId']>; headers?: MaybeRef<DeletePetHeaderParams> }
    >
    client?: Partial<RequestConfig>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? deletePetMutationKey()

  return useMutation<DeletePetMutationResponse, DeletePet400, { petId: DeletePetPathParams['petId']; headers?: DeletePetHeaderParams }>({
    mutationFn: async ({ petId, headers }) => {
      return deletePet({ petId, headers }, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}