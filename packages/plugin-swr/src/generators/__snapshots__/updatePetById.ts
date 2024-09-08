import client from '@kubb/plugin-client/client'
import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'

type UpdatePetByIdClient = typeof client<UpdatePetById, UpdatePetById, never>

type UpdatePetById = {
  data: UpdatePetById
  error: UpdatePetById
  request: never
  pathParams: UpdatePetById
  queryParams: UpdatePetById
  headerParams: never
  response: UpdatePetById
  client: {
    parameters: Partial<Parameters<UpdatePetByIdClient>[0]>
    return: Awaited<ReturnType<UpdatePetByIdClient>>
  }
}

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function updatePetById(
  petId: UpdatePetById['petId'],
  params?: UpdatePetById['queryParams'],
  options?: {
    mutation?: SWRMutationConfiguration<UpdatePetById['response'], UpdatePetById['error']>
    client?: UpdatePetById['client']['parameters']
    shouldFetch?: boolean
  },
): SWRMutationResponse<UpdatePetById['response'], UpdatePetById['error']> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pet/${petId}` as const
  return useSWRMutation<UpdatePetById['response'], UpdatePetById['error'], [typeof url, typeof params] | null>(
    shouldFetch ? [url, params] : null,
    async (_url) => {
      const res = await client<UpdatePetById['data'], UpdatePetById['error']>({
        method: 'post',
        url,
        params,
        ...clientOptions,
      })
      return res.data
    },
    mutationOptions,
  )
}
