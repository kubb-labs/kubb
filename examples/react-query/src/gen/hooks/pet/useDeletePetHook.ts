import client from '@kubb/plugin-client/clients/axios'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../../models/DeletePet.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

export const deletePetMutationKey = () => [{ url: '/pet/{pet_id}' }] as const

export type DeletePetMutationKey = ReturnType<typeof deletePetMutationKey>

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:pet_id}
 */
export async function deletePetHook(
  { pet_id }: { pet_id: DeletePetPathParams['pet_id'] },
  headers?: DeletePetHeaderParams,
  config: Partial<RequestConfig> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<DeletePetMutationResponse, ResponseErrorConfig<DeletePet400>, unknown>({
    method: 'DELETE',
    url: `/pet/${pet_id}`,
    ...requestConfig,
    headers: { ...headers, ...requestConfig.headers },
  })
  return res.data
}

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:pet_id}
 */
export function useDeletePetHook(
  options: {
    mutation?: UseMutationOptions<
      DeletePetMutationResponse,
      ResponseErrorConfig<DeletePet400>,
      { pet_id: DeletePetPathParams['pet_id']; headers?: DeletePetHeaderParams }
    >
    client?: Partial<RequestConfig> & { client?: typeof client }
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? deletePetMutationKey()

  return useMutation<DeletePetMutationResponse, ResponseErrorConfig<DeletePet400>, { pet_id: DeletePetPathParams['pet_id']; headers?: DeletePetHeaderParams }>({
    mutationFn: async ({ pet_id, headers }) => {
      return deletePetHook({ pet_id }, headers, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}