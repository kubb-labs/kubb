import client from '@kubb/plugin-client/clients/axios'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../models/UpdatePetWithForm.ts'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { QueryKey, CreateBaseQueryOptions, CreateQueryResult } from '@tanstack/svelte-query'
import { queryOptions, createQuery } from '@tanstack/svelte-query'

export const updatePetWithFormQueryKey = (petId: UpdatePetWithFormPathParams['pet_id'], params?: UpdatePetWithFormQueryParams) =>
  [{ url: '/pet/:pet_id', params: { petId: petId } }, ...(params ? [params] : [])] as const

export type UpdatePetWithFormQueryKey = ReturnType<typeof updatePetWithFormQueryKey>

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:pet_id}
 */
async function updatePetWithForm(petId: UpdatePetWithFormPathParams['pet_id'], params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, unknown>({ method: 'POST', url: `/pet/${petId}`, params, ...config })
  return res.data
}

export function updatePetWithFormQueryOptions(
  petId: UpdatePetWithFormPathParams['pet_id'],
  params?: UpdatePetWithFormQueryParams,
  config: Partial<RequestConfig> = {},
) {
  const queryKey = updatePetWithFormQueryKey(petId, params)
  return queryOptions({
    enabled: !!petId,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return updatePetWithForm(petId, params, config)
    },
  })
}

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:pet_id}
 */
export function createUpdatePetWithForm<
  TData = UpdatePetWithFormMutationResponse,
  TQueryData = UpdatePetWithFormMutationResponse,
  TQueryKey extends QueryKey = UpdatePetWithFormQueryKey,
>(
  petId: UpdatePetWithFormPathParams['pet_id'],
  params?: UpdatePetWithFormQueryParams,
  options: {
    query?: Partial<CreateBaseQueryOptions<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? updatePetWithFormQueryKey(petId, params)
  const query = createQuery({
    ...(updatePetWithFormQueryOptions(petId, params, config) as unknown as CreateBaseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<CreateBaseQueryOptions, 'queryKey'>),
  }) as CreateQueryResult<TData, UpdatePetWithForm405> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
