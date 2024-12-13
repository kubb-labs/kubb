import client from '@kubb/plugin-client/clients/axios'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../models/DeletePet.ts'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { CreateMutationOptions } from '@tanstack/svelte-query'
import { createMutation } from '@tanstack/svelte-query'

export const deletePetMutationKey = () => [{ url: '/pet/{pet_id}' }] as const

export type DeletePetMutationKey = ReturnType<typeof deletePetMutationKey>

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:pet_id}
 */
async function deletePet(pet_id: DeletePetPathParams['pet_id'], headers?: DeletePetHeaderParams, config: Partial<RequestConfig> = {}) {
  const res = await client<DeletePetMutationResponse, DeletePet400, unknown>({
    method: 'DELETE',
    url: `/pet/${pet_id}`,
    headers: { ...headers, ...config.headers },
    ...config,
  })
  return res.data
}

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:pet_id}
 */
export function createDeletePet(
  options: {
    mutation?: CreateMutationOptions<
      DeletePetMutationResponse,
      DeletePet400,
      {
        pet_id: DeletePetPathParams['pet_id']
        headers?: DeletePetHeaderParams
      }
    >
    client?: Partial<RequestConfig>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? deletePetMutationKey()
  return createMutation<
    DeletePetMutationResponse,
    DeletePet400,
    {
      pet_id: DeletePetPathParams['pet_id']
      headers?: DeletePetHeaderParams
    }
  >({
    mutationFn: async ({ pet_id, headers }) => {
      return deletePet(pet_id, headers, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}
