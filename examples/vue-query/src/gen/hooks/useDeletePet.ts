import client from '@kubb/plugin-client/clients/axios'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../models/DeletePet.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
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
export async function deletePet(
  { petId, headers }: { petId: DeletePetPathParams['petId']; headers?: DeletePetHeaderParams },
  config: Partial<RequestConfig> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<DeletePetMutationResponse, ResponseErrorConfig<DeletePet400>, unknown>({
    method: 'DELETE',
    url: `/pet/${petId}`,
    ...requestConfig,
    headers: { ...headers, ...requestConfig.headers },
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
      ResponseErrorConfig<DeletePet400>,
      { petId: MaybeRef<DeletePetPathParams['petId']>; headers?: MaybeRef<DeletePetHeaderParams> }
    >
    client?: Partial<RequestConfig> & { client?: typeof client }
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? deletePetMutationKey()

  return useMutation<DeletePetMutationResponse, ResponseErrorConfig<DeletePet400>, { petId: DeletePetPathParams['petId']; headers?: DeletePetHeaderParams }>({
    mutationFn: async ({ petId, headers }) => {
      return deletePet({ petId, headers }, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}
