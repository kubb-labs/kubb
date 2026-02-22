import type { ResponseErrorConfig } from './test/.kubb/fetch'
import { fetch } from './test/.kubb/fetch'

/**
 * @description Returns all `pets` from the system \n that the user has access to
 * @summary List all pets
 * {@link /pets}
 */
export async function listPetsHandler({ params }: { params?: ListPetsQueryParams } = {}) {
  const res = await fetch<ListPetsQueryResponse, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: `/pets`, baseURL: `${123456}`, params })
}
