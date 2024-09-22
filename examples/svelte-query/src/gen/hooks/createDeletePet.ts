import client from '@kubb/plugin-client/client'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../models/DeletePet.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { CreateMutationOptions } from '@tanstack/svelte-query'
import { createMutation } from '@tanstack/svelte-query'

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
  return createMutation({
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
  })
}
