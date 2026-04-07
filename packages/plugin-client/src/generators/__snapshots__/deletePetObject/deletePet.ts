/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/fetch'
import type { DeletePetPathPetId, DeletePetHeaderApiKey, DeletePetResponse } from './DeletePet'
import { fetch } from './.kubb/fetch'

export function getDeletePetUrl({ petId }: { petId: DeletePetPathPetId }) {
  const res = { method: 'DELETE', url: `/pet/${petId}` as const }

  return res
}

/**
 * {@link /pet/:petId}
 */
export async function deletePet(
  { petId }: { petId: DeletePetPathPetId },
  headers?: { api_key?: DeletePetHeaderApiKey },
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<DeletePetResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'DELETE',
    url: getDeletePetUrl({ petId }).url.toString(),
    ...requestConfig,
    headers: { ...headers, ...requestConfig.headers },
  })

  return res.data
}
