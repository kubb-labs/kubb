import client from '../../../../swr-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig } from '../../../../swr-client.ts'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../../../models/ts/petController/DeletePet.ts'
import { deletePetMutationResponseSchema } from '../../../zod/petController/deletePetSchema.ts'

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
  return deletePetMutationResponseSchema.parse(res.data)
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
    mutation?: Parameters<typeof useSWRMutation<DeletePetMutationResponse, DeletePet400, DeletePetMutationKey>>[2]
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = deletePetMutationKey()
  return useSWRMutation<DeletePetMutationResponse, DeletePet400, DeletePetMutationKey | null>(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return deletePet(petId, headers, config)
    },
    mutationOptions,
  )
}
