import client from '@kubb/plugin-client/clients/axios'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../../models/UpdatePetWithForm.ts'
import type { RequestConfig } from '@kubb/plugin-client/clients/axios'
import type { QueryKey, UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'

export const updatePetWithFormSuspenseQueryKey = (pet_id: UpdatePetWithFormPathParams['pet_id'], params?: UpdatePetWithFormQueryParams) =>
  ['v5', { url: '/pet/:pet_id', params: { pet_id: pet_id } }, ...(params ? [params] : [])] as const

export type UpdatePetWithFormSuspenseQueryKey = ReturnType<typeof updatePetWithFormSuspenseQueryKey>

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:pet_id}
 */
async function updatePetWithFormHook(
  pet_id: UpdatePetWithFormPathParams['pet_id'],
  params?: UpdatePetWithFormQueryParams,
  config: Partial<RequestConfig> = {},
) {
  const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, unknown>({ method: 'POST', url: `/pet/${pet_id}`, params, ...config })
  return res.data
}

export function updatePetWithFormSuspenseQueryOptionsHook(
  pet_id: UpdatePetWithFormPathParams['pet_id'],
  params?: UpdatePetWithFormQueryParams,
  config: Partial<RequestConfig> = {},
) {
  const queryKey = updatePetWithFormSuspenseQueryKey(pet_id, params)
  return queryOptions({
    enabled: !!pet_id,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return updatePetWithFormHook(pet_id, params, config)
    },
  })
}

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:pet_id}
 */
export function useUpdatePetWithFormSuspenseHook<
  TData = UpdatePetWithFormMutationResponse,
  TQueryData = UpdatePetWithFormMutationResponse,
  TQueryKey extends QueryKey = UpdatePetWithFormSuspenseQueryKey,
>(
  pet_id: UpdatePetWithFormPathParams['pet_id'],
  params?: UpdatePetWithFormQueryParams,
  options: {
    query?: Partial<UseSuspenseQueryOptions<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, TData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? updatePetWithFormSuspenseQueryKey(pet_id, params)

  const query = useSuspenseQuery({
    ...(updatePetWithFormSuspenseQueryOptionsHook(pet_id, params, config) as unknown as UseSuspenseQueryOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<UseSuspenseQueryOptions, 'queryKey'>),
  }) as UseSuspenseQueryResult<TData, UpdatePetWithForm405> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
