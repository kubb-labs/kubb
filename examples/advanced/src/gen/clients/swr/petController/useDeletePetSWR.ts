import client from '../../../../swr-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseErrorConfig } from '../../../../swr-client.ts'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../../../models/ts/petController/DeletePet.ts'
import { deletePetMutationResponseSchema } from '../../../zod/petController/deletePetSchema.ts'

export const deletePetMutationKeySWR = () => [{ url: '/pet/{petId}' }] as const

export type DeletePetMutationKeySWR = ReturnType<typeof deletePetMutationKeySWR>

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId}
 */
async function deletePetSWR({ petId, headers }: { petId: DeletePetPathParams['petId']; headers?: DeletePetHeaderParams }, config: Partial<RequestConfig> = {}) {
  const res = await client<DeletePetMutationResponse, ResponseErrorConfig<DeletePet400>, unknown>({
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
 * {@link /pet/:petId}
 */
export function useDeletePetSWR(
  { petId }: { petId: DeletePetPathParams['petId'] },
  headers?: DeletePetHeaderParams,
  options: {
    mutation?: Parameters<typeof useSWRMutation<DeletePetMutationResponse, ResponseErrorConfig<DeletePet400>, DeletePetMutationKeySWR>>[2]
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = deletePetMutationKeySWR()

  return useSWRMutation<DeletePetMutationResponse, ResponseErrorConfig<DeletePet400>, DeletePetMutationKeySWR | null>(
    shouldFetch ? mutationKey : null,
    async (_url) => {
      return deletePetSWR({ petId, headers }, config)
    },
    mutationOptions,
  )
}
