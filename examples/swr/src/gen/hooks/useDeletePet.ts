import client from '@kubb/plugin-client/client'
import useSWRMutation from 'swr/mutation'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../models/DeletePet.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { Key } from 'swr'
import type { SWRMutationConfiguration } from 'swr/mutation'

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
export function useDeletePet(
  petId: DeletePetPathParams['petId'],
  headers?: DeletePetHeaderParams,
  options: {
    mutation?: SWRMutationConfiguration<DeletePetMutationResponse, DeletePet400>
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = deletePetMutationKey()
  return useSWRMutation<DeletePetMutationResponse, DeletePet400, Key>(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return deletePet(petId, headers, config)
    },
    mutationOptions,
  )
}
