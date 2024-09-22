import client from '@kubb/plugin-client/client'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../models/DeletePet.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { CreateMutationOptions, CreateMutationResult, MutationKey } from '@tanstack/svelte-query'
import { createMutation } from '@tanstack/svelte-query'

export const deletePetMutationKey = () => [{ url: '/pet/{petId}' }] as const

export type DeletePetMutationKey = ReturnType<typeof deletePetMutationKey>

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
async function deletePet(petId: DeletePetPathParams['petId'], headers?: DeletePetHeaderParams, config: Partial<RequestConfig> = {}) {
  const res = await client<DeletePetMutationResponse, DeletePet400, unknown>({
    method: 'DELETE',
    url: `/pet/${petId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    headers: { ...headers, ...config.headers },
    ...config,
  })
  return res.data
}

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
export function createDeletePet(
  options: {
    mutation?: CreateMutationOptions<
      DeletePetMutationResponse,
      DeletePet400,
      {
        petId: DeletePetPathParams['petId']
        headers?: DeletePetHeaderParams
      }
    >
    client?: Partial<RequestConfig>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? deletePetMutationKey()
  const mutation = createMutation({
    mutationFn: async ({
      petId,
      headers,
    }: {
      petId: DeletePetPathParams['petId']
      headers?: DeletePetHeaderParams
    }) => {
      return deletePet(petId, headers, config)
    },
    ...mutationOptions,
  }) as CreateMutationResult<DeletePetMutationResponse, DeletePet400> & {
    mutationKey: MutationKey
  }
  mutation.mutationKey = mutationKey as MutationKey
  return mutation
}
