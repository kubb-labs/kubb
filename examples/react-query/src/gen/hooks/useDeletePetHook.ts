import client from '@kubb/plugin-client/client'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../models/DeletePet.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * @link /pet/:petId
 */
async function deletePet(
  {
    petId,
  }: {
    petId: DeletePetPathParams['petId']
  },
  headers?: DeletePetHeaderParams,
  config: Partial<RequestConfig> = {},
) {
  const res = await client<DeletePetMutationResponse, DeletePet400, unknown>({
    method: 'delete',
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
export function useDeletePetHook(
  options: {
    mutation?: UseMutationOptions<
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
  return useMutation({
    mutationFn: async ({
      petId,
      headers,
    }: {
      petId: DeletePetPathParams['petId']
      headers?: DeletePetHeaderParams
    }) => {
      return deletePet({ petId }, headers, config)
    },
    ...mutationOptions,
  })
}
