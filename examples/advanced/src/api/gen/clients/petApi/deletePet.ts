/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 */

import client from '@/lib/axios-client'
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from '../../types/petApi/DeletePet.ts'
import type { RequestConfig, ResponseErrorConfig } from '@/lib/axios-client'

export function getDeletePetUrl({ petId }: { petId: DeletePetPathParams['petId'] }) {
  return `/pet/${petId}` as const
}

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
    url: getDeletePetUrl({ petId }).toString(),
    ...requestConfig,
    headers: { ...headers, ...requestConfig.headers },
  })
  return res.data
}
